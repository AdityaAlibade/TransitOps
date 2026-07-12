import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { maintenanceSchema } from '../validators';

export const getMaintenanceLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicle_id, status } = req.query;

    const whereClause: any = {};
    if (vehicle_id) whereClause.vehicle_id = parseInt(String(vehicle_id), 10);
    if (status) whereClause.status = String(status);

    const logs = await prisma.maintenanceLog.findMany({
      where: whereClause,
      include: {
        vehicle: true
      }
    });

    return res.status(200).json({
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

export const createMaintenanceLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = maintenanceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const { vehicle_id, maintenance_type, description, cost, start_date } = parseResult.data;

    // Fetch vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicle_id }
    });

    if (!vehicle) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Vehicle not found'
      });
    }

    if (vehicle.status === 'Retired') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot add maintenance to a retired vehicle'
      });
    }

    // Atomically create maintenance log and set vehicle to 'In Shop'
    const newLog = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.create({
        data: {
          vehicle_id,
          maintenance_type,
          description,
          cost: cost ?? 0,
          status: 'Active',
          start_date: new Date(start_date)
        }
      });

      await tx.vehicle.update({
        where: { id: vehicle_id },
        data: { status: 'In Shop' }
      });

      return log;
    });

    return res.status(201).json({
      data: newLog
    });
  } catch (error) {
    next(error);
  }
};

export const closeMaintenanceLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid maintenance log ID'
      });
    }

    const closeSchema = z.object({
      end_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid end date format'
      }).optional(),
      cost: z.number().nonnegative('Cost must be positive or zero').optional()
    });

    const parseResult = closeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const { end_date, cost } = parseResult.data;

    // Fetch log
    const log = await prisma.maintenanceLog.findUnique({
      where: { id }
    });

    if (!log) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Maintenance record not found'
      });
    }

    if (log.status === 'Closed') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Maintenance record is already Closed'
      });
    }

    // Atomically close maintenance log, and if vehicle is not retired, restore status to 'Available'
    const updatedLog = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: 'Closed',
        end_date: end_date ? new Date(end_date) : new Date()
      };
      if (cost !== undefined) {
        updateData.cost = cost;
      }

      const updated = await tx.maintenanceLog.update({
        where: { id },
        data: updateData
      });

      const vehicle = await tx.vehicle.findUnique({
        where: { id: log.vehicle_id }
      });

      if (vehicle && vehicle.status !== 'Retired') {
        await tx.vehicle.update({
          where: { id: log.vehicle_id },
          data: { status: 'Available' }
        });
      }

      return updated;
    });

    return res.status(200).json({
      data: updatedLog
    });
  } catch (error) {
    next(error);
  }
};
