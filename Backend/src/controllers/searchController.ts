import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = String(req.query.q || '').trim();

    if (!query) {
      return res.status(200).json({
        data: {
          vehicles: [],
          drivers: [],
          trips: []
        }
      });
    }

    // Search Vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: {
        OR: [
          { registration_number: { contains: query, mode: 'insensitive' } },
          { name_model: { contains: query, mode: 'insensitive' } },
          { region: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    // Search Drivers
    const { role, userId } = req.user!;
    let driverWhereClause: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { license_number: { contains: query, mode: 'insensitive' } },
        { contact_number: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (role === 'Driver') {
      driverWhereClause = {
        AND: [
          driverWhereClause,
          { user_id: userId }
        ]
      };
    }

    const drivers = role === 'Financial_Analyst' ? [] : await prisma.driver.findMany({
      where: driverWhereClause,
      take: 5
    });

    // Search Trips (Trip model does not have trip_number field; query source, destination, or numerical ID instead)
    const tripOR: any[] = [
      { source: { contains: query, mode: 'insensitive' } },
      { destination: { contains: query, mode: 'insensitive' } }
    ];

    const parsedId = parseInt(query, 10);
    if (!isNaN(parsedId)) {
      tripOR.push({ id: parsedId });
    }

    let tripWhereClause: any = { OR: tripOR };

    if (role === 'Driver') {
      tripWhereClause = {
        AND: [
          tripWhereClause,
          { driver: { user_id: userId } }
        ]
      };
    }

    const trips = await prisma.trip.findMany({
      where: tripWhereClause,
      take: 5
    });

    return res.status(200).json({
      data: {
        vehicles,
        drivers,
        trips
      }
    });
  } catch (error) {
    next(error);
  }
};
