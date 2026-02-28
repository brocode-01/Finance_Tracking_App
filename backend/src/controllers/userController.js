const pool = require('../config/database');

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];
    let pi = 1;

    if (search) {
      conditions.push(`(name ILIKE $${pi} OR email ILIKE $${pi})`);
      params.push(`%${search}%`);
      pi++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM users ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await pool.query(
      `SELECT id, name, email, role, created_at FROM users ${where}
       ORDER BY created_at DESC LIMIT $${pi++} OFFSET $${pi++}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      users: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user', 'read-only'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const { rows } = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );

    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Role updated', user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    const { rows } = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllUsers, updateUserRole, deleteUser };
