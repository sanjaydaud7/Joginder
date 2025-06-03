const express = require('express');
const router = express.Router();
const Product = require('./models/Product');

// Get all products or search by name/category
router.get('/', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    let products;

    if (searchQuery) {
      // Case-insensitive search by name or category
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
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error while fetching product' });
  }
});

// Create a new product
router.post('/', async (req, res) => {
  try {
    const { id, name, price, category } = req.body;

    if (!id || !name || !price || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newProduct = new Product({
      id,
      name,
      price,
      category,
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error while creating product' });
  }
});

// Delete a product by ObjectId
router.delete('/:id', async (req, res) => {
  try {
    console.log(`Attempting to delete product with ObjectId: ${req.params.id}`);
    
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      console.log(`Product with ObjectId ${req.params.id} not found`);
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    console.log(`✅ Successfully deleted product:`, {
      id: deletedProduct.id,
      name: deletedProduct.name,
      price: deletedProduct.price
    });
    
    res.status(200).json({ 
      success: true,
      message: 'Product deleted successfully',
      deletedProduct
    });
    
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete product',
      error: error.message 
    });
  }
});

module.exports = router;
