import { Request, Response } from 'express';
import { subDays } from 'date-fns';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';

export const getNotifications = asyncHandler(async (_req: Request, res: Response) => {
  const sevenDaysAgo = subDays(new Date(), 7);

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [{ isRead: false }, { createdAt: { gte: sevenDaysAgo } }],
    },
    include: { product: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({ success: true, data: notifications });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });

  if (!notification) {
    res.status(404).json({ success: false, error: 'Bildirim bulunamadı' });
    return;
  }

  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });

  res.json({ success: true, data: updated });
});

export const markAllAsRead = asyncHandler(async (_req: Request, res: Response) => {
  const { count } = await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });

  res.json({ success: true, message: `${count} bildirim okundu olarak işaretlendi` });
});
