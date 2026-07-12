import { createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout/DashboardLayout';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { Vehicles } from '../pages/Vehicles/Vehicles';
import { Drivers } from '../pages/Drivers/Drivers';
import { Trips } from '../pages/Trips/Trips';
import { Maintenance } from '../pages/Maintenance/Maintenance';
import { Expenses } from '../pages/Expenses/Expenses';
import { Reports } from '../pages/Reports/Reports';
import { Login } from '../pages/Login/Login';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'vehicles',
        element: <Vehicles />
      },
      {
        path: 'drivers',
        element: <Drivers />
      },
      {
        path: 'trips',
        element: <Trips />
      },
      {
        path: 'maintenance',
        element: <Maintenance />
      },
      {
        path: 'expenses',
        element: <Expenses />
      },
      {
        path: 'reports',
        element: <Reports />
      }
    ]
  }
]);
