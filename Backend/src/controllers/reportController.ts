import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

// Helper to convert array of objects to CSV format
const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const strVal = val === null || val === undefined ? '' : String(val);
      // Escape quotes and wrap in quotes if there are special characters
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\r\n');
};

export const getFuelEfficiencyReport = async () => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: {
        where: {
          status: 'Completed',
          fuel_consumed_liters: { not: null },
          actual_distance_km: { not: null }
        }
      }
    }
  });

  return vehicles
    .map(v => {
      let totalDistance = 0;
      let totalFuel = 0;
      for (const trip of v.trips) {
        totalDistance += Number(trip.actual_distance_km || 0);
        totalFuel += Number(trip.fuel_consumed_liters || 0);
      }
      if (totalFuel === 0) return null;
      const efficiency = totalDistance / totalFuel;
      return {
        vehicle_id: v.id,
        registration_number: v.registration_number,
        name_model: v.name_model,
        total_distance_km: parseFloat(totalDistance.toFixed(2)),
        total_fuel_liters: parseFloat(totalFuel.toFixed(2)),
        efficiency_km_per_liter: parseFloat(efficiency.toFixed(2))
      };
    })
    .filter(item => item !== null);
};

export const getUtilizationReport = async () => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: {
        where: {
          status: 'Completed',
          actual_distance_km: { not: null }
        }
      }
    }
  });

  const report = vehicles.map(v => {
    let totalDistance = 0;
    for (const trip of v.trips) {
      totalDistance += Number(trip.actual_distance_km || 0);
    }
    return {
      vehicle_id: v.id,
      registration_number: v.registration_number,
      name_model: v.name_model,
      completed_trips_count: v.trips.length,
      total_distance_km: parseFloat(totalDistance.toFixed(2))
    };
  });

  // Sort by total distance descending
  report.sort((a, b) => b.total_distance_km - a.total_distance_km);
  return report;
};

export const getOperationalCostReport = async () => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      fuel_logs: true,
      maintenance_logs: true
    }
  });

  return vehicles.map(v => {
    let totalFuelCost = 0;
    for (const log of v.fuel_logs) {
      totalFuelCost += Number(log.cost);
    }
    let totalMaintenanceCost = 0;
    for (const log of v.maintenance_logs) {
      totalMaintenanceCost += Number(log.cost);
    }
    return {
      vehicle_id: v.id,
      registration_number: v.registration_number,
      total_fuel_cost: parseFloat(totalFuelCost.toFixed(2)),
      total_maintenance_cost: parseFloat(totalMaintenanceCost.toFixed(2)),
      total_operational_cost: parseFloat((totalFuelCost + totalMaintenanceCost).toFixed(2))
    };
  });
};

export const getRoiReport = async () => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      fuel_logs: true,
      maintenance_logs: true,
      expenses: {
        where: {
          expense_type: 'Other'
        }
      }
    }
  });

  return vehicles.map(v => {
    let totalFuelCost = 0;
    for (const log of v.fuel_logs) {
      totalFuelCost += Number(log.cost);
    }
    let totalMaintenanceCost = 0;
    for (const log of v.maintenance_logs) {
      totalMaintenanceCost += Number(log.cost);
    }
    let totalRevenue = 0;
    for (const exp of v.expenses) {
      totalRevenue += Number(exp.amount);
    }

    const acquisitionCost = Number(v.acquisition_cost);
    const totalCosts = totalFuelCost + totalMaintenanceCost;
    
    let roiPercentage = 0;
    if (acquisitionCost > 0) {
      roiPercentage = ((totalRevenue - totalCosts) / acquisitionCost) * 100;
    }

    return {
      vehicle_id: v.id,
      registration_number: v.registration_number,
      acquisition_cost: parseFloat(acquisitionCost.toFixed(2)),
      total_costs: parseFloat(totalCosts.toFixed(2)),
      roi_percentage: parseFloat(roiPercentage.toFixed(2))
    };
  });
};

export const getFuelEfficiency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await getFuelEfficiencyReport();
    return res.status(200).json({ data: report });
  } catch (error) {
    next(error);
  }
};

export const getUtilization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await getUtilizationReport();
    return res.status(200).json({ data: report });
  } catch (error) {
    next(error);
  }
};

export const getOperationalCost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await getOperationalCostReport();
    return res.status(200).json({ data: report });
  } catch (error) {
    next(error);
  }
};

export const getRoi = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await getRoiReport();
    return res.status(200).json({ data: report });
  } catch (error) {
    next(error);
  }
};

export const exportCSV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { report } = req.query;
    let data: any[] = [];

    switch (report) {
      case 'fuel-efficiency':
        data = await getFuelEfficiencyReport();
        break;
      case 'utilization':
        data = await getUtilizationReport();
        break;
      case 'operational-cost':
        data = await getOperationalCostReport();
        break;
      case 'roi':
        data = await getRoiReport();
        break;
      default:
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid report type. Must be one of: fuel-efficiency, utilization, operational-cost, roi'
        });
    }

    const csvContent = convertToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transitops-${report}-report.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
