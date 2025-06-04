const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Routes imported
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth'); // Add auth routes

// Load environment variables
dotenv.config();
console.log('JWT_SECRET:', process.env.JWT_SECRET); // Debug log

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://127.0.0.1:5500', // Live Server default
    'http://localhost:5500',  // Alternative Live Server URL
    'https://joginder.netlify.app' // Keep for production if needed
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json()); // Parse JSON request bodies

// Test route for debugging
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes); // Mount auth routes

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});