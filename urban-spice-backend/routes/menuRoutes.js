const express = require('express');
const {
  getPublicMenu,
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuController');
const { protect } = require('../middleware/auth');
const { uploadMenuImage } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { menuItemValidator, mongoIdValidator, paginationValidator } = require('../utils/validators');

// Public router — mounted at /api/menu
const publicRouter = express.Router();
publicRouter.get('/', getPublicMenu);

// Admin router — mounted at /api/admin/menu
const adminRouter = express.Router();
adminRouter.use(protect);
adminRouter.get('/', paginationValidator, validate, getAllMenuItems);
adminRouter.post('/', uploadMenuImage.single('image'), menuItemValidator, validate, createMenuItem);
adminRouter.put('/:id', uploadMenuImage.single('image'), mongoIdValidator, validate, updateMenuItem);
adminRouter.delete('/:id', mongoIdValidator, validate, deleteMenuItem);

module.exports = { publicRouter, adminRouter };
