import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const {
    limit = '100',
    offset = '0',
    action,
    entityType,
    userId,
  } = req.query as {
    limit?: string;
    offset?: string;
    action?: string;
    entityType?: string;
    userId?: string;
  };

  const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);

  const where = {
    ...(action && { action }),
    ...(entityType && { entityType }),
    ...(userId && { userId }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ success: true, data: { logs, total } });
});
