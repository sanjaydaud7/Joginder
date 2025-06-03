// Backend/models/Product.js

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
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Product', productSchema);