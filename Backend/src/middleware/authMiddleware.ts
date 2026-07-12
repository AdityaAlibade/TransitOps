import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

export interface UserPayload {
  userId: number;
  email: string;
  role: string;
  permissions: string[];
  adminMode: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is missing or invalid'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'super-secret-transitops-key-change-in-production';
    const decoded = jwt.verify(token, secret) as UserPayload;

    // Check database to ensure user still exists and is active
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!dbUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User account not found'
      });
    }

    if (!dbUser.is_active) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Your account has been deactivated'
      });
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token verification failed: ' + (error.message || 'invalid token')
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Maintain authorize for backward compatibility
export const authorize = authorizeRoles;

export const authorizePermissions = (...requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { userId, role, adminMode } = req.user;

    // Admin has full access to all endpoints
    if (role === 'Admin') {
      return next();
    }

    // Retrieve database overrides for user permissions
    const overrides = await prisma.userPermission.findMany({
      where: { user_id: userId },
      include: { permission: true }
    });

    const grantedOverrides = new Set(
      overrides.filter(o => o.value === true).map(o => o.permission.name)
    );
    const revokedOverrides = new Set(
      overrides.filter(o => o.value === false).map(o => o.permission.name)
    );

    // Compile dynamic permissions
    const userPermissions = new Set(req.user.permissions || []);

    // Grant User Management and Activity Logs permissions to Fleet Manager in Admin Mode
    if (role === 'Fleet_Manager' && adminMode) {
      userPermissions.add('users:read');
      userPermissions.add('users:write');
      userPermissions.add('activity_logs:read');
    }

    // Apply specific overrides
    grantedOverrides.forEach(p => userPermissions.add(p));
    revokedOverrides.forEach(p => userPermissions.delete(p));

    const hasAll = requiredPermissions.every(p => userPermissions.has(p));

    if (!hasAll) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};
