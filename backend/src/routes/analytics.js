const router = require('express').Router();
const {
  getSummary, getCategoryBreakdown, getMonthlyTrends,
  getIncomeVsExpense, getRecentTransactions,
} = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { analyticsLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Financial analytics and chart data (Redis cached for 15 minutes)
 */

/**
 * @swagger
 * /analytics/summary:
 *   get:
 *     summary: Get financial summary — total income, expense, balance
 *     description: |
 *       Returns aggregated financial data. Results are **cached in Redis for 15 minutes**.
 *       Response includes `fromCache: true` when served from cache.
 *       Cache is invalidated automatically when transactions are added/updated/deleted.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2025 }
 *         description: Filter by year (omit for all-time)
 *       - in: query
 *         name: month
 *         schema: { type: integer, minimum: 1, maximum: 12, example: 6 }
 *         description: Filter by month (requires year)
 *     responses:
 *       200:
 *         description: Financial summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Summary'
 *             examples:
 *               fresh:
 *                 summary: Fresh from database
 *                 value:
 *                   totalIncome: 900000
 *                   totalExpense: 420000
 *                   netBalance: 480000
 *                   totalTransactions: 95
 *                   incomeCount: 24
 *                   expenseCount: 71
 *                   fromCache: false
 *               cached:
 *                 summary: Served from Redis cache
 *                 value:
 *                   totalIncome: 900000
 *                   totalExpense: 420000
 *                   netBalance: 480000
 *                   totalTransactions: 95
 *                   incomeCount: 24
 *                   expenseCount: 71
 *                   fromCache: true
 *       429:
 *         description: Rate limit exceeded (50 requests/hour)
 */
router.get('/summary', authenticate, analyticsLimiter, getSummary);

/**
 * @swagger
 * /analytics/category-breakdown:
 *   get:
 *     summary: Get expense totals per category (pie chart data)
 *     description: Returns spending grouped by category. **Cached 15 minutes in Redis.**
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2025 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense], default: expense }
 *     responses:
 *       200:
 *         description: Category breakdown data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category: { type: string, example: Food }
 *                       total: { type: string, example: '45000.00' }
 *                       count: { type: string, example: '18' }
 *                 fromCache: { type: boolean }
 */
router.get('/category-breakdown', authenticate, analyticsLimiter, getCategoryBreakdown);

/**
 * @swagger
 * /analytics/monthly-trends:
 *   get:
 *     summary: Get monthly income vs expense breakdown (line chart data)
 *     description: Returns 12 months of income/expense data for a year. **Cached 15 minutes.**
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2025 }
 *         description: Defaults to current year
 *     responses:
 *       200:
 *         description: Monthly trends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month: { type: number, example: 1 }
 *                       month_name: { type: string, example: Jan }
 *                       income: { type: string, example: '75000.00' }
 *                       expense: { type: string, example: '35000.00' }
 *                 year: { type: number, example: 2025 }
 *                 fromCache: { type: boolean }
 */
router.get('/monthly-trends', authenticate, analyticsLimiter, getMonthlyTrends);

/**
 * @swagger
 * /analytics/income-vs-expense:
 *   get:
 *     summary: Get income vs expense comparison (bar chart data)
 *     description: Returns income and expense totals grouped by period. **Cached 15 minutes.**
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [monthly, yearly], default: monthly }
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2025 }
 *     responses:
 *       200:
 *         description: Income vs expense data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period: { type: string, example: '2025-Jan' }
 *                       income: { type: string, example: '75000.00' }
 *                       expense: { type: string, example: '35000.00' }
 *                 fromCache: { type: boolean }
 */
router.get('/income-vs-expense', authenticate, analyticsLimiter, getIncomeVsExpense);

/**
 * @swagger
 * /analytics/recent:
 *   get:
 *     summary: Get most recent transactions for dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5, maximum: 20 }
 *     responses:
 *       200:
 *         description: Recent transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 */
router.get('/recent', authenticate, analyticsLimiter, getRecentTransactions);

module.exports = router;
