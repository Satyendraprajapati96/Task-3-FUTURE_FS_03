const { body, param, query } = require('express-validator');

/* ---------------------------------------------------------------------
   Auth
   --------------------------------------------------------------------- */
const loginValidator = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
];

/* ---------------------------------------------------------------------
   Customer auth (public site accounts — separate from Admin)
   --------------------------------------------------------------------- */
const customerRegisterValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 80 }),
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('username')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage('Username can only contain letters, numbers, underscores and dots'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+()\-\s]{7,16}$/)
    .withMessage('Please provide a valid phone number'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

const customerLoginValidator = [
  body('identifier').trim().notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/* ---------------------------------------------------------------------
   Reservation
   --------------------------------------------------------------------- */
const reservationValidator = [
  body('customerName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('phone')
    .trim()
    .matches(/^[0-9+()\-\s]{7,16}$/)
    .withMessage('Please provide a valid phone number'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date')
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(value) < today) {
        throw new Error('Reservation date cannot be in the past');
      }
      return true;
    }),
  body('time').trim().notEmpty().withMessage('Time is required'),
  body('guests')
    .notEmpty()
    .withMessage('Number of guests is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Guests must be between 1 and 12'),
  body('specialRequest').optional().trim().isLength({ max: 500 }),
];

const updateStatusValidator = [
  param('id').isMongoId().withMessage('Invalid reservation id'),
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid status value'),
];

/* ---------------------------------------------------------------------
   Contact
   --------------------------------------------------------------------- */
const contactValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+()\-\s]{7,16}$/)
    .withMessage('Please provide a valid phone number'),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 }),
];

/* ---------------------------------------------------------------------
   Menu
   --------------------------------------------------------------------- */
const menuItemValidator = [
  body('name').trim().notEmpty().withMessage('Dish name is required').isLength({ max: 120 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 300 }),
  body('category')
    .trim()
    .isIn(['starters', 'mains', 'desserts', 'drinks'])
    .withMessage('Category must be one of: starters, mains, desserts, drinks'),
  body('price').notEmpty().withMessage('Price is required').isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('badge').optional().isIn(['none', 'spicy', 'chef', 'veg']),
  body('available').optional().isBoolean().toBoolean(),
];

/* ---------------------------------------------------------------------
   Testimonial
   --------------------------------------------------------------------- */
const testimonialValidator = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 100 }),
  body('profession').optional().trim().isLength({ max: 120 }),
  body('review').trim().notEmpty().withMessage('Review text is required').isLength({ max: 600 }),
  body('rating').notEmpty().withMessage('Rating is required').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
];

/* ---------------------------------------------------------------------
   Gallery
   --------------------------------------------------------------------- */
const galleryValidator = [body('title').optional().trim().isLength({ max: 120 })];

/* ---------------------------------------------------------------------
   Shared
   --------------------------------------------------------------------- */
const mongoIdValidator = [param('id').isMongoId().withMessage('Invalid id')];

const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

module.exports = {
  loginValidator,
  changePasswordValidator,
  customerRegisterValidator,
  customerLoginValidator,
  reservationValidator,
  updateStatusValidator,
  contactValidator,
  menuItemValidator,
  testimonialValidator,
  galleryValidator,
  mongoIdValidator,
  paginationValidator,
};
