import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Route Imports
import authRoute from './routes/authRoute';
import dashboardRoute from './routes/dashboardRoute';
import vehicleRoute from './routes/vehicleRoute';
import driverRoute from './routes/driverRoute';
import tripRoute from './routes/tripRoute';
import maintenanceRoute from './routes/maintenanceRoute';
import expenseRoute from './routes/expenseRoute';
import reportRoute from './routes/reportRoute';
import fuelLogRoute from './routes/fuelLogRoute';
import userRoute from './routes/userRoute';
import reminderRoute from './routes/reminderRoute';
import searchRoute from './routes/searchRoute';

const app = express();

app.use(cors());
app.use(express.json());

// Root/Health route
app.get('/health', (req, res) => {
  res.json({ status: 'nominal', timestamp: new Date() });
});

// API Routes mounting
app.use('/api/auth', authRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/vehicles', vehicleRoute);
app.use('/api/drivers', driverRoute);
app.use('/api/trips', tripRoute);
app.use('/api/maintenance', maintenanceRoute);
app.use('/api/expenses', expenseRoute);
app.use('/api/reports', reportRoute);
app.use('/api/fuel-logs', fuelLogRoute);
app.use('/api/users', userRoute);
app.use('/api/reminders', reminderRoute);
app.use('/api/search', searchRoute);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  return res.status(404).json({ error: 'Route not found' });
});

// Global error-handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error]', err);
  return res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

export default app;
