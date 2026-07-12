import { Router } from 'express';
import {
  getFuelEfficiency,
  getUtilization,
  getOperationalCost,
  getRoi,
  exportCSV
} from '../controllers/reportController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all report routes
router.use(authenticate);

router.get('/fuel-efficiency', getFuelEfficiency);
router.get('/utilization', getUtilization);
router.get('/operational-cost', getOperationalCost);
router.get('/roi', getRoi);
router.get('/export/csv', exportCSV);

export default router;
