import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        userPermissions: {
          include: { permission: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const sanitizedUsers = users.map(u => {
      const { password_hash, ...rest } = u;
      return rest;
    });

    return res.status(200).json({ data: sanitizedUsers });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing required fields' });
    }

    // Role safety checks for Fleet Manager
    if (req.user?.role === 'Fleet_Manager' && role === 'Admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Fleet Managers cannot create Admin users' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const dbRole = await prisma.role.findUnique({ where: { name: role } });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        role,
        role_id: dbRole ? dbRole.id : null
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.userId,
        action: 'Create User',
        details: `Created user ${email} with role ${role}.`
      }
    });

    const { password_hash, ...userWithoutHash } = user;
    return res.status(201).json({ data: userWithoutHash });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid User ID' });
    }

    const { name, email, role } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    // Check if target is Admin and caller is Fleet Manager
    if (req.user?.role === 'Fleet_Manager') {
      if (targetUser.role === 'Admin' || role === 'Admin') {
        return res.status(403).json({ error: 'Forbidden', message: 'Fleet Managers cannot modify Admin users or set role to Admin' });
      }
    }

    const dbRole = await prisma.role.findUnique({ where: { name: role } });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        role_id: dbRole ? dbRole.id : targetUser.role_id
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.userId,
        action: 'Update User',
        details: `Updated details for user ${targetUser.email}. New Role: ${role}.`
      }
    });

    const { password_hash, ...userWithoutHash } = updatedUser;
    return res.status(200).json({ data: userWithoutHash });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid User ID' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    // Check if target is Admin and caller is Fleet Manager
    if (req.user?.role === 'Fleet_Manager' && targetUser.role === 'Admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Fleet Managers cannot delete Admin users' });
    }

    // Prevent self-deletion
    if (req.user?.userId === id) {
      return res.status(400).json({ error: 'Bad Request', message: 'Cannot delete your own active session account' });
    }

    await prisma.user.delete({ where: { id } });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.userId,
        action: 'Delete User',
        details: `Deleted user ${targetUser.email} (Role: ${targetUser.role}).`
      }
    });

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid User ID' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Bad Request', message: 'Password is required' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    // Check if target is Admin and caller is Fleet Manager
    if (req.user?.role === 'Fleet_Manager' && targetUser.role === 'Admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Fleet Managers cannot reset Admin passwords' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id },
      data: { password_hash: hashedPassword }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.userId,
        action: 'Reset Password',
        details: `Reset password for user ${targetUser.email}.`
      }
    });

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid User ID' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    // Check if target is Admin and caller is Fleet Manager
    if (req.user?.role === 'Fleet_Manager' && targetUser.role === 'Admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Fleet Managers cannot deactivate Admin users' });
    }

    // Prevent deactivating own account
    if (req.user?.userId === id && targetUser.is_active) {
      return res.status(400).json({ error: 'Bad Request', message: 'Cannot deactivate your own active session account' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { is_active: !targetUser.is_active }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.userId,
        action: updated.is_active ? 'Activate User' : 'Deactivate User',
        details: `${updated.is_active ? 'Activated' : 'Deactivated'} account of user ${targetUser.email}.`
      }
    });

    return res.status(200).json({ data: { is_active: updated.is_active } });
  } catch (error) {
    next(error);
  }
};

export const toggleAdminMode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid User ID' });
    }

    if (req.user!.role !== 'Admin' && req.user!.userId !== id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to toggle Admin Mode for this account' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    if (targetUser.role !== 'Fleet_Manager') {
      return res.status(400).json({ error: 'Bad Request', message: 'Admin Mode is only applicable for Fleet Managers' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { admin_mode_enabled: !targetUser.admin_mode_enabled }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.userId,
        action: updated.admin_mode_enabled ? 'Enable Admin Mode' : 'Disable Admin Mode',
        details: `${updated.admin_mode_enabled ? 'Enabled' : 'Disabled'} Admin Mode delegation for ${targetUser.email}.`
      }
    });

    return res.status(200).json({ data: { admin_mode_enabled: updated.admin_mode_enabled } });
  } catch (error) {
    next(error);
  }
};

export const updatePermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid User ID' });
    }

    const { name, value } = req.body; // e.g. name = "vehicles:write", value = true (grant) / false (revoke)
    if (!name || value === undefined) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing permission name or value' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    // Check if target is Admin and caller is Fleet Manager
    if (req.user?.role === 'Fleet_Manager' && targetUser.role === 'Admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Fleet Managers cannot alter Admin permissions' });
    }

    // Find permission ID
    const permission = await prisma.permission.findUnique({ where: { name } });
    if (!permission) {
      return res.status(404).json({ error: 'Not Found', message: `Permission ${name} does not exist` });
    }

    // Update or insert override
    await prisma.userPermission.upsert({
      where: {
        user_id_permission_id: {
          user_id: id,
          permission_id: permission.id
        }
      },
      update: { value },
      create: {
        user_id: id,
        permission_id: permission.id,
        value
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.userId,
        action: 'Update Overrides',
        details: `${value ? 'Granted' : 'Revoked'} permission override '${name}' for ${targetUser.email}.`
      }
    });

    return res.status(200).json({ message: 'Permissions updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 100
    });

    // Load related user information dynamically
    const userIds = Array.from(new Set(logs.map(l => l.user_id)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const formattedLogs = logs.map(l => ({
      ...l,
      user: userMap.get(l.user_id) || { name: 'System', email: 'system@transitops.com', role: 'System' }
    }));

    return res.status(200).json({ data: formattedLogs });
  } catch (error) {
    next(error);
  }
};

export const getAvailablePermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });
    return res.status(200).json({ data: permissions });
  } catch (error) {
    next(error);
  }
};
