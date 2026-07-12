import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { registerSchema, loginSchema } from '../validators';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const { name, email, password, role } = parseResult.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        role
      }
    });

    // Omit password hash
    const { password_hash, ...userWithoutHash } = user;

    return res.status(201).json({
      data: userWithoutHash
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: parseResult.error.errors.map(err => err.message).join(', ')
      });
    }

    const { email, password } = parseResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Account has been deactivated. Contact administration.'
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Load dynamic permissions
    const roleWithPermissions = await prisma.role.findFirst({
      where: { name: user.role },
      include: {
        rolePermissions: {
          include: { permission: true }
        }
      }
    });

    const standardPermissions = roleWithPermissions
      ? roleWithPermissions.rolePermissions.map(rp => rp.permission.name)
      : [];

    const overrides = await prisma.userPermission.findMany({
      where: { user_id: user.id },
      include: { permission: true }
    });

    const grantedOverrides = new Set(
      overrides.filter(o => o.value === true).map(o => o.permission.name)
    );
    const revokedOverrides = new Set(
      overrides.filter(o => o.value === false).map(o => o.permission.name)
    );

    const permissions = new Set(standardPermissions);
    
    // Add dynamic permissions for Fleet Managers in Admin Mode
    if (user.role === 'Fleet_Manager' && user.admin_mode_enabled) {
      permissions.add('users:read');
      permissions.add('users:write');
      permissions.add('activity_logs:read');
    }

    grantedOverrides.forEach(p => permissions.add(p));
    revokedOverrides.forEach(p => permissions.delete(p));

    const finalPermissions = Array.from(permissions);

    // Track login activity
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        action: 'User Login',
        details: `Successfully authenticated as ${user.role}.`
      }
    });

    // Sign JWT
    const secret = process.env.JWT_SECRET || 'super-secret-transitops-key-change-in-production';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: finalPermissions,
        adminMode: user.admin_mode_enabled
      },
      secret,
      { expiresIn: '24h' }
    );

    const { password_hash, ...userWithoutHash } = user;

    return res.status(200).json({
      data: {
        token,
        user: {
          ...userWithoutHash,
          permissions: finalPermissions,
          adminMode: user.admin_mode_enabled
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Account has been deactivated.'
      });
    }

    // Retrieve dynamically compiled permissions list
    const roleWithPermissions = await prisma.role.findFirst({
      where: { name: user.role },
      include: {
        rolePermissions: {
          include: { permission: true }
        }
      }
    });

    const standardPermissions = roleWithPermissions
      ? roleWithPermissions.rolePermissions.map(rp => rp.permission.name)
      : [];

    const overrides = await prisma.userPermission.findMany({
      where: { user_id: user.id },
      include: { permission: true }
    });

    const grantedOverrides = new Set(
      overrides.filter(o => o.value === true).map(o => o.permission.name)
    );
    const revokedOverrides = new Set(
      overrides.filter(o => o.value === false).map(o => o.permission.name)
    );

    const permissions = new Set(standardPermissions);
    
    // Add dynamic permissions for Fleet Managers in Admin Mode
    if (user.role === 'Fleet_Manager' && user.admin_mode_enabled) {
      permissions.add('users:read');
      permissions.add('users:write');
      permissions.add('activity_logs:read');
    }

    grantedOverrides.forEach(p => permissions.add(p));
    revokedOverrides.forEach(p => permissions.delete(p));

    const finalPermissions = Array.from(permissions);

    const { password_hash, ...userWithoutHash } = user;

    return res.status(200).json({
      data: {
        ...userWithoutHash,
        permissions: finalPermissions,
        adminMode: user.admin_mode_enabled
      }
    });
  } catch (error) {
    next(error);
  }
};
