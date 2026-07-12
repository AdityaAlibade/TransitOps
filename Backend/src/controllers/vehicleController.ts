import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { vehicleSchema } from '../validators';

export const getVehicles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type, region } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = String(status);
    if (type) whereClause.type = String(type);
    if (region) whereClause.region = String(region);

    const vehicles = await prisma.vehicle.findMany({
      where: whereClause
    });

    return res.status(200).json({
      data: vehicles
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid vehicle ID'
      });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: true,
        maintenance_logs: true,
        fuel_logs: true
      }
    });

    if (!vehicle) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Vehicle not found'
      });
    }

    return res.status(200).json({
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

export const createVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = vehicleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const { registration_number, name_model, type, max_load_capacity_kg, acquisition_cost, region } = parseResult.data;

    // Check uniqueness of registration number
    const existing = await prisma.vehicle.findUnique({
      where: { registration_number }
    });

    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Registration number already exists'
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        registration_number,
        name_model,
        type,
        max_load_capacity_kg,
        acquisition_cost,
        region,
        status: 'Available'
      }
    });

    return res.status(201).json({
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid vehicle ID'
      });
    }

    // Validate partial update fields using partial schema
    const parseResult = vehicleSchema.partial().extend({
      status: vehicleSchema.shape.registration_number.optional() // allow status string optionally
    }).safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const updateData = { ...req.body };

    // Fetch existing vehicle to verify existence
    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Vehicle not found'
      });
    }

    // Protect status field updates
    if (updateData.status !== undefined && updateData.status !== vehicle.status) {
      const userRole = req.user?.role;
      if (userRole !== 'Fleet_Manager' && userRole !== 'Admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only Fleet_Manager or Admin can update vehicle status directly'
        });
      }
    }

    // Check registration number uniqueness if it is being changed
    if (updateData.registration_number && updateData.registration_number !== vehicle.registration_number) {
      const existing = await prisma.vehicle.findUnique({
        where: { registration_number: updateData.registration_number }
      });
      if (existing) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Registration number already exists'
        });
      }
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData
    });

    return res.status(200).json({
      data: updatedVehicle
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid vehicle ID'
      });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Vehicle not found'
      });
    }

    if (vehicle.status !== 'Available') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Vehicle cannot be deleted while active (current status: ${vehicle.status})`
      });
    }

    // Soft delete: set status to 'Retired'
    const updated = await prisma.vehicle.update({
      where: { id },
      data: { status: 'Retired' }
    });

    return res.status(200).json({
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
