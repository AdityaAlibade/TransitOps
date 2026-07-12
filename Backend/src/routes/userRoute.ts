import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  toggleUserStatus,
  toggleAdminMode,
  updatePermissions,
  getActivityLogs,
  getAvailablePermissions
} from '../controllers/userController';
import { authenticate, authorizePermissions, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Secure all user management endpoints with authentication
router.use(authenticate);

// Listing permissions is read-only information for managers/admins
router.get('/available-permissions', getAvailablePermissions);

// Only admins can toggle Admin Mode delegation for Fleet Managers
router.post('/:id/toggle-admin-mode', authorizeRoles('Admin'), toggleAdminMode);

// User operations requiring specific permissions
router.get('/', authorizePermissions('users:read'), getUsers);
router.post('/', authorizePermissions('users:write'), createUser);
router.put('/:id', authorizePermissions('users:write'), updateUser);
router.delete('/:id', authorizePermissions('users:write'), deleteUser);
router.post('/:id/reset-password', authorizePermissions('users:write'), resetPassword);
router.post('/:id/toggle-status', authorizePermissions('users:write'), toggleUserStatus);
router.post('/:id/permissions', authorizePermissions('users:write'), updatePermissions);
router.get('/activity-logs', authorizePermissions('activity_logs:read'), getActivityLogs);

export default router;
