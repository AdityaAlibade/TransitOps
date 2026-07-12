import { Router } from 'express';
import { getFuelLogs, createFuelLog } from '../controllers/fuelLogController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all fuel log routes
router.use(authenticate);

router.get('/', getFuelLogs);
router.post('/', createFuelLog);

export default router;
