import { Router } from 'express';
import { getDashboardKpis } from '../controllers/dashboardController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all dashboard routes
router.use(authenticate);

router.get('/kpis', getDashboardKpis);
export default router;
