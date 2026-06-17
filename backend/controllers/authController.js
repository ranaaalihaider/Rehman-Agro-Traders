import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import jwt from 'jsonwebtoken';
import { logActivity } from './activityController.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      await logActivity('Admin Login', `User "${user.name}" (${username}) logged in`, username);
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(oldPassword))) {
      user.password = newPassword;
      await user.save();
      await logActivity(
        'Password Changed', 
        `User "${user.name}" updated password`, 
        user.username,
        { passwordChanged: false },
        { passwordChanged: true }
      );
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(400).json({ message: 'Invalid old password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a user
// @route   POST /api/auth/users
// @access  Private
export const createUser = async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ message: 'All fields (name, username, password) are required' });
  }

  try {
    const userExists = await User.findOne({ username: username.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const newUser = await User.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      password,
    });

    await logActivity(
      'Admin Created',
      `Created new admin user: "${newUser.name}" (${newUser.username})`,
      req.user.username,
      null,
      { name: newUser.name, username: newUser.username }
    );

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      username: newUser.username,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/auth/users/:id
// @access  Private
export const deleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Check self deletion
    if (userToDelete._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // 2. Enforce: "only delete the admin if no invoice exist or deleted all related to that admin"
    const invoicesCount = await Transaction.countDocuments({ createdBy: userToDelete.username });
    if (invoicesCount > 0) {
      return res.status(400).json({
        message: `Cannot delete admin "${userToDelete.name}". They have created ${invoicesCount} active stock invoice(s). You must delete those invoices first.`,
      });
    }

    await User.findByIdAndDelete(req.params.id);

    await logActivity(
      'Admin Deleted',
      `Deleted admin user: "${userToDelete.name}" (${userToDelete.username})`,
      req.user.username,
      { name: userToDelete.name, username: userToDelete.username },
      null
    );

    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
