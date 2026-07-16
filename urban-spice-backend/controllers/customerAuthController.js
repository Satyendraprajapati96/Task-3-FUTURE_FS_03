const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { sendTokenResponse } = require('../utils/generateToken');
const Customer = require('../models/Customer');

// @desc    Register a new customer account
// @route   POST /api/customers/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { fullName, email, username, phone, password } = req.body;

  const existingEmail = await Customer.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw new ApiError(409, 'An account with this email already exists', [
      { field: 'email', message: 'An account with this email already exists' },
    ]);
  }

  if (username) {
    const existingUsername = await Customer.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      throw new ApiError(409, 'This username is already taken', [
        { field: 'username', message: 'This username is already taken' },
      ]);
    }
  }

  const customer = await Customer.create({
    fullName,
    email,
    username: username || undefined, // avoid saving an empty string into a sparse-unique field
    phone: phone || undefined,
    password,
  });

  sendTokenResponse(customer, 201, res, 'Account created successfully', 'customer');
});

// @desc    Customer login — accepts either email or username as the identifier
// @route   POST /api/customers/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const query = identifier.includes('@')
    ? { email: identifier.toLowerCase().trim() }
    : { username: identifier.toLowerCase().trim() };

  const customer = await Customer.findOne(query).select('+password');
  if (!customer) {
    throw new ApiError(401, 'Invalid email/username or password');
  }

  const isMatch = await customer.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email/username or password');
  }

  customer.lastLoginAt = new Date();
  await customer.save({ validateBeforeSave: false });

  sendTokenResponse(customer, 200, res, 'Logged in successfully', 'customer');
});

// @desc    Get the currently authenticated customer
// @route   GET /api/customers/me
// @access  Private (customer)
const getMe = asyncHandler(async (req, res) => {
  new ApiResponse(res, 200, 'Current account fetched', { user: req.customer });
});

// @desc    Log out (clears the customer auth cookie)
// @route   POST /api/customers/logout
// @access  Private (customer)
const logout = asyncHandler(async (req, res) => {
  res.cookie('customerToken', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  new ApiResponse(res, 200, 'Logged out successfully', {});
});

module.exports = { register, login, getMe, logout };
