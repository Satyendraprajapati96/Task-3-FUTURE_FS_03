const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Dish name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Dish description is required'],
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['starters', 'mains', 'desserts', 'drinks'],
      lowercase: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String, // relative path served from /uploads
      default: '',
    },
    badge: {
      type: String,
      enum: ['none', 'spicy', 'chef', 'veg'],
      default: 'none',
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

menuSchema.index({ category: 1, available: 1 });

module.exports = mongoose.model('Menu', menuSchema);
