import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { driverSchema } from '../validators';
import { z } from 'zod';

export const getDrivers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = String(status);

    const { role, userId } = req.user!;

    if (role === 'Financial_Analyst') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Financial Analysts do not have access to driver data.'
      });
    }

    // Drivers can only see their own profile
    if (role === 'Driver') {
      whereClause.user_id = userId;
    }

    const drivers = await prisma.driver.findMany({
      where: whereClause
    });

    return res.status(200).json({
      data: drivers
    });
  } catch (error) {
    next(error);
  }
};

export const getDriverById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid driver ID'
      });
    }

    const { role, userId } = req.user!;

    if (role === 'Financial_Analyst') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Financial Analysts do not have access to driver data.'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        trips: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    // Drivers can only see their own profile
    if (role === 'Driver' && driver.user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are only authorized to access your own driver profile.'
      });
    }

    return res.status(200).json({
      data: driver
    });
  } catch (error) {
    next(error);
  }
};

export const createDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.user!;

    if (role === 'Financial_Analyst' || role === 'Driver') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to create driver profiles.'
      });
    }

    const parseResult = driverSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const { name, license_number, license_category, license_expiry_date, contact_number } = parseResult.data;

    // Check if license number exists
    const existing = await prisma.driver.findUnique({
      where: { license_number }
    });

    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'License number already exists'
      });
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        license_number,
        license_category,
        license_expiry_date: new Date(license_expiry_date),
        contact_number,
        status: 'Available'
      }
    });

    return res.status(201).json({
      data: driver
    });
  } catch (error) {
    next(error);
  }
};

export const updateDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid driver ID'
      });
    }

    const { role, userId } = req.user!;

    if (role === 'Financial_Analyst' || role === 'Driver') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to update driver profiles.'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { id }
    });

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    const parseResult = driverSchema.partial().extend({
      status: driverSchema.shape.license_number.optional(),
      safety_score: z.any().optional()
    }).safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const updateData = { ...req.body };

    // Check if safety_score (Safety Rating) is being manually modified
    if (updateData.safety_score !== undefined) {
      let allowed = role === 'Admin' || role === 'Safety_Officer';

      if (role === 'Fleet_Manager') {
        const override = await prisma.userPermission.findFirst({
          where: {
            user_id: userId,
            permission: { name: 'driver.rating.edit' }
          }
        });
        if (override && override.value === true) {
          allowed = true;
        }
      }

      if (!allowed) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient Permissions: You do not have permission to edit the Driver Safety Rating (Safety Score).'
        });
      }

      updateData.safety_score = Number(updateData.safety_score);
    }

    // Check license number uniqueness if being changed
    if (updateData.license_number && updateData.license_number !== driver.license_number) {
      const existing = await prisma.driver.findUnique({
        where: { license_number: updateData.license_number }
      });
      if (existing) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'License number already exists'
        });
      }
    }

    if (updateData.license_expiry_date) {
      updateData.license_expiry_date = new Date(updateData.license_expiry_date);
    }

    const updated = await prisma.driver.update({
      where: { id },
      data: updateData
    });

    return res.status(200).json({
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid driver ID'
      });
    }

    const { role } = req.user!;

    if (role === 'Financial_Analyst' || role === 'Driver') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to delete driver profiles.'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { id }
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
        message: `Driver cannot be deactivated/deleted while active (current status: ${driver.status})`
      });
    }

    // Soft delete: set status to 'Off Duty'
    const updated = await prisma.driver.update({
      where: { id },
      data: { status: 'Off Duty' }
    });

    return res.status(200).json({
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const getDriverRatings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid driver ID' });
    }

    const { role, userId } = req.user!;

    if (role === 'Financial_Analyst') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Financial Analysts do not have access to driver data.'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { id }
    });

    if (!driver) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Driver not found'
      });
    }

    // Drivers can only see their own profile ratings
    if (role === 'Driver' && driver.user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are only authorized to access your own ratings.'
      });
    }

    const ratings = await prisma.driverRating.findMany({
      where: { driver_id: id },
      include: {
        trip: true
      },
      orderBy: { created_at: 'desc' }
    });
    return res.status(200).json({ data: ratings });
  } catch (error) {
    next(error);
  }
};
