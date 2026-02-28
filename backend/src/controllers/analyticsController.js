const pool = require('../config/database');
const { cacheGet, cacheSet } = require('../config/redis');

const getSummary = async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const cacheKey = `analytics:${userId || 'admin'}:summary:${year || 'all'}:${month || 'all'}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    let conditions = [];
    let params = [];
    let pi = 1;

    if (userId) {
      conditions.push(`user_id = $${pi++}`);
      params.push(userId);
    }
    if (year) {
      conditions.push(`EXTRACT(YEAR FROM date) = $${pi++}`);
      params.push(parseInt(year));
    }
    if (month) {
      conditions.push(`EXTRACT(MONTH FROM date) = $${pi++}`);
      params.push(parseInt(month));
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
        COUNT(*) AS total_transactions,
        COUNT(CASE WHEN type = 'income' THEN 1 END) AS income_count,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) AS expense_count
       FROM transactions ${where}`,
      params
    );

    const summary = {
      totalIncome: parseFloat(rows[0].total_income) || 0,
      totalExpense: parseFloat(rows[0].total_expense) || 0,
      netBalance: (parseFloat(rows[0].total_income) || 0) - (parseFloat(rows[0].total_expense) || 0),
      totalTransactions: parseInt(rows[0].total_transactions),
      incomeCount: parseInt(rows[0].income_count),
      expenseCount: parseInt(rows[0].expense_count),
    };

    await cacheSet(cacheKey, summary, 900);
    res.json(summary);
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCategoryBreakdown = async (req, res) => {
  try {
    const { year, type = 'expense' } = req.query;
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const cacheKey = `analytics:${userId || 'admin'}:category:${year || 'all'}:${type}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ data: cached, fromCache: true });

    let conditions = [`type = $1`];
    let params = [type];
    let pi = 2;

    if (userId) {
      conditions.push(`user_id = $${pi++}`);
      params.push(userId);
    }
    if (year) {
      conditions.push(`EXTRACT(YEAR FROM date) = $${pi++}`);
      params.push(parseInt(year));
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await pool.query(
      `SELECT category, SUM(amount) as total, COUNT(*) as count
       FROM transactions ${where}
       GROUP BY category ORDER BY total DESC`,
      params
    );

    await cacheSet(cacheKey, rows, 900);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMonthlyTrends = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const cacheKey = `analytics:${userId || 'admin'}:monthly:${currentYear}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ data: cached, fromCache: true });

    let conditions = [`EXTRACT(YEAR FROM date) = $1`];
    let params = [parseInt(currentYear)];
    let pi = 2;

    if (userId) {
      conditions.push(`user_id = $${pi++}`);
      params.push(userId);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await pool.query(
      `SELECT
        EXTRACT(MONTH FROM date) AS month,
        TO_CHAR(date, 'Mon') AS month_name,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
       FROM transactions ${where}
       GROUP BY EXTRACT(MONTH FROM date), TO_CHAR(date, 'Mon')
       ORDER BY month`,
      params
    );

    await cacheSet(cacheKey, rows, 900);
    res.json({ data: rows, year: currentYear });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getIncomeVsExpense = async (req, res) => {
  try {
    const { period = 'monthly', year } = req.query;
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const cacheKey = `analytics:${userId || 'admin'}:ivse:${period}:${year || 'all'}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ data: cached, fromCache: true });

    let conditions = [];
    let params = [];
    let pi = 1;

    if (userId) {
      conditions.push(`user_id = $${pi++}`);
      params.push(userId);
    }
    if (year) {
      conditions.push(`EXTRACT(YEAR FROM date) = $${pi++}`);
      params.push(parseInt(year));
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let groupBy, orderBy;
    if (period === 'monthly') {
      groupBy = `EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), TO_CHAR(date, 'YYYY-Mon')`;
      orderBy = `EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)`;
    } else {
      groupBy = `EXTRACT(YEAR FROM date)`;
      orderBy = `EXTRACT(YEAR FROM date)`;
    }

    const { rows } = await pool.query(
      `SELECT
        ${period === 'monthly' ? "TO_CHAR(date, 'YYYY-Mon') AS period" : "EXTRACT(YEAR FROM date)::text AS period"},
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
       FROM transactions ${where}
       GROUP BY ${groupBy}
       ORDER BY ${orderBy}`,
      params
    );

    await cacheSet(cacheKey, rows, 900);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getRecentTransactions = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    let where = userId ? 'WHERE t.user_id = $1' : '';
    let params = userId ? [userId] : [];

    const { rows } = await pool.query(
      `SELECT t.*, u.name as user_name FROM transactions t
       JOIN users u ON t.user_id = u.id
       ${where} ORDER BY t.date DESC, t.created_at DESC LIMIT ${limit}`,
      params
    );
    res.json({ transactions: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getIncomeVsExpense,
  getRecentTransactions,
};
