const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Reservation = require('../models/Reservation');
const Contact = require('../models/Contact');
const Menu = require('../models/Menu');
const Gallery = require('../models/Gallery');
const Testimonial = require('../models/Testimonial');

// @desc    Get dashboard summary counts
// @route   GET /api/admin/dashboard/stats
// @access  Private
const getStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    totalReservations,
    todaysReservations,
    pendingReservations,
    totalContacts,
    unreadContacts,
    totalMenuItems,
    totalGalleryImages,
    totalTestimonials,
    pendingTestimonials,
  ] = await Promise.all([
    Reservation.countDocuments(),
    Reservation.countDocuments({ date: { $gte: startOfToday, $lte: endOfToday } }),
    Reservation.countDocuments({ status: 'pending' }),
    Contact.countDocuments(),
    Contact.countDocuments({ isRead: false }),
    Menu.countDocuments(),
    Gallery.countDocuments(),
    Testimonial.countDocuments(),
    Testimonial.countDocuments({ approved: false }),
  ]);

  new ApiResponse(res, 200, 'Dashboard stats fetched', {
    reservations: { total: totalReservations, today: todaysReservations, pending: pendingReservations },
    contacts: { total: totalContacts, unread: unreadContacts },
    menuItems: totalMenuItems,
    galleryImages: totalGalleryImages,
    testimonials: { total: totalTestimonials, pendingApproval: pendingTestimonials },
  });
});

// @desc    Get recent activity across reservations and contact messages
// @route   GET /api/admin/dashboard/recent-activity
// @access  Private
const getRecentActivity = asyncHandler(async (req, res) => {
  const [recentReservations, recentContacts] = await Promise.all([
    Reservation.find().sort('-createdAt').limit(5),
    Contact.find().sort('-createdAt').limit(5),
  ]);

  const activity = [
    ...recentReservations.map((r) => ({
      type: 'reservation',
      id: r._id,
      summary: `${r.customerName} booked a table for ${r.guests}`,
      status: r.status,
      createdAt: r.createdAt,
    })),
    ...recentContacts.map((c) => ({
      type: 'contact',
      id: c._id,
      summary: `${c.name} sent a message`,
      status: c.isRead ? 'read' : 'unread',
      createdAt: c.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  new ApiResponse(res, 200, 'Recent activity fetched', { activity: activity.slice(0, 10) });
});

module.exports = { getStats, getRecentActivity };
