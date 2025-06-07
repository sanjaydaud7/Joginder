const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// POST route to create a new order
router.post('/create', async (req, res) => {
  try {
    const { user, product, quantity, totalPrice, address } = req.body;

    // Validate required fields
    if (!user || !product || !quantity || !totalPrice || !address) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // Additional validation for quantity and totalPrice
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ status: 'error', message: 'Quantity must be a positive integer' });
    }
    if (typeof totalPrice !== 'number' || totalPrice < 0) {
      return res.status(400).json({ status: 'error', message: 'Total price must be a non-negative number' });
    }

    // Validate product fields
    if (!product.name || typeof product.price !== 'number') {
      return res.status(400).json({ status: 'error', message: 'Product name and price are required' });
    }

    // Validate address fields
    if (!address.fullName || !address.addressLine1 || !address.city || !address.state || !address.zipCode || !address.country || !address.phone ) {
      return res.status(400).json({ status: 'error', message: 'All required address fields must be provided' });
    }

    // Create new order
    const order = new Order({
      user,
      product,
      quantity,
      totalPrice,
      address,
      status: 'pending',
      createdAt: new Date(),
    });

    // Save order to MongoDB
    await order.save();

    // Log success message with address details
    console.log(`Order successfully created! Order ID: ${order._id}, User: ${user}, Product: ${product.name}, Quantity: ${quantity}, Total Price: $${totalPrice}, Address: ${address.fullName}, ${address.addressLine1}, ${address.addressLine2 ? address.addressLine2 + ', ' : ''}${address.city}, ${address.state}, ${address.zipCode}, ${address.country}`);

    res.status(201).json({ 
      status: 'success', 
      message: 'Order created successfully!', 
      orderId: order._id 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ status: 'error', message: 'Server error while creating order' });
  }
});

// GET route to fetch all orders or search by status
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.status = { $regex: search, $options: 'i' };
    }

    const orders = await Order.find(query).populate('user', 'fName lName email phone');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ status: 'error', message: 'Server error while fetching orders' });
  }
});

// GET route to fetch a single order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'fName lName email phone');
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ status: 'error', message: 'Server error while fetching order' });
  }
});

// PUT route to update order status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'fName lName email phone');
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    res.json({ status: 'success', message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ status: 'error', message: 'Server error while updating order' });
  }
});

// DELETE route to delete an order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    res.json({ status: 'success', message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ status: 'error', message: 'Server error while deleting order' });
  }
});

module.exports = router;