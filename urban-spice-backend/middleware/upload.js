const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Builds a multer instance that stores files under uploads/<folder>/
 * with a collision-safe filename, and only accepts image mime types.
 */
const buildUploader = (folder) => {
  const dest = path.join(__dirname, '..', 'uploads', folder);
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeName = `${folder}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safeName);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new ApiError(400, 'Only JPEG, PNG, WEBP, or AVIF images are allowed'));
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
};

const uploadMenuImage = buildUploader('menu');
const uploadGalleryImage = buildUploader('gallery');
const uploadTestimonialImage = buildUploader('testimonials');

module.exports = { uploadMenuImage, uploadGalleryImage, uploadTestimonialImage };
