import { Router } from 'express';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protect all expense routes
router.use(authenticate);

router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
export default router;
