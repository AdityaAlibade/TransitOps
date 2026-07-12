import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export const getDashboardKpis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, status, region } = req.query;

    // Filters for vehicles
    const totalVehiclesWhere: any = {};
    if (type) totalVehiclesWhere.type = String(type);
    if (status) totalVehiclesWhere.status = String(status);
    if (region) totalVehiclesWhere.region = String(region);

    const statusCountsWhere: any = {};
    if (type) statusCountsWhere.type = String(type);
    if (region) statusCountsWhere.region = String(region);

    // Run vehicle count queries in parallel
    const [
      totalVehicles,
      availableVehicles,
      vehiclesOnTrip,
      vehiclesInShop
    ] = await Promise.all([
      prisma.vehicle.count({ where: totalVehiclesWhere }),
      prisma.vehicle.count({ where: { ...statusCountsWhere, status: 'Available' } }),
      prisma.vehicle.count({ where: { ...statusCountsWhere, status: 'On Trip' } }),
      prisma.vehicle.count({ where: { ...statusCountsWhere, status: 'In Shop' } })
    ]);

    // Trips count queries
    const [
      activeTrips,
      pendingTrips,
      completedTrips
    ] = await Promise.all([
      prisma.trip.count({ where: { status: 'Dispatched' } }),
      prisma.trip.count({ where: { status: 'Draft' } }),
      prisma.trip.count({ where: { status: 'Completed' } })
    ]);

    // Drivers count queries
    const [
      totalDrivers,
      driversOnDuty,
      availableDrivers
    ] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'On Trip' } }),
      prisma.driver.count({ where: { status: 'Available' } })
    ]);

    // Fleet utilization calculation
    // calculated as (vehiclesOnTrip / totalVehicles) * 100, returned as a percentage rounded to 2 decimal places. Return 0 if totalVehicles is 0.
    let fleetUtilization = 0;
    if (totalVehicles > 0) {
      // Note: for fleet utilization, we should use the totalVehicles count *with* status query param or statusCounts (since vehiclesOnTrip uses statusCountsWhere which doesn't include status).
      // Wait, standard fleet utilization is: (vehicles on trip in this region/type) / (total vehicles in this region/type) * 100.
      // Let's count total vehicles in the filtered region/type (i.e. statusCountsWhere) for the denominator to make it consistent.
      const totalVehiclesForUtilization = await prisma.vehicle.count({ where: statusCountsWhere });
      if (totalVehiclesForUtilization > 0) {
        fleetUtilization = parseFloat(((vehiclesOnTrip / totalVehiclesForUtilization) * 100).toFixed(2));
      }
    }

    // Expiring licenses count
    // count of drivers whose license_expiry_date is within the next 30 days from today.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const expiringLicenses = await prisma.driver.count({
      where: {
        license_expiry_date: {
          gte: today,
          lte: thirtyDaysFromNow
        }
      }
    });

    return res.status(200).json({
      data: {
        totalVehicles,
        availableVehicles,
        vehiclesOnTrip,
        vehiclesInShop,
        activeTrips,
        pendingTrips,
        completedTrips,
        totalDrivers,
        driversOnDuty,
        availableDrivers,
        fleetUtilization,
        expiringLicenses
      }
    });
  } catch (error) {
    next(error);
  }
};
