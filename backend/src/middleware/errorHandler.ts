import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDev = process.env.NODE_ENV === 'development';

  // Prisma hataları
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[])?.join(', ') ?? 'alan';
      res.status(409).json({
        success: false,
        error: `Bu ${fields} zaten kayıtlı`,
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Kayıt bulunamadı' });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, error: 'Geçersiz veri formatı' });
    return;
  }

  // Genel hata
  const status = 'status' in err ? (err as NodeJS.ErrnoException & { status?: number }).status ?? 500 : 500;

  res.status(status).json({
    success: false,
    error: err.message || 'Sunucu hatası',
    ...(isDev && { stack: err.stack }),
  });
};
