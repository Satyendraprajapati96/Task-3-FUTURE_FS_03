const jwt = require('jsonwebtoken');

/**
 * Signs a JWT for the given user id. `role` is embedded in the payload so
 * middleware can tell an admin token from a customer token apart even
 * though both are signed with the same secret.
 */
const signToken = (userId, role = 'admin') =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Signs a token and attaches it both as an httpOnly cookie and in the
 * JSON response body, so the frontend can use either strategy.
 *
 * Admin and customer sessions use different cookie names (`token` vs
 * `customerToken`) so a browser that's signed in as both at once (e.g. a
 * developer testing locally) never has one overwrite the other.
 */
const sendTokenResponse = (user, statusCode, res, message, role = 'admin') => {
  const token = signToken(user._id, role);

  const cookieExpiresDays = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7;
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpiresDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  const cookieName = role === 'customer' ? 'customerToken' : 'token';
  res.cookie(cookieName, token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      token,
      user,
    },
  });
};

module.exports = { signToken, sendTokenResponse };
