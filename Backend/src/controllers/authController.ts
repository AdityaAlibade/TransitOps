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

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Sign JWT
    const secret = process.env.JWT_SECRET || 'super-secret-transitops-key-change-in-production';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn: '24h' }
    );

    const { password_hash, ...userWithoutHash } = user;

    return res.status(200).json({
      data: {
        token,
        user: userWithoutHash
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

    const { password_hash, ...userWithoutHash } = user;

    return res.status(200).json({
      data: userWithoutHash
    });
  } catch (error) {
    next(error);
  }
};
