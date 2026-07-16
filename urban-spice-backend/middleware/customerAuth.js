const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Customer = require('../models/Customer');

/**
 * Verifies a customer JWT from either the Authorization header
 * ("Bearer <token>") or the httpOnly `customerToken` cookie, then attaches
 * the authenticated customer to req.customer for downstream handlers.
 *
 * Kept entirely separate from middleware/auth.js (admin) — an admin token
 * and a customer token are interchangeable in format (same secret) but
 * carry a different `role` claim, and this checks for 'customer'
 * specifically, and looks the id up in a different collection.
 */
const protectCustomer = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.customerToken) {
    token = req.cookies.customerToken;
  }

  if (!token) {
    throw new ApiError(401, 'Please log in to continue');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'customer') {
      throw new ApiError(401, 'Not authorized — customer session required');
    }

    const customer = await Customer.findById(decoded.id);
    if (!customer) {
      throw new ApiError(401, 'Not authorized — account no longer exists');
    }

    req.customer = customer;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'Not authorized — invalid or expired session');
  }
});

module.exports = { protectCustomer };
