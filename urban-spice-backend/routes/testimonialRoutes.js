const express = require('express');
const {
  getPublicTestimonials,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  approveTestimonial,
  deleteTestimonial,
} = require('../controllers/testimonialController');
const { protect } = require('../middleware/auth');
const { uploadTestimonialImage } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { testimonialValidator, mongoIdValidator, paginationValidator } = require('../utils/validators');

// Public router — mounted at /api/testimonials
const publicRouter = express.Router();
publicRouter.get('/', getPublicTestimonials);

// Admin router — mounted at /api/admin/testimonials
const adminRouter = express.Router();
adminRouter.use(protect);
adminRouter.get('/', paginationValidator, validate, getAllTestimonials);
adminRouter.post('/', uploadTestimonialImage.single('image'), testimonialValidator, validate, createTestimonial);
adminRouter.put('/:id', uploadTestimonialImage.single('image'), mongoIdValidator, validate, updateTestimonial);
adminRouter.patch('/:id/approve', mongoIdValidator, validate, approveTestimonial);
adminRouter.delete('/:id', mongoIdValidator, validate, deleteTestimonial);

module.exports = { publicRouter, adminRouter };
