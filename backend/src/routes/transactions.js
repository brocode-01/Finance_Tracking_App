const router = require('express').Router();
const {
  getTransactions, getTransaction, createTransaction,
  updateTransaction, deleteTransaction, getCategories,
} = require('../controllers/transactionController');
const { authenticate, canWrite } = require('../middleware/auth');
const { transactionLimiter } = require('../middleware/rateLimiter');
const { transactionValidation, validate } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Income and expense transaction management
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions (paginated, filterable, searchable)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Results per page (10/25/50)
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *         description: Filter by transaction type
 *       - in: query
 *         name: category
 *         schema: { type: string, example: Food }
 *         description: Filter by category (partial match)
 *       - in: query
 *         name: search
 *         schema: { type: string, example: grocery }
 *         description: Search in description and category
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date, example: '2025-01-01' }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date, example: '2025-12-31' }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [date, amount, category, type], default: date }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *     responses:
 *       200:
 *         description: Paginated transaction list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded (100 requests/hour)
 */
router.get('/', authenticate, transactionLimiter, getTransactions);

/**
 * @swagger
 * /transactions/categories:
 *   get:
 *     summary: Get distinct categories used by user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unique categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items: { type: string }
 *                   example: [Food, Transport, Salary]
 */
router.get('/categories', authenticate, getCategories);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get a single transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticate, transactionLimiter, getTransaction);

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a new transaction (admin and user roles only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *           examples:
 *             expense:
 *               summary: Add an expense
 *               value:
 *                 type: expense
 *                 amount: 450.00
 *                 category: Food
 *                 description: Grocery shopping
 *                 date: '2025-06-15'
 *             income:
 *               summary: Add income
 *               value:
 *                 type: income
 *                 amount: 75000.00
 *                 category: Salary
 *                 description: Monthly salary June
 *                 date: '2025-06-01'
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Transaction created }
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - read-only users cannot create transactions
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/', authenticate, canWrite, transactionLimiter, transactionValidation, validate, createTransaction);

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Update a transaction (admin and user roles only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *     responses:
 *       200:
 *         description: Transaction updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       403:
 *         description: Forbidden - not owner or read-only role
 *       404:
 *         description: Transaction not found
 */
router.put('/:id', authenticate, canWrite, transactionLimiter, transactionValidation, validate, updateTransaction);

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Delete a transaction (admin and user roles only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Transaction deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Transaction deleted }
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transaction not found
 */
router.delete('/:id', authenticate, canWrite, transactionLimiter, deleteTransaction);

module.exports = router;
