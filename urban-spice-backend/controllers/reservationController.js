const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Reservation = require('../models/Reservation');
const {
  sendReservationConfirmationToCustomer,
  sendReservationNotificationToAdmin,
} = require('../services/emailService');

// @desc    Create a reservation (from the public booking form)
// @route   POST /api/reservations
// @access  Public
const createReservation = asyncHandler(async (req, res) => {
  const { customerName, email, phone, date, time, guests, specialRequest } = req.body;

  const reservation = await Reservation.create({
    customerName,
    email,
    phone,
    date,
    time,
    guests,
    specialRequest,
  });

  // Fire-and-forget — email failures never block the booking response
  sendReservationConfirmationToCustomer(reservation);
  sendReservationNotificationToAdmin(reservation);

  new ApiResponse(res, 201, 'Reservation request received — we will confirm shortly', { reservation });
});

// @desc    Get all reservations (search, filter by status/date, paginate, sort)
// @route   GET /api/admin/reservations
// @access  Private
const getReservations = asyncHandler(async (req, res) => {
  const { search, status, date, page = 1, limit = 10, sort = '-createdAt' } = req.query;

  const query = {};

  if (status) query.status = status;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.date = { $gte: start, $lte: end };
  }
  if (search) {
    query.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [reservations, total] = await Promise.all([
    Reservation.find(query).sort(sort).skip(skip).limit(limitNum),
    Reservation.countDocuments(query),
  ]);

  new ApiResponse(res, 200, 'Reservations fetched', {
    reservations,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// @desc    Get a single reservation
// @route   GET /api/admin/reservations/:id
// @access  Private
const getReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw new ApiError(404, 'Reservation not found');
  new ApiResponse(res, 200, 'Reservation fetched', { reservation });
});

// @desc    Update reservation status
// @route   PATCH /api/admin/reservations/:id/status
// @access  Private
const updateReservationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${allowed.join(', ')}`);
  }

  const reservation = await Reservation.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!reservation) throw new ApiError(404, 'Reservation not found');

  new ApiResponse(res, 200, 'Reservation status updated', { reservation });
});

// @desc    Delete a reservation
// @route   DELETE /api/admin/reservations/:id
// @access  Private
const deleteReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findByIdAndDelete(req.params.id);
  if (!reservation) throw new ApiError(404, 'Reservation not found');
  new ApiResponse(res, 200, 'Reservation deleted', {});
});

module.exports = {
  createReservation,
  getReservations,
  getReservation,
  updateReservationStatus,
  deleteReservation,
};
