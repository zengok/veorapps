import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../utils/prisma';

// Express Request tipini genişlet
declare global {
  namespace Express {
    interface Request {
      userId: string;
      userEmail: string;
      userRole?: UserRole;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  role?: UserRole;
}

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token bulunamadı' });
    return;
  }

  const token = header.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET tanımlı değil');

    const payload = jwt.verify(token, secret) as JwtPayload;
    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Geçersiz veya süresi dolmuş token' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Bu işlem için yönetici yetkisi gerekli' });
      return;
    }

    req.userRole = user.role;
    next();
  } catch {
    res.status(500).json({ success: false, error: 'Yetki kontrolü yapılamadı' });
  }
};
