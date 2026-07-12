import { Router } from 'express';
import {
  getMaintenanceLogs,
  createMaintenanceLog,
  closeMaintenanceLog
} from '../controllers/maintenanceController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all maintenance routes
router.use(authenticate);

router.get('/', getMaintenanceLogs);
router.post('/', createMaintenanceLog);
router.patch('/:id/close', closeMaintenanceLog);
export default router;
