import express from 'express';
import { getDashboardStats, getDateWiseStockReport } from '../controllers/reportController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardStats);
router.get('/date-wise', protect, getDateWiseStockReport);

export default router;
