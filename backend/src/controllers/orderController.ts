import { Request, Response } from 'express';
import { OrderStatus, NotificationType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPushToAll } from '../utils/pushNotification';
import { writeAuditLog } from '../utils/auditLog';

function parsePositiveQuantity(quantity: unknown): number {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    throw Object.assign(new Error('Adet pozitif bir tam sayı olmalı'), { status: 400 });
  }
  return qty;
}

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity, customerNote } = req.body as {
    productId: string;
    quantity: number;
    customerNote?: string;
  };
  const qty = parsePositiveQuantity(quantity);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    throw Object.assign(new Error('Ürün bulunamadı'), { status: 404 });
  }

  const order = await prisma.order.create({
    data: { productId, userId: req.userId, quantity: qty, customerNote, status: OrderStatus.PENDING },
    include: {
      product: { select: { id: true, name: true, category: true, price: true } },
      user: { select: { id: true, name: true } },
    },
  });

  // ── Tüm ortaklara sipariş push bildirimi ────────────────────────────────
  const pushTitle = '📦 Yeni Sipariş!';
  const noteText = order.customerNote ? `\nNot: ${order.customerNote}` : '';
  const catText = product.category === 'WOMEN' ? 'Kadın' : 'Erkek';
  const pushBody = `${order.product.name} (${catText}) — ${order.quantity} adet${noteText}`;

  await prisma.notification.create({
    data: {
      title: pushTitle,
      message: pushBody,
      type: NotificationType.ORDER,
      productId,
    },
  });

  await sendPushToAll(pushTitle, pushBody, { type: 'ORDER', orderId: order.id });

  await writeAuditLog({
    req,
    action: 'ORDER_CREATE',
    entityType: 'Order',
    entityId: order.id,
    metadata: {
      productId,
      productName: order.product.name,
      quantity: order.quantity,
      customerNote: order.customerNote,
    },
  });

  res.status(201).json({ success: true, data: order });
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query as { status?: OrderStatus };

  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    include: {
      product: { select: { id: true, name: true, category: true, price: true } },
      user: { select: { id: true, name: true } },
    },
    // PENDING(P) > COMPLETED(C) alfabetik → desc ile PENDING önce gelir
    orderBy: [{ status: 'desc' }, { createdAt: 'desc' }],
  });

  res.json({ success: true, data: orders });
});

export const completeOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      product: { select: { id: true, name: true, category: true } },
      user: { select: { id: true, name: true } },
    },
  });

  if (!order) {
    res.status(404).json({ success: false, error: 'Sipariş bulunamadı' });
    return;
  }
  if (order.status !== OrderStatus.PENDING) {
    res.status(400).json({ success: false, error: 'Sadece bekleyen siparişler hazır işaretlenebilir' });
    return;
  }

  await prisma.order.delete({ where: { id: order.id } });

  await writeAuditLog({
    req,
    action: 'ORDER_READY_DELETE',
    entityType: 'Order',
    entityId: order.id,
    metadata: {
      productId: order.productId,
      productName: order.product.name,
      quantity: order.quantity,
      customerNote: order.customerNote,
    },
  });

  res.json({ success: true, data: { order }, message: 'Sipariş hazırlandı ve listeden kaldırıldı' });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });

  if (!order) {
    res.status(404).json({ success: false, error: 'Sipariş bulunamadı' });
    return;
  }
  if (order.status !== OrderStatus.PENDING) {
    res.status(400).json({ success: false, error: 'Sadece bekleyen siparişler iptal edilebilir' });
    return;
  }

  await prisma.order.delete({ where: { id: order.id } });

  await writeAuditLog({
    req,
    action: 'ORDER_CANCEL',
    entityType: 'Order',
    entityId: order.id,
    metadata: {
      productId: order.productId,
      quantity: order.quantity,
      customerNote: order.customerNote,
    },
  });

  res.json({ success: true, message: 'Sipariş iptal edildi' });
});
