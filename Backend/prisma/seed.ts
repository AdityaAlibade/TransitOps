import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.activityLog.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();

  console.log('Seeding database...');

  // 1. Seed Permissions
  const permissionsList = [
    'vehicles:read',
    'vehicles:write',
    'drivers:read',
    'drivers:write',
    'trips:read',
    'trips:write',
    'trips:read:own',
    'trips:write:own',
    'maintenance:read',
    'maintenance:write',
    'expenses:read',
    'expenses:write',
    'reports:read',
    'reports:generate',
    'reports:export',
    'users:read',
    'users:write',
    'activity_logs:read'
  ];

  const dbPermissions = [];
  for (const name of permissionsList) {
    const p = await prisma.permission.create({ data: { name } });
    dbPermissions.push(p);
  }
  const permMap = new Map(dbPermissions.map(p => [p.name, p.id]));

  // 2. Seed Roles
  const roles = [
    {
      name: 'Admin',
      perms: permissionsList
    },
    {
      name: 'Fleet_Manager',
      perms: [
        'vehicles:read', 'vehicles:write',
        'drivers:read', 'drivers:write',
        'trips:read', 'trips:write',
        'maintenance:read', 'maintenance:write',
        'expenses:read', 'expenses:write',
        'reports:read', 'reports:generate', 'reports:export'
      ]
    },
    {
      name: 'Driver',
      perms: [
        'trips:read:own', 'trips:write:own'
      ]
    },
    {
      name: 'Safety_Officer',
      perms: [
        'vehicles:read', 'vehicles:write',
        'drivers:read', 'drivers:write',
        'trips:read',
        'maintenance:read', 'maintenance:write'
      ]
    },
    {
      name: 'Financial_Analyst',
      perms: [
        'expenses:read', 'expenses:write',
        'reports:read', 'reports:generate', 'reports:export'
      ]
    }
  ];

  const roleMap = new Map<string, number>();
  for (const r of roles) {
    const dbRole = await prisma.role.create({ data: { name: r.name } });
    roleMap.set(r.name, dbRole.id);

    // Create role permissions
    for (const pName of r.perms) {
      const pId = permMap.get(pName);
      if (pId) {
        await prisma.rolePermission.create({
          data: {
            role_id: dbRole.id,
            permission_id: pId
          }
        });
      }
    }
  }

  // Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const driverPassword = await bcrypt.hash('driver123', 10);
  const safetyPassword = await bcrypt.hash('safety123', 10);
  const analystPassword = await bcrypt.hash('analyst123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Amit Sharma',
      email: 'admin@transitops.com',
      password_hash: adminPassword,
      role: 'Admin',
      role_id: roleMap.get('Admin')
    }
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar',
      email: 'manager@transitops.com',
      password_hash: managerPassword,
      role: 'Fleet_Manager',
      role_id: roleMap.get('Fleet_Manager')
    }
  });

  const driverUser = await prisma.user.create({
    data: {
      name: 'Arjun Singh',
      email: 'driver@transitops.com',
      password_hash: driverPassword,
      role: 'Driver',
      role_id: roleMap.get('Driver')
    }
  });

  await prisma.user.create({
    data: {
      name: 'Sanjay Mehta',
      email: 'safety@transitops.com',
      password_hash: safetyPassword,
      role: 'Safety_Officer',
      role_id: roleMap.get('Safety_Officer')
    }
  });

  await prisma.user.create({
    data: {
      name: 'Ananya Iyer',
      email: 'analyst@transitops.com',
      password_hash: analystPassword,
      role: 'Financial_Analyst',
      role_id: roleMap.get('Financial_Analyst')
    }
  });

  console.log('Users seeded.');

  // Create Vehicles
  const tataPrima = await prisma.vehicle.create({
    data: {
      registration_number: 'MH-12-PQ-1234',
      name_model: 'Tata Prima 4925',
      type: 'Truck',
      max_load_capacity_kg: 40000,
      acquisition_cost: 5000000,
      status: 'Available',
      region: 'West'
    }
  });

  const bolero = await prisma.vehicle.create({
    data: {
      registration_number: 'MH-12-RS-5678',
      name_model: 'Mahindra Bolero Pik-Up',
      type: 'Van',
      max_load_capacity_kg: 1500,
      acquisition_cost: 900000,
      status: 'On Trip',
      region: 'West'
    }
  });

  const splender = await prisma.vehicle.create({
    data: {
      registration_number: 'MH-12-TU-9012',
      name_model: 'Hero Super Splendor',
      type: 'Bike',
      max_load_capacity_kg: 100,
      acquisition_cost: 80000,
      status: 'Available',
      region: 'South'
    }
  });

  const benz = await prisma.vehicle.create({
    data: {
      registration_number: 'MH-12-VW-3456',
      name_model: 'BharatBenz 3523R',
      type: 'Truck',
      max_load_capacity_kg: 25000,
      acquisition_cost: 3800000,
      status: 'In Shop',
      region: 'North'
    }
  });

  const ashok = await prisma.vehicle.create({
    data: {
      registration_number: 'MH-12-XY-7890',
      name_model: 'Ashok Leyland Dost',
      type: 'Van',
      max_load_capacity_kg: 2000,
      acquisition_cost: 700000,
      status: 'Retired',
      region: 'East'
    }
  });

  console.log('Vehicles seeded.');

  // Create Drivers
  const john = await prisma.driver.create({
    data: {
      name: 'Jagdish Prasad',
      license_number: 'DL-12345678',
      license_category: 'Heavy Transport',
      license_expiry_date: new Date('2030-12-31T00:00:00Z'),
      contact_number: '9876543210',
      status: 'Available'
    }
  });

  const david = await prisma.driver.create({
    data: {
      name: 'Devendra Yadav',
      license_number: 'DL-87654321',
      license_category: 'Light Motor Vehicle',
      license_expiry_date: new Date('2029-06-30T00:00:00Z'),
      contact_number: '9876543211',
      status: 'On Trip',
      user_id: driverUser.id
    }
  });

  const expired = await prisma.driver.create({
    data: {
      name: 'Eshwar Gowda',
      license_number: 'DL-55556666',
      license_category: 'Heavy Transport',
      license_expiry_date: new Date('2025-05-15T00:00:00Z'), // Expired license
      contact_number: '9876543212',
      status: 'Available'
    }
  });

  const suspended = await prisma.driver.create({
    data: {
      name: 'Suresh Patil',
      license_number: 'DL-99990000',
      license_category: 'Heavy Transport',
      license_expiry_date: new Date('2031-01-01T00:00:00Z'),
      contact_number: '9876543213',
      status: 'Suspended'
    }
  });

  console.log('Drivers seeded.');

  // Create Completed Trips
  const trip1 = await prisma.trip.create({
    data: {
      source: 'Mumbai',
      destination: 'Pune',
      vehicle_id: tataPrima.id,
      driver_id: john.id,
      cargo_weight_kg: 30000,
      planned_distance_km: 150,
      actual_distance_km: 148,
      fuel_consumed_liters: 45,
      status: 'Completed',
      created_by: manager.id,
      dispatched_at: new Date('2026-07-01T08:00:00Z'),
      completed_at: new Date('2026-07-01T12:00:00Z')
    }
  });

  const trip2 = await prisma.trip.create({
    data: {
      source: 'Delhi',
      destination: 'Gurugram',
      vehicle_id: bolero.id,
      driver_id: david.id,
      cargo_weight_kg: 1000,
      planned_distance_km: 40,
      actual_distance_km: 42,
      fuel_consumed_liters: 4,
      status: 'Completed',
      created_by: manager.id,
      dispatched_at: new Date('2026-07-02T10:00:00Z'),
      completed_at: new Date('2026-07-02T11:30:00Z')
    }
  });

  const trip3 = await prisma.trip.create({
    data: {
      source: 'Bangalore',
      destination: 'Mysore',
      vehicle_id: splender.id,
      driver_id: john.id,
      cargo_weight_kg: 50,
      planned_distance_km: 140,
      actual_distance_km: 145,
      fuel_consumed_liters: 3,
      status: 'Completed',
      created_by: manager.id,
      dispatched_at: new Date('2026-07-03T11:00:00Z'),
      completed_at: new Date('2026-07-03T14:30:00Z')
    }
  });

  console.log('Trips seeded.');

  // Create Maintenance Logs
  await prisma.maintenanceLog.create({
    data: {
      vehicle_id: benz.id,
      maintenance_type: 'Engine Overhaul',
      description: 'Engine cylinder replacement and filter cleaning',
      cost: 50000,
      status: 'Active',
      start_date: new Date('2026-07-10T00:00:00Z')
    }
  });

  const closedMaint = await prisma.maintenanceLog.create({
    data: {
      vehicle_id: tataPrima.id,
      maintenance_type: 'Tyre Rotation',
      description: 'Wheel alignment and tyre rotation',
      cost: 8000,
      status: 'Closed',
      start_date: new Date('2026-06-15T00:00:00Z'),
      end_date: new Date('2026-06-16T00:00:00Z')
    }
  });

  console.log('Maintenance Logs seeded.');

  // Create Fuel Logs tied to Trips
  await prisma.fuelLog.create({
    data: {
      vehicle_id: tataPrima.id,
      trip_id: trip1.id,
      liters: 45,
      cost: 4500,
      log_date: new Date('2026-07-01T08:00:00Z')
    }
  });

  await prisma.fuelLog.create({
    data: {
      vehicle_id: bolero.id,
      trip_id: trip2.id,
      liters: 4,
      cost: 400,
      log_date: new Date('2026-07-02T10:00:00Z')
    }
  });

  await prisma.fuelLog.create({
    data: {
      vehicle_id: splender.id,
      trip_id: trip3.id,
      liters: 3,
      cost: 300,
      log_date: new Date('2026-07-03T11:00:00Z')
    }
  });

  console.log('Fuel Logs seeded.');

  // Create Expenses
  // Trip 1 fuel cost
  await prisma.expense.create({
    data: {
      vehicle_id: tataPrima.id,
      trip_id: trip1.id,
      expense_type: 'Fuel',
      amount: 4500,
      expense_date: new Date('2026-07-01T08:00:00Z'),
      description: 'Diesel purchase for Trip 1'
    }
  });

  // Trip 1 toll cost
  await prisma.expense.create({
    data: {
      vehicle_id: tataPrima.id,
      trip_id: trip1.id,
      expense_type: 'Toll',
      amount: 600,
      expense_date: new Date('2026-07-01T09:30:00Z'),
      description: 'Expressway toll charge'
    }
  });

  // Vehicle 1 Maintenance expense
  await prisma.expense.create({
    data: {
      vehicle_id: tataPrima.id,
      expense_type: 'Maintenance',
      amount: 8000,
      expense_date: new Date('2026-06-16T00:00:00Z'),
      description: 'Tyre rotation service charge'
    }
  });

  // ROI income proxies (Expense type 'Other' treated as revenue proxy)
  await prisma.expense.create({
    data: {
      vehicle_id: tataPrima.id,
      expense_type: 'Other',
      amount: 60000, // Revenue generated by Tata Prima
      expense_date: new Date('2026-07-05T00:00:00Z'),
      description: 'Client payment for Pune trip (Revenue Proxy)'
    }
  });

  await prisma.expense.create({
    data: {
      vehicle_id: bolero.id,
      expense_type: 'Other',
      amount: 12000, // Revenue generated by Bolero
      expense_date: new Date('2026-07-06T00:00:00Z'),
      description: 'Client payment for Gurugram shipment (Revenue Proxy)'
    }
  });

  console.log('Expenses seeded.');
  console.log('All database seeding operations completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
