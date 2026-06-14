import express from 'express';
import {
  loginUser,
  updatePassword,
  getUsers,
  createUser,
  deleteUser,
} from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.put('/password', protect, updatePassword);

router.route('/users')
  .get(protect, getUsers)
  .post(protect, createUser);

router.route('/users/:id')
  .delete(protect, deleteUser);

export default router;
