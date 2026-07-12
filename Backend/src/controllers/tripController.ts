import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { tripSchema } from '../validators';

export const getTrips = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = String(status);

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        vehicle: true,
        driver: true
      }
    });

    return res.status(200).json({
      data: trips
    });
  } catch (error) {
    next(error);
  }
};

export const getTripById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid trip ID'
      });
    }

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
        fuel_logs: true,
        expenses: true
      }
    });

    if (!trip) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Trip not found'
      });
    }

    return res.status(200).json({
      data: trip
    });
  } catch (error) {
    next(error);
  }
};

export const createTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const parseResult = tripSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const { source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km } = parseResult.data;

    // Rule 1: Fetch and check Vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicle_id }
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
        message: 'Vehicle is not available for dispatch'
      });
    }

    // Rule 2: Fetch and check Driver
    const driver = await prisma.driver.findUnique({
      where: { id: driver_id }
    });

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    if (driver.status !== 'Available') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Driver is not available'
      });
    }

    // Rule 3: Check Driver License Expiry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(driver.license_expiry_date);
    if (expiryDate < today) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Driver license has expired and cannot be assigned to a trip'
      });
    }

    // Rule 4: Check Cargo Weight Capacity
    const maxCapacity = Number(vehicle.max_load_capacity_kg);
    if (cargo_weight_kg > maxCapacity) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Cargo weight exceeds vehicle maximum load capacity of ${maxCapacity} kg`
      });
    }

    // Create Draft Trip
    const trip = await prisma.trip.create({
      data: {
        source,
        destination,
        vehicle_id,
        driver_id,
        cargo_weight_kg,
        planned_distance_km,
        status: 'Draft',
        created_by: req.user.userId
      }
    });

    return res.status(201).json({
      data: trip
    });
  } catch (error) {
    next(error);
  }
};

export const dispatchTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid trip ID'
      });
    }

    const trip = await prisma.trip.findUnique({
      where: { id }
    });

    if (!trip) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Trip not found'
      });
    }

    if (trip.status !== 'Draft') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Cannot dispatch trip that is in status: ${trip.status}`
      });
    }

    // Atomically dispatch trip, mark vehicle & driver as 'On Trip'
    const updatedTrip = await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id },
        data: {
          status: 'Dispatched',
          dispatched_at: new Date()
        }
      });

      await tx.vehicle.update({
        where: { id: trip.vehicle_id },
        data: { status: 'On Trip' }
      });

      await tx.driver.update({
        where: { id: trip.driver_id },
        data: { status: 'On Trip' }
      });

      return updated;
    });

    return res.status(200).json({
      data: updatedTrip
    });
  } catch (error) {
    next(error);
  }
};

export const completeTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid trip ID'
      });
    }

    // Validate body
    const completeSchema = z.object({
      actual_distance_km: z.number().positive('Actual distance must be a positive number').optional(),
      fuel_consumed_liters: z.number().positive('Fuel consumed must be a positive number').optional()
    });

    const parseResult = completeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const { actual_distance_km, fuel_consumed_liters } = parseResult.data;

    const trip = await prisma.trip.findUnique({
      where: { id }
    });

    if (!trip) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Trip not found'
      });
    }

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Cannot complete trip that is not currently Dispatched (current status: ${trip.status})`
      });
    }

    // Atomically complete trip, update vehicle odometer & release vehicle & driver to 'Available'
    const updatedTrip = await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id },
        data: {
          status: 'Completed',
          completed_at: new Date(),
          actual_distance_km,
          fuel_consumed_liters
        }
      });

      const vehicleData: any = { status: 'Available' };
      if (actual_distance_km !== undefined) {
        vehicleData.odometer_km = { increment: actual_distance_km };
      }

      await tx.vehicle.update({
        where: { id: trip.vehicle_id },
        data: vehicleData
      });

      await tx.driver.update({
        where: { id: trip.driver_id },
        data: { status: 'Available' }
      });

      return updated;
    });

    return res.status(200).json({
      data: updatedTrip
    });
  } catch (error) {
    next(error);
  }
};

export const cancelTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid trip ID'
      });
    }

    const trip = await prisma.trip.findUnique({
      where: { id }
    });

    if (!trip) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Trip not found'
      });
    }

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Cannot cancel trip that is already ${trip.status}`
      });
    }

    // Atomically cancel and revert vehicle/driver statuses if it was 'Dispatched'
    const updatedTrip = await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id },
        data: { status: 'Cancelled' }
      });

      if (trip.status === 'Dispatched') {
        await tx.vehicle.update({
          where: { id: trip.vehicle_id },
          data: { status: 'Available' }
        });

        await tx.driver.update({
          where: { id: trip.driver_id },
          data: { status: 'Available' }
        });
      }

      return updated;
    });

    return res.status(200).json({
      data: updatedTrip
    });
  } catch (error) {
    next(error);
  }
};
