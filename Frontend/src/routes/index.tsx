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
import { ForgotPassword } from '../pages/Login/ForgotPassword';
import { ProtectedRoute } from '../components/ProtectedRoute/ProtectedRoute';
import { AccessDenied } from '../pages/AccessDenied/AccessDenied';
import { UserManagement } from '../pages/UserManagement/UserManagement';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    element: <ProtectedRoute />,
    children: [
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
          },
          {
            path: 'users',
            element: <UserManagement />
          },
          {
            path: '403',
            element: <AccessDenied />
          }
        ]
      }
    ]
  }
]);
