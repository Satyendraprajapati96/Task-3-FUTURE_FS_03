const express = require('express');
const {
  createReservation,
  getReservations,
  getReservation,
  updateReservationStatus,
  deleteReservation,
} = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  reservationValidator,
  updateStatusValidator,
  mongoIdValidator,
  paginationValidator,
} = require('../utils/validators');

// Public router — mounted at /api/reservations
const publicRouter = express.Router();
publicRouter.post('/', reservationValidator, validate, createReservation);

// Admin router — mounted at /api/admin/reservations
const adminRouter = express.Router();
adminRouter.use(protect);
adminRouter.get('/', paginationValidator, validate, getReservations);
adminRouter.get('/:id', mongoIdValidator, validate, getReservation);
adminRouter.patch('/:id/status', updateStatusValidator, validate, updateReservationStatus);
adminRouter.delete('/:id', mongoIdValidator, validate, deleteReservation);

module.exports = { publicRouter, adminRouter };
