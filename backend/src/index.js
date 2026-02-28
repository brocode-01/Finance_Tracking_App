require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { checkRedisConnection } = require('./config/redis');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users', require('./routes/users'));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Finance Tracker API',
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/cache/status', async (req, res) => {
  try {
    const { getRedisClient } = require('./config/redis');
    const client = getRedisClient();
    const keys = await client.keys('analytics:*');
    const info = {};
    for (const key of keys) {
      const ttl = await client.ttl(key);
      info[key] = `expires in ${ttl}s`;
    }
    res.json({ totalKeys: keys.length, keys: info });
  } catch (err) {
    res.json({ error: 'Redis not available', message: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`\n Finance Tracker API running on http://localhost:${PORT}`);
  console.log(` API Docs:     http://localhost:${PORT}/api/docs`);
  console.log(` Cache Status: http://localhost:${PORT}/api/cache/status\n`);
  await checkRedisConnection();
});

module.exports = app;
