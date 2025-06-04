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

// Get a single product by MongoDB _id
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
    const {
      id,
      name,
      price,
      image,
      category,
      description,
      nutrients,
      calories,
      healthBenefits,
      tags,
    } = req.body;

    // Validate required fields
    if (!id || !name || !price || !image || !category) {
      return res.status(400).json({ success: false, message: 'ID, name, price, image, and category are required' });
    }

    // Validate data types
    if (
      typeof id !== 'string' ||
      typeof name !== 'string' ||
      typeof price !== 'string' ||
      typeof image !== 'string' ||
      typeof category !== 'string'
    ) {
      return res.status(400).json({ success: false, message: 'Invalid data types for required fields' });
    }

    // Validate optional fields
    if (nutrients && !Array.isArray(nutrients)) {
      return res.status(400).json({ success: false, message: 'Nutrients must be an array' });
    }
    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({ success: false, message: 'Tags must be an array' });
    }

    const newProduct = new Product({
      id,
      name,
      price,
      image,
      category,
      description: description || '',
      nutrients: nutrients || [],
      calories: calories || '',
      healthBenefits: healthBenefits || '',
      tags: tags || [],
    });

    await newProduct.save();
    console.log(`✅ Product added successfully: ID=${id}, Name=${name}, Category=${category}`);
    res.status(201).json({ success: true, message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Server error while creating product', error: error.message });
  }
});

// Bulk create products
router.post('/bulk', async (req, res) => {
  try {
    const products = req.body;

    // Validate each product
    for (const product of products) {
      if (!product.id || !product.name || !product.price || !product.image || !product.category) {
        return res.status(400).json({ success: false, message: `Invalid product data for ID ${product.id || 'unknown'}` });
      }
      if (
        typeof product.id !== 'string' ||
        typeof product.name !== 'string' ||
        typeof product.price !== 'string' ||
        typeof product.image !== 'string' ||
        typeof product.category !== 'string'
      ) {
        return res.status(400).json({ success: false, message: `Invalid data types for product ID ${product.id || 'unknown'}` });
      }
      if (product.nutrients && !Array.isArray(product.nutrients)) {
        return res.status(400).json({ success: false, message: `Nutrients must be an array for product ID ${product.id || 'unknown'}` });
      }
      if (product.tags && !Array.isArray(product.tags)) {
        return res.status(400).json({ success: false, message: `Tags must be an array for product ID ${product.id || 'unknown'}` });
      }
    }

    const insertedProducts = await Product.insertMany(products, { ordered: false });
    console.log(`✅ Successfully added ${insertedProducts.length} products to the database`);
    insertedProducts.forEach(product => {
      console.log(`  - Product: ID=${product.id}, Name=${product.name}, Category=${product.category}`);
    });
    res.status(201).json({ success: true, message: `Successfully added ${insertedProducts.length} products`, products: insertedProducts });
  } catch (error) {
    console.error('Error adding products from CSV:', error);
    res.status(500).json({ success: false, message: 'Server error while adding products', error: error.message });
  }
});

// Update a product by MongoDB _id
router.put('/:id', validateObjectId, async (req, res) => {
  try {
    const {
      id,
      name,
      price,
      image,
      category,
      description,
      nutrients,
      calories,
      healthBenefits,
      tags,
    } = req.body;

    // Validate required fields
    if (!id || !name || !price || !image || !category) {
      return res.status(400).json({ success: false, message: 'ID, name, price, image, and category are required' });
    }

    // Validate data types
    if (
      typeof id !== 'string' ||
      typeof name !== 'string' ||
      typeof price !== 'string' ||
      typeof image !== 'string' ||
      typeof category !== 'string'
    ) {
      return res.status(400).json({ success: false, message: 'Invalid data types for required fields' });
    }

    // Validate optional fields
    if (nutrients && !Array.isArray(nutrients)) {
      return res.status(400).json({ success: false, message: 'Nutrients must be an array' });
    }
    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({ success: false, message: 'Tags must be an array' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        id,
        name,
        price,
        image,
        category,
        description: description || '',
        nutrients: nutrients || [],
        calories: calories || '',
        healthBenefits: healthBenefits || '',
        tags: tags || [],
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    console.log(`✅ Product updated successfully: ID=${id}, Name=${name}, Category=${category}`);
    res.status(200).json({ success: true, message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Server error while updating product', error: error.message });
  }
});

// Delete a product by MongoDB _id
router.delete('/:id', validateObjectId, async (req, res) => {
  try {
    console.log(`Attempting to delete product with ObjectId: ${req.params.id}`);
    
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      console.log(`Product with ObjectId ${req.params.id} not found`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    console.log(`✅ Successfully deleted product:`, {
      id: deletedProduct.id,
      name: deletedProduct.name,
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
