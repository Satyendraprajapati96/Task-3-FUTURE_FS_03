require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./routes/authRoutes');
const customerAuthRoutes = require('./routes/customerAuthRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const contactRoutes = require('./routes/contactRoutes');
const menuRoutes = require('./routes/menuRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Connect to MongoDB Atlas
connectDB();

const app = express();

/* ---------------------------------------------------------------------
   Security & core middleware
   --------------------------------------------------------------------- */
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header (e.g. curl, Postman, server-to-server) — allow it.
      if (!origin) return callback(null, true);

      // In development, allow ANY localhost/127.0.0.1 port automatically.
      // Live Server picks a different port each time (5500, 5501, 5502...)
      // and constantly re-editing CLIENT_URL to chase it is exactly the
      // friction this avoids. Production still uses the strict CLIENT_URL
      // allowlist below — this shortcut never applies once NODE_ENV=production.
      if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      const allowedOrigins = process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
        : [];
      if (allowedOrigins.includes(origin)) return callback(null, true);

      callback(new Error(`CORS: origin ${origin} is not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . operators from user input (NoSQL injection protection)
app.use(xss()); // sanitizes user input against basic XSS payloads

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global rate limiter — protects public write endpoints from abuse
const limiter = rateLimit({
  windowMs: (Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15) * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please try again later.', errors: [] },
});
app.use('/api', limiter);

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ---------------------------------------------------------------------
   Routes
   --------------------------------------------------------------------- */
app.use('/health', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerAuthRoutes);

// Public endpoints
app.use('/api/reservations', reservationRoutes.publicRouter);
app.use('/api/contact', contactRoutes.publicRouter);
app.use('/api/menu', menuRoutes.publicRouter);
app.use('/api/gallery', galleryRoutes.publicRouter);
app.use('/api/testimonials', testimonialRoutes.publicRouter);

// Admin (protected) endpoints
app.use('/api/admin/reservations', reservationRoutes.adminRouter);
app.use('/api/admin/contacts', contactRoutes.adminRouter);
app.use('/api/admin/menu', menuRoutes.adminRouter);
app.use('/api/admin/gallery', galleryRoutes.adminRouter);
app.use('/api/admin/testimonials', testimonialRoutes.adminRouter);
app.use('/api/admin/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Urban Spice API — see /health for status', data: {} });
});

/* ---------------------------------------------------------------------
   Error handling (must be last)
   --------------------------------------------------------------------- */
app.use(notFound);
app.use(errorHandler);

/* ---------------------------------------------------------------------
   Start server
   --------------------------------------------------------------------- */
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Urban Spice API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Fail loudly on unhandled promise rejections instead of crashing silently
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
