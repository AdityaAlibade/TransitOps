import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { scanAndGenerateReminders, sendManualReminder } from '../services/reminderService';
import { authenticate } from '../middleware/authMiddleware';
import { z } from 'zod';

const router = Router();

// Protect all reminder endpoints
router.use(authenticate);

// GET /api/reminders - List all reminders
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reminders = await prisma.reminder.findMany({
      orderBy: { sent_at: 'desc' }
    });
    return res.status(200).json({ data: reminders });
  } catch (error) {
    next(error);
  }
});

// POST /api/reminders/scan - Run automated expiry/maintenance checks
router.post('/scan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newLogs = await scanAndGenerateReminders();
    return res.status(200).json({
      message: `Database scanned. Generated ${newLogs.length} new automated reminders.`,
      data: newLogs
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/reminders/send-manual - Dispatches manual custom reminder
router.post('/send-manual', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const manualSchema = z.object({
      recipient: z.string().email('Invalid email address'),
      subject: z.string().min(1, 'Subject is required'),
      body: z.string().min(1, 'Body is required'),
      type: z.string().default('Manual')
    });

    const parseResult = manualSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const { recipient, subject, body, type } = parseResult.data;

    const reminder = await sendManualReminder(type, recipient, subject, body);

    // Also add to audit logs
    await prisma.activityLog.create({
      data: {
        user_id: (req as any).user.id,
        action: 'EMAIL_REMINDER_SENT',
        details: `Manual reminder sent to ${recipient}: "${subject}"`
      }
    });

    return res.status(201).json({
      message: 'Manual email logged successfully.',
      data: reminder
    });
  } catch (error) {
    next(error);
  }
});

export default router;
