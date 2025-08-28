import express from 'express';
import {
  getQualityStatuses,
  getQualityStatusById,
  createQualityStatus,
  updateQualityStatus,
  deleteQualityStatus,
  getQualityStatusUsage,
} from '../controllers/qualityStatusController';

const router = express.Router();

// Get all quality statuses
router.get('/', getQualityStatuses);

// Get quality status by ID
router.get('/:id', getQualityStatusById);

// Get quality status usage statistics
router.get('/:id/usage', getQualityStatusUsage);

// Create new quality status
router.post('/', createQualityStatus);

// Update quality status
router.put('/:id', updateQualityStatus);

// Delete quality status
router.delete('/:id', deleteQualityStatus);

export default router;
