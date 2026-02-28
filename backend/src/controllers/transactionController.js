const pool = require('../config/database');
const { cacheDel } = require('../config/redis');

const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      search,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const isAdmin = req.user.role === 'admin';

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (!isAdmin) {
      conditions.push(`t.user_id = $${paramIndex++}`);
      params.push(req.user.id);
    }

    if (type && ['income', 'expense'].includes(type)) {
      conditions.push(`t.type = $${paramIndex++}`);
      params.push(type);
    }

    if (category) {
      conditions.push(`t.category ILIKE $${paramIndex++}`);
      params.push(`%${category}%`);
    }

    if (search) {
      conditions.push(`(t.description ILIKE $${paramIndex} OR t.category ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`t.date >= $${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      conditions.push(`t.date <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortBy = ['date', 'amount', 'category', 'type', 'created_at'];
    const allowedOrder = ['ASC', 'DESC'];
    const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'date';
    const safeOrder = allowedOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const countQuery = `SELECT COUNT(*) FROM transactions t ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.${safeSortBy} ${safeOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(dataQuery, params);

    res.json({
      transactions: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    const query = isAdmin
      ? 'SELECT t.*, u.name as user_name FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.id = $1'
      : 'SELECT * FROM transactions WHERE id = $1 AND user_id = $2';
    const params = isAdmin ? [id] : [id, req.user.id];

    const { rows } = await pool.query(query, params);
    if (!rows.length) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ transaction: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createTransaction = async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;
    const userId = req.user.id;

    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, category, description, date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, type, parseFloat(amount), category, description || '', date]
    );

    await cacheDel(`analytics:${userId}:*`);
    await cacheDel(`analytics:admin:*`);

    res.status(201).json({ message: 'Transaction created', transaction: rows[0] });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;
    const isAdmin = req.user.role === 'admin';

    const existing = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ message: 'Transaction not found' });
    if (!isAdmin && existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { rows } = await pool.query(
      `UPDATE transactions SET type=$1, amount=$2, category=$3, description=$4, date=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [type, parseFloat(amount), category, description || '', date, id]
    );

    await cacheDel(`analytics:${existing.rows[0].user_id}:*`);
    await cacheDel(`analytics:admin:*`);

    res.json({ message: 'Transaction updated', transaction: rows[0] });
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    const existing = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ message: 'Transaction not found' });
    if (!isAdmin && existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);

    await cacheDel(`analytics:${existing.rows[0].user_id}:*`);
    await cacheDel(`analytics:admin:*`);

    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT DISTINCT category FROM transactions ORDER BY category'
    );
    const categories = rows.map((r) => r.category);
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
};
