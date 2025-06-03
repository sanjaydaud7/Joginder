const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users or search by name or email
router.get('/', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    let users;

    if (searchQuery) {
      // Case-insensitive search by firstName, lastName, or email
      users = await User.find({
        $or: [
          { fName: { $regex: searchQuery, $options: 'i' } },
          { lName: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
        ],
      });
    } else {
      users = await User.find();
    }

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

module.exports = router;
