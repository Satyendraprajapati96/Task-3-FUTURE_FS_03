/**
 * Sends a consistent success JSON envelope:
 * { success: true, message, data }
 */
class ApiResponse {
  constructor(res, statusCode, message, data = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }
}

module.exports = ApiResponse;
