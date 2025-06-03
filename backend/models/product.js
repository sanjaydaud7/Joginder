const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'Product ID is required'],
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  price: {
    type: String,
    required: [true, 'Price is required'],
    trim: true,
  },
  image: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  nutrients: {
    type: [String],
    default: [],
  },
  calories: {
    type: String,
    trim: true,
    default: '',
  },
  healthBenefits: {
    type: String,
    trim: true,
    default: '',
  },
  tags: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);