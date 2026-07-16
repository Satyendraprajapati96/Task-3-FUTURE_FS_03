const express = require('express');
const {
  getPublicGallery,
  getAllGalleryImages,
  uploadGalleryImage,
  deleteGalleryImage,
} = require('../controllers/galleryController');
const { protect } = require('../middleware/auth');
const { uploadGalleryImage: uploadMiddleware } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { galleryValidator, mongoIdValidator, paginationValidator } = require('../utils/validators');

// Public router — mounted at /api/gallery
const publicRouter = express.Router();
publicRouter.get('/', getPublicGallery);

// Admin router — mounted at /api/admin/gallery
const adminRouter = express.Router();
adminRouter.use(protect);
adminRouter.get('/', paginationValidator, validate, getAllGalleryImages);
adminRouter.post('/', uploadMiddleware.single('image'), galleryValidator, validate, uploadGalleryImage);
adminRouter.delete('/:id', mongoIdValidator, validate, deleteGalleryImage);

module.exports = { publicRouter, adminRouter };
