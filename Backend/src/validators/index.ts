import { z } from 'zod';

// Roles definition
export const ValidRoles = ['Fleet_Manager', 'Driver', 'Safety_Officer', 'Financial_Analyst', 'Admin'] as const;

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(ValidRoles, {
    errorMap: () => ({ message: 'Role must be one of: Fleet_Manager, Driver, Safety_Officer, Financial_Analyst, Admin' })
  })
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const vehicleSchema = z.object({
  registration_number: z.string().min(1, 'Registration number is required'),
  name_model: z.string().min(1, 'Name / Model is required'),
  type: z.string().optional(),
  max_load_capacity_kg: z.number().positive('Max load capacity must be a positive number'),
  acquisition_cost: z.number().positive('Acquisition cost must be a positive number'),
  region: z.string().optional()
});

export const driverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  license_number: z.string().min(1, 'License number is required'),
  license_category: z.string().optional(),
  license_expiry_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid license expiry date format'
  }),
  contact_number: z.string().optional()
});

export const tripSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  vehicle_id: z.number().int().positive('Vehicle ID must be a positive integer'),
  driver_id: z.number().int().positive('Driver ID must be a positive integer'),
  cargo_weight_kg: z.number().positive('Cargo weight must be a positive number'),
  planned_distance_km: z.number().positive('Planned distance must be a positive number')
});

export const maintenanceSchema = z.object({
  vehicle_id: z.number().int().positive('Vehicle ID must be a positive integer'),
  maintenance_type: z.string().min(1, 'Maintenance type is required'),
  description: z.string().optional(),
  cost: z.number().nonnegative('Cost must be zero or positive').optional(),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start date format'
  })
});

export const fuelLogSchema = z.object({
  vehicle_id: z.number().int().positive('Vehicle ID must be a positive integer'),
  trip_id: z.number().int().positive('Trip ID must be a positive integer').optional(),
  liters: z.number().positive('Liters must be a positive number'),
  cost: z.number().positive('Cost must be a positive number'),
  log_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid log date format'
  })
});

export const expenseSchema = z.object({
  vehicle_id: z.number().int().positive('Vehicle ID must be a positive integer').optional(),
  trip_id: z.number().int().positive('Trip ID must be a positive integer').optional(),
  expense_type: z.enum(['Toll', 'Maintenance', 'Fuel', 'Other'], {
    errorMap: () => ({ message: 'Expense type must be one of: Toll, Maintenance, Fuel, Other' })
  }),
  amount: z.number().positive('Amount must be a positive number'),
  expense_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid expense date format'
  }),
  description: z.string().optional()
});
