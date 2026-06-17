import express from 'express';
import {
  loginUser,
  updatePassword,
  getUsers,
  createUser,
  deleteUser,
  logoutSelfAllDevices,
  logoutAllUsersAllDevices,
  updateUserPassword,
} from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.put('/password', protect, updatePassword);

router.put('/logout-self', protect, logoutSelfAllDevices);
router.put('/logout-all', protect, logoutAllUsersAllDevices);
router.put('/users/password', protect, updateUserPassword);

router.route('/users')
  .get(protect, getUsers)
  .post(protect, createUser);

router.route('/users/:id')
  .delete(protect, deleteUser);

export default router;
