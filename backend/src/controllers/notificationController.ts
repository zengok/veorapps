import { Request, Response } from 'express';
import { subDays } from 'date-fns';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { writeAuditLog } from '../utils/auditLog';

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

  await writeAuditLog({
    req,
    action: 'NOTIFICATION_MARK_READ',
    entityType: 'Notification',
    entityId: updated.id,
    metadata: { type: updated.type, title: updated.title },
  });

  res.json({ success: true, data: updated });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { count } = await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });

  await writeAuditLog({
    req,
    action: 'NOTIFICATION_MARK_ALL_READ',
    entityType: 'Notification',
    metadata: { count },
  });

  res.json({ success: true, message: `${count} bildirim okundu olarak işaretlendi` });
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });

  if (!notification) {
    res.status(404).json({ success: false, error: 'Bildirim bulunamadı' });
    return;
  }

  if (!notification.isRead) {
    res.status(400).json({ success: false, error: 'Bildirim silinmeden önce okundu olarak işaretlenmeli' });
    return;
  }

  await prisma.notification.delete({ where: { id: req.params.id } });

  await writeAuditLog({
    req,
    action: 'NOTIFICATION_DELETE',
    entityType: 'Notification',
    entityId: notification.id,
    metadata: { type: notification.type, title: notification.title },
  });

  res.json({ success: true, message: 'Bildirim silindi' });
});
