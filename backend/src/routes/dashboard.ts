import express from 'express';
import { dashboardController } from '../controllers/dashboardController';

const router = express.Router();

// GET /api/dashboard/summary - Overall inventory metrics
router.get('/summary', dashboardController.getSummary);

// GET /api/dashboard/alerts - Critical alerts and notifications
router.get('/alerts', dashboardController.getAlerts);

// GET /api/dashboard/trends - Trends and analytics
router.get('/trends', dashboardController.getTrends);

// GET /api/dashboard/categories - Category-wise breakdown
router.get('/categories', dashboardController.getCategories);

// GET /api/dashboard/value - Inventory value analysis
router.get('/value', dashboardController.getValue);

export default router;
