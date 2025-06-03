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

// Get user counts by month for the current year
router.get('/by-month', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const usersByMonth = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31, 23, 59, 59, 999),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: {
            $arrayElemAt: [
              [
                '', 'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
              ],
              '$_id',
            ],
          },
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);

    res.status(200).json(usersByMonth);
  } catch (error) {
    console.error('Error fetching users by month:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching user data', error: error.message });
  }
});

module.exports = router;
