import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { expenseSchema } from '../validators';

export const getExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicle_id, trip_id, expense_type } = req.query;

    const whereClause: any = {};
    if (vehicle_id) whereClause.vehicle_id = parseInt(String(vehicle_id), 10);
    if (trip_id) whereClause.trip_id = parseInt(String(trip_id), 10);
    if (expense_type) whereClause.expense_type = String(expense_type);

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        vehicle: true,
        trip: true
      }
    });

    return res.status(200).json({
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = expenseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const { vehicle_id, trip_id, expense_type, amount, expense_date, description } = parseResult.data;

    // Check if vehicle exists if provided
    if (vehicle_id) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicle_id }
      });
      if (!vehicle) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Vehicle not found'
        });
      }
    }

    // Check if trip exists if provided
    if (trip_id) {
      const trip = await prisma.trip.findUnique({
        where: { id: trip_id }
      });
      if (!trip) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Trip not found'
        });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        vehicle_id,
        trip_id,
        expense_type,
        amount,
        expense_date: new Date(expense_date),
        description
      }
    });

    return res.status(201).json({
      data: expense
    });
  } catch (error) {
    next(error);
  }
};
