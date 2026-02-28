const router = require('express').Router();
const { register, login, getMe, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation, validate } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User registration, login and profile
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [admin, user, read-only]
 *                 default: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: User registered successfully }
 *                 token: { type: string, example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... }
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests (rate limited - 5 per 15 min)
 */
router.post('/register', authLimiter, registerValidation, validate, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@demo.com
 *               password:
 *                 type: string
 *                 example: password123
 *           examples:
 *             admin:
 *               summary: Admin login
 *               value: { email: admin@demo.com, password: password123 }
 *             user:
 *               summary: Regular user login
 *               value: { email: user@demo.com, password: password123 }
 *             readonly:
 *               summary: Read-only login
 *               value: { email: readonly@demo.com, password: password123 }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Login successful }
 *                 token: { type: string, example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... }
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests (rate limited - 5 per 15 min)
 */
router.post('/login', authLimiter, loginValidation, validate, login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently logged-in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
router.get('/me', authenticate, getMe);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change current user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: password123
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: newpassword456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         description: Unauthorized
 */
router.put('/change-password', authenticate, changePassword);

module.exports = router;
