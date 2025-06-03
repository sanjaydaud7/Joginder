const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);