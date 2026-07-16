const fs = require('fs');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Gallery = require('../models/Gallery');

const deleteFileIfExists = (relativePath) => {
  if (!relativePath) return;
  const absolute = path.join(__dirname, '..', relativePath);
  fs.unlink(absolute, () => {});
};

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Public
const getPublicGallery = asyncHandler(async (req, res) => {
  const images = await Gallery.find().sort('-uploadedAt');
  new ApiResponse(res, 200, 'Gallery images fetched', { images });
});

// @desc    Get all gallery images (admin, paginated)
// @route   GET /api/admin/gallery
// @access  Private
const getAllGalleryImages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [images, total] = await Promise.all([
    Gallery.find().sort('-uploadedAt').skip(skip).limit(limitNum),
    Gallery.countDocuments(),
  ]);

  new ApiResponse(res, 200, 'Gallery images fetched', {
    images,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

// @desc    Upload a new gallery image
// @route   POST /api/admin/gallery
// @access  Private
const uploadGalleryImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'An image file is required');

  const image = await Gallery.create({
    title: req.body.title || req.file.originalname,
    image: `/uploads/gallery/${req.file.filename}`,
  });

  new ApiResponse(res, 201, 'Gallery image uploaded', { image });
});

// @desc    Delete a gallery image
// @route   DELETE /api/admin/gallery/:id
// @access  Private
const deleteGalleryImage = asyncHandler(async (req, res) => {
  const image = await Gallery.findByIdAndDelete(req.params.id);
  if (!image) throw new ApiError(404, 'Gallery image not found');
  deleteFileIfExists(image.image);
  new ApiResponse(res, 200, 'Gallery image deleted', {});
});

module.exports = { getPublicGallery, getAllGalleryImages, uploadGalleryImage, deleteGalleryImage };
