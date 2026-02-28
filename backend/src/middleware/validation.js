const { body, validationResult } = require('express-validator');
const xss = require('xss');

const sanitize = (value) => (typeof value === 'string' ? xss(value) : value);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      req.body[key] = sanitize(req.body[key]);
    });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

const transactionValidation = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('date').isISO8601().withMessage('Valid date required (YYYY-MM-DD)'),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  transactionValidation,
};
