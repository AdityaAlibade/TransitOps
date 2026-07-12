import { Router } from 'express';
import { getExpenses, createExpense } from '../controllers/expenseController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all expense routes
router.use(authenticate);

router.get('/', getExpenses);
router.post('/', createExpense);
export default router;
