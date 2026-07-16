const fs = require('fs');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Menu = require('../models/Menu');

const deleteFileIfExists = (relativePath) => {
  if (!relativePath) return;
  const absolute = path.join(__dirname, '..', relativePath);
  fs.unlink(absolute, () => {}); // best-effort, ignore errors (e.g. already gone)
};

// @desc    Get all available menu items (optional ?category= filter)
// @route   GET /api/menu
// @access  Public
const getPublicMenu = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const query = { available: true };
  if (category && category !== 'all') query.category = category;

  const items = await Menu.find(query).sort('-createdAt');
  new ApiResponse(res, 200, 'Menu items fetched', { items });
});

// @desc    Get all menu items, including unavailable ones (admin view)
// @route   GET /api/admin/menu
// @access  Private
const getAllMenuItems = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category } = req.query;
  const query = {};
  if (category) query.category = category;

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Menu.find(query).sort('-createdAt').skip(skip).limit(limitNum),
    Menu.countDocuments(query),
  ]);

  new ApiResponse(res, 200, 'Menu items fetched', {
    items,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

// @desc    Create a menu item (optionally with an uploaded image)
// @route   POST /api/admin/menu
// @access  Private
const createMenuItem = asyncHandler(async (req, res) => {
  const { name, description, category, price, badge, available } = req.body;

  const item = await Menu.create({
    name,
    description,
    category,
    price,
    badge,
    available,
    image: req.file ? `/uploads/menu/${req.file.filename}` : '',
  });

  new ApiResponse(res, 201, 'Menu item created', { item });
});

// @desc    Update a menu item (optionally replacing its image)
// @route   PUT /api/admin/menu/:id
// @access  Private
const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await Menu.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Menu item not found');

  const fields = ['name', 'description', 'category', 'price', 'badge', 'available'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) item[field] = req.body[field];
  });

  if (req.file) {
    deleteFileIfExists(item.image);
    item.image = `/uploads/menu/${req.file.filename}`;
  }

  await item.save();
  new ApiResponse(res, 200, 'Menu item updated', { item });
});

// @desc    Delete a menu item
// @route   DELETE /api/admin/menu/:id
// @access  Private
const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await Menu.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Menu item not found');
  deleteFileIfExists(item.image);
  new ApiResponse(res, 200, 'Menu item deleted', {});
});

module.exports = { getPublicMenu, getAllMenuItems, createMenuItem, updateMenuItem, deleteMenuItem };
