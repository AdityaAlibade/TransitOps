import express from 'express';
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

export default app;
