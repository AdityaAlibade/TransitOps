import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { driverSchema } from '../validators';

export const getDrivers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = String(status);

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

    return res.status(200).json({
      data: driver
    });
  } catch (error) {
    next(error);
  }
};

export const createDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    const parseResult = driverSchema.partial().extend({
      status: driverSchema.shape.license_number.optional() // allow status string optionally
    }).safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
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

    const updateData = { ...req.body };

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
