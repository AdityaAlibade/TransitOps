import { Router } from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicleController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication middleware to all vehicle routes
router.use(authenticate);

router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);
export default router;
