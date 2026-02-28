require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');

const categories = ['Food', 'Transport', 'Entertainment', 'Housing', 'Healthcare', 'Shopping', 'Education', 'Utilities', 'Salary', 'Freelance', 'Investment'];

const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');

    const hashedPw = await bcrypt.hash('password123', 12);

    const users = [
      { name: 'Admin User', email: 'rupeshadmin@demo.com', role: 'admin' },
      { name: 'Regular User', email: 'rupeshuser@demo.com', role: 'user' },
      { name: 'Read Only User', email: 'rupeshreadonly@demo.com', role: 'read-only' },
    ];

    const userIds = [];
    for (const u of users) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (existing.rows.length) {
        userIds.push(existing.rows[0].id);
        console.log(`  ↳ User ${u.email} already exists`);
      } else {
        const { rows } = await client.query(
          'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
          [u.name, u.email, hashedPw, u.role]
        );
        userIds.push(rows[0].id);
        console.log(`Created ${u.role}: ${u.email}`);
      }
    }
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2025-12-31');

    for (const userId of userIds.slice(0, 2)) {
      const count = await client.query('SELECT COUNT(*) FROM transactions WHERE user_id = $1', [userId]);
      if (parseInt(count.rows[0].count) > 0) {
        console.log(`  ↳ Transactions for user ${userId} already exist`);
        continue;
      }

      const transactions = [];
      for (let month = 0; month < 24; month++) {
        const d = new Date(2024, month, 1);
        if (d <= endDate) {
          transactions.push({
            type: 'income',
            amount: (50000 + Math.random() * 10000).toFixed(2),
            category: 'Salary',
            description: 'Monthly salary',
            date: d.toISOString().split('T')[0],
          });
        }
      }
      for (let i = 0; i < 80; i++) {
        const d = randomDate(startDate, endDate);
        const isIncome = Math.random() < 0.2;
        const expenseCats = ['Food', 'Transport', 'Entertainment', 'Housing', 'Healthcare', 'Shopping', 'Utilities'];
        const incomeCats = ['Freelance', 'Investment'];
        transactions.push({
          type: isIncome ? 'income' : 'expense',
          amount: (Math.random() * 5000 + 100).toFixed(2),
          category: isIncome ? incomeCats[Math.floor(Math.random() * incomeCats.length)] : expenseCats[Math.floor(Math.random() * expenseCats.length)],
          description: `Sample ${isIncome ? 'income' : 'expense'}`,
          date: d.toISOString().split('T')[0],
        });
      }

      for (const t of transactions) {
        await client.query(
          'INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, t.type, t.amount, t.category, t.description, t.date]
        );
      }
      console.log(`Created ${transactions.length} transactions for user ${userId}`);
    }

    console.log('\n Seeding complete!');
    console.log('\n Demo Credentials:');
    console.log('  Admin:     rupeshadmin@demo.com    / password123');
    console.log('  User:      rupeshuser@demo.com     / password123');
    console.log('  ReadOnly:  rupeshreadonly@demo.com / password123');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
