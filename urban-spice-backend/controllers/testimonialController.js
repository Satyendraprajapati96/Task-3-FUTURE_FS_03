const fs = require('fs');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Testimonial = require('../models/Testimonial');

const deleteFileIfExists = (relativePath) => {
  if (!relativePath) return;
  const absolute = path.join(__dirname, '..', relativePath);
  fs.unlink(absolute, () => {});
};

// @desc    Get approved testimonials only
// @route   GET /api/testimonials
// @access  Public
const getPublicTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({ approved: true }).sort('-createdAt');
  new ApiResponse(res, 200, 'Testimonials fetched', { testimonials });
});

// @desc    Get all testimonials, approved or not (admin)
// @route   GET /api/admin/testimonials
// @access  Private
const getAllTestimonials = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, approved } = req.query;
  const query = {};
  if (approved !== undefined) query.approved = approved === 'true';

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [testimonials, total] = await Promise.all([
    Testimonial.find(query).sort('-createdAt').skip(skip).limit(limitNum),
    Testimonial.countDocuments(query),
  ]);

  new ApiResponse(res, 200, 'Testimonials fetched', {
    testimonials,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

// @desc    Add a testimonial (admin-curated; not approved by default)
// @route   POST /api/admin/testimonials
// @access  Private
const createTestimonial = asyncHandler(async (req, res) => {
  const { customerName, profession, review, rating, approved } = req.body;

  const testimonial = await Testimonial.create({
    customerName,
    profession,
    review,
    rating,
    approved: approved === 'true' || approved === true,
    image: req.file ? `/uploads/testimonials/${req.file.filename}` : '',
  });

  new ApiResponse(res, 201, 'Testimonial created', { testimonial });
});

// @desc    Update a testimonial
// @route   PUT /api/admin/testimonials/:id
// @access  Private
const updateTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) throw new ApiError(404, 'Testimonial not found');

  const fields = ['customerName', 'profession', 'review', 'rating'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) testimonial[field] = req.body[field];
  });

  if (req.file) {
    deleteFileIfExists(testimonial.image);
    testimonial.image = `/uploads/testimonials/${req.file.filename}`;
  }

  await testimonial.save();
  new ApiResponse(res, 200, 'Testimonial updated', { testimonial });
});

// @desc    Approve a testimonial for public display
// @route   PATCH /api/admin/testimonials/:id/approve
// @access  Private
const approveTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndUpdate(
    req.params.id,
    { approved: true },
    { new: true }
  );
  if (!testimonial) throw new ApiError(404, 'Testimonial not found');
  new ApiResponse(res, 200, 'Testimonial approved', { testimonial });
});

// @desc    Delete a testimonial
// @route   DELETE /api/admin/testimonials/:id
// @access  Private
const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) throw new ApiError(404, 'Testimonial not found');
  deleteFileIfExists(testimonial.image);
  new ApiResponse(res, 200, 'Testimonial deleted', {});
});

module.exports = {
  getPublicTestimonials,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  approveTestimonial,
  deleteTestimonial,
};
