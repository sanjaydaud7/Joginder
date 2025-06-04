const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// @route   POST api/auth/register
// @desc    Register a new admin
// @access  Public
router.post('/register', async (req, res) => {
    const { fullName, email, password, position, phone, role } = req.body;

    try {
        // Validate required fields
        if (!fullName || !email || !password || !position) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        // Check if admin already exists
        let admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Create new admin
        admin = new Admin({
            fullName,
            email,
            password,
            position,
            phone,
            role
        });

        await admin.save();

        // Create token
        const token = admin.getSignedJwtToken();

        res.status(201).json({ 
            success: true,
            token 
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   POST api/auth/login
// @desc    Login admin
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check for admin
        const admin = await Admin.findOne({ email }).select('+password');
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await admin.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = admin.getSignedJwtToken();

        res.status(200).json({ 
            success: true,
            token 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});



module.exports = router;