const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Tracker API',
      version: '1.0.0',
      description: `
## Personal Finance Tracker REST API

JWT-authenticated API with Role-Based Access Control (RBAC).

### Roles
| Role | Permissions |
|------|------------|
| **admin** | Full access — manage all users and all transactions |
| **user** | CRUD on own transactions, view own analytics |
| **read-only** | View own transactions and analytics only |

### Authentication
1. Call \`POST /auth/login\` with your credentials
2. Copy the \`token\` from the response
3. Click **Authorize** above and paste: \`Bearer <token>\`

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password123 |
| User | user@demo.com | password123 |
| Read-Only | readonly@demo.com | password123 |

### Caching
Analytics endpoints are cached in Redis for **15 minutes**.
Responses include \`fromCache: true\` when served from cache.
Cache is automatically invalidated when transactions change.

### Rate Limits
- Auth endpoints: **5 requests / 15 minutes**
- Transaction endpoints: **100 requests / hour**
- Analytics endpoints: **50 requests / hour**
      `,
      contact: {
        name: 'Finance Tracker Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api`,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your JWT token here. Get it from POST /auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['admin', 'user', 'read-only'], example: 'user' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 42 },
            user_id: { type: 'integer', example: 1 },
            type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
            amount: { type: 'number', format: 'float', example: 1500.00 },
            category: { type: 'string', example: 'Food' },
            description: { type: 'string', example: 'Monthly groceries' },
            date: { type: 'string', format: 'date', example: '2025-06-15' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        TransactionInput: {
          type: 'object',
          required: ['type', 'amount', 'category', 'date'],
          properties: {
            type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
            amount: { type: 'number', minimum: 0.01, example: 1500.00 },
            category: { type: 'string', example: 'Food' },
            description: { type: 'string', example: 'Monthly groceries', maxLength: 500 },
            date: { type: 'string', format: 'date', example: '2025-06-15' },
          },
        },
        Summary: {
          type: 'object',
          properties: {
            totalIncome: { type: 'number', example: 900000 },
            totalExpense: { type: 'number', example: 420000 },
            netBalance: { type: 'number', example: 480000 },
            totalTransactions: { type: 'integer', example: 95 },
            incomeCount: { type: 'integer', example: 24 },
            expenseCount: { type: 'integer', example: 71 },
            fromCache: { type: 'boolean', example: false, description: 'true if served from Redis cache' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 95 },
            totalPages: { type: 'integer', example: 10 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Invalid credentials' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
