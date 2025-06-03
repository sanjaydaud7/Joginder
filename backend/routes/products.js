const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/product');

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' });
  }
  next();
};

// Sanitize input to prevent regex injection
const sanitizeRegex = (input) => {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Get all products or search by name/category
router.get('/', async (req, res) => {
  try {
    const searchQuery = req.query.search ? sanitizeRegex(req.query.search) : '';
    let products;

    if (searchQuery) {
      products = await Product.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { category: { $regex: searchQuery, $options: 'i' } },
        ],
      });
    } else {
      products = await Product.find();
    }

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching products', error: error.message });
  }
});

// Get a single product by ID
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching product', error: error.message });
  }
});

// Create a new product
router.post('/', async (req, res) => {
  try {
    const { name, price, category } = req.body;

    // Validate required fields and data types
    if (!name || typeof name !== 'string' || !price || typeof price !== 'number' || price <= 0 || !category || typeof category !== 'string') {
      return res.status(400).json({ success: false, message: 'Name, price (positive number), and category are required' });
    }

    const newProduct = new Product({
      name,
      price,
      category,
    });

    await newProduct.save();
    res.status(201).json({ success: true, message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Server error while creating product', error: error.message });
  }
});

// Update a product by ID
router.put('/:id', validateObjectId, async (req, res) => {
  try {
    const { name, price, category } = req.body;

    // Validate input
    if (!name || typeof name !== 'string' || !price || typeof price !== 'number' || price <= 0 || !category || typeof category !== 'string') {
      return res.status(400).json({ success: false, message: 'Name, price (positive number), and category are required' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, category },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Server error while updating product', error: error.message });
  }
});

// Delete a product by ID
router.delete('/:id', validateObjectId, async (req, res) => {
  try {
    console.log(`Attempting to delete product with ObjectId: ${req.params.id}`);
    
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      console.log(`Product with ObjectId ${req.params.id} not found`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    console.log(`✅ Successfully deleted product:`, {
      name: deletedProduct.name,
      price: deletedProduct.price,
      category: deletedProduct.category,
    });
    
    res.status(200).json({ 
      success: true,
      message: 'Product deleted successfully',
      deletedProduct,
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting product',
      error: error.message,
    });
  }
});

module.exports = router;