import { Router } from 'express';
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver
} from '../controllers/driverController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all driver routes
router.use(authenticate);

router.get('/', getDrivers);
router.get('/:id', getDriverById);
router.post('/', createDriver);
router.put('/:id', updateDriver);
router.delete('/:id', deleteDriver);

export default router;
