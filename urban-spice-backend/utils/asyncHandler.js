/**
 * Wraps an async Express route handler so any thrown/rejected error is
 * forwarded to next(), where the centralized error handler deals with it.
 * Removes the need for try/catch in every single controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
