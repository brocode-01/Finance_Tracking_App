const router = require('express').Router();
const { getAllUsers, updateUserRole, deleteUser } = require('../controllers/userController');
const { authenticate, adminOnly } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management — Admin only
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with pagination and search (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       403:
 *         description: Forbidden — admin role required
 */
router.get('/', authenticate, adminOnly, getAllUsers);

/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     summary: Change a user's role (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: User ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user, read-only]
 *                 example: read-only
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Role updated }
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid role
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/:id/role', authenticate, adminOnly, updateUserRole);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user and all their data (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: User deleted }
 *       400:
 *         description: Cannot delete yourself
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete('/:id', authenticate, adminOnly, deleteUser);

module.exports = router;
