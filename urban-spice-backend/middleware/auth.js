const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Verifies the JWT from either the Authorization header ("Bearer <token>")
 * or the httpOnly `token` cookie, then attaches the authenticated admin
 * to req.user for downstream handlers.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized — no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role && decoded.role !== 'admin') {
      throw new ApiError(401, 'Not authorized — admin session required');
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, 'Not authorized — user no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'Not authorized — invalid or expired token');
  }
});

/**
 * Restricts a route to specific roles. Use after `protect`.
 * Example: router.delete('/:id', protect, authorize('superadmin'), controller)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, 'You do not have permission to perform this action');
  }
  next();
};

module.exports = { protect, authorize };
