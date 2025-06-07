const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later'
});

// @route   POST api/auth/register
// @desc    Register a new admin
// @access  Public
router.post('/register', async (req, res) => {
    const { fullName, email, password, position, phone, role } = req.body;

    try {
        // Validate required fields
        if (!fullName || !email || !password || !position) {
            return res.status(400).json({ 
                success: false,
                message: 'All required fields must be provided' 
            });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate password strength
        if (password.length < 8 || !/[A-Z]/.test(password) || 
            !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers'
            });
        }

        // Check if admin already exists
        let admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({ 
                success: false,
                message: 'Admin already exists' 
            });
        }

        // Create new admin
        admin = new Admin({
            fullName,
            email,
            password,
            position,
            phone,
            role: role || 'admin' // Default to admin if not specified
        });

        await admin.save();

        // Create token with expiration
        const token = admin.getSignedJwtToken();

        // Set secure cookie with token
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(201).json({ 
            success: true,
            token,
            user: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: err.message 
        });
    }
});

// @route   POST api/auth/login
// @desc    Login admin
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required' 
            });
        }

        // Check for admin
        const admin = await Admin.findOne({ email }).select('+password +loginAttempts +lockUntil');
        if (!admin) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        // Check if account is locked
        if (admin.lockUntil && admin.lockUntil > Date.now()) {
            return res.status(403).json({
                success: false,
                message: `Account locked. Try again after ${Math.ceil((admin.lockUntil - Date.now()) / 1000)} seconds`
            });
        }

        // Check password
        const isMatch = await admin.matchPassword(password);
        if (!isMatch) {
            // Increment failed attempts
            admin.loginAttempts += 1;
            
            // Lock account after 5 failed attempts for 5 minutes
            if (admin.loginAttempts >= 5) {
                admin.lockUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
                admin.loginAttempts = 0;
            }
            
            await admin.save();
            
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        // Reset login attempts on successful login
        admin.loginAttempts = 0;
        admin.lockUntil = undefined;
        await admin.save();

        // Create token with expiration
        const token = admin.getSignedJwtToken();

        // Set secure cookie with token
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({ 
            success: true,
            token,
            user: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: err.message 
        });
    }
});

// @route   GET api/auth/verify
// @desc    Verify token
// @access  Private
router.get('/verify', async (req, res) => {
    try {
        // Get token from header or cookie
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.adminToken) {
            token = req.cookies.adminToken;
        }

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No token provided' 
            });
        }

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid token' 
                });
            }

            // Check if admin still exists
            const admin = await Admin.findById(decoded.id);
            if (!admin) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Admin not found' 
                });
            }

            res.status(200).json({ 
                success: true,
                user: {
                    id: admin._id,
                    fullName: admin.fullName,
                    email: admin.email,
                    role: admin.role
                }
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during token verification' 
        });
    }
});

// @route   GET api/auth/logout
// @desc    Logout admin
// @access  Private
router.get('/logout', (req, res) => {
    // Clear cookie
    res.clearCookie('adminToken');
    
    res.status(200).json({ 
        success: true,
        message: 'Logged out successfully' 
    });
});

module.exports = router;