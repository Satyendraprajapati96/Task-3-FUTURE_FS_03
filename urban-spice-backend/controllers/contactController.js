const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Contact = require('../models/Contact');
const { sendContactNotificationToAdmin } = require('../services/emailService');

// @desc    Submit a contact message (from the public contact form)
// @route   POST /api/contact
// @access  Public
const createContact = asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;

  const contact = await Contact.create({ name, email, phone, message });

  sendContactNotificationToAdmin(contact);

  new ApiResponse(res, 201, "Message sent — we'll get back to you soon", { contact });
});

// @desc    Get all contact messages (paginated)
// @route   GET /api/admin/contacts
// @access  Private
const getContacts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, isRead } = req.query;

  const query = {};
  if (isRead !== undefined) query.isRead = isRead === 'true';

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [contacts, total] = await Promise.all([
    Contact.find(query).sort('-createdAt').skip(skip).limit(limitNum),
    Contact.countDocuments(query),
  ]);

  new ApiResponse(res, 200, 'Contact messages fetched', {
    contacts,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

// @desc    Mark a message as read
// @route   PATCH /api/admin/contacts/:id/read
// @access  Private
const markContactRead = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!contact) throw new ApiError(404, 'Message not found');
  new ApiResponse(res, 200, 'Message marked as read', { contact });
});

// @desc    Delete a contact message
// @route   DELETE /api/admin/contacts/:id
// @access  Private
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) throw new ApiError(404, 'Message not found');
  new ApiResponse(res, 200, 'Message deleted', {});
});

module.exports = { createContact, getContacts, markContactRead, deleteContact };
