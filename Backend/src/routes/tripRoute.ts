import { Router } from 'express';
import {
  getTrips,
  getTripById,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip
} from '../controllers/tripController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all trip routes
router.use(authenticate);

router.get('/', getTrips);
router.get('/:id', getTripById);
router.post('/', createTrip);
router.patch('/:id/dispatch', dispatchTrip);
router.patch('/:id/complete', completeTrip);
router.patch('/:id/cancel', cancelTrip);
export default router;
