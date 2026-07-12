import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { fuelLogSchema } from '../validators';

export const getFuelLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicle_id, trip_id } = req.query;

    const whereClause: any = {};
    if (vehicle_id) whereClause.vehicle_id = parseInt(String(vehicle_id), 10);
    if (trip_id) whereClause.trip_id = parseInt(String(trip_id), 10);

    const logs = await prisma.fuelLog.findMany({
      where: whereClause,
      include: {
        vehicle: true,
        trip: true
      }
    });

    return res.status(200).json({
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

export const createFuelLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = fuelLogSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const { vehicle_id, trip_id, liters, cost, log_date } = parseResult.data;

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicle_id }
    });
    if (!vehicle) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Vehicle not found'
      });
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

    const log = await prisma.fuelLog.create({
      data: {
        vehicle_id,
        trip_id,
        liters,
        cost,
        log_date: new Date(log_date)
      }
    });

    return res.status(201).json({
      data: log
    });
  } catch (error) {
    next(error);
  }
};
