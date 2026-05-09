import { Request, Response } from 'express';
import { OrderStatus, NotificationType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPushToAll } from '../utils/pushNotification';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity, customerNote } = req.body as {
    productId: string;
    quantity: number;
    customerNote?: string;
  };
  const qty = parseInt(String(quantity), 10);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    res.status(404).json({ success: false, error: 'Ürün bulunamadı' });
    return;
  }

  const order = await prisma.order.create({
    data: { productId, userId: req.userId, quantity: qty, customerNote, status: OrderStatus.PENDING },
    include: {
      product: { select: { id: true, name: true, category: true, price: true } },
      user: { select: { id: true, name: true } },
    },
  });

  if (product.stock <= 1) {
    await prisma.notification.create({
      data: {
        title: 'Sipariş: Düşük Stok',
        message: `${product.name} siparişi alındı, stok kritik (${product.stock} adet)`,
        type: NotificationType.LOW_STOCK,
        productId,
      },
    });
  }

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
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });

  if (!order) {
    res.status(404).json({ success: false, error: 'Sipariş bulunamadı' });
    return;
  }
  if (order.status !== OrderStatus.PENDING) {
    res.status(400).json({ success: false, error: 'Sadece bekleyen siparişler tamamlanabilir' });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: order.productId } });
    if (!product) throw Object.assign(new Error('Ürün bulunamadı'), { status: 404 });
    if (product.stock < order.quantity) {
      throw Object.assign(
        new Error(`Yetersiz stok. Mevcut: ${product.stock} adet`),
        { status: 400 }
      );
    }

    const newStock = product.stock - order.quantity;

    await tx.product.update({ where: { id: order.productId }, data: { stock: newStock } });

    const [completedOrder, sale] = await Promise.all([
      tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
        include: {
          product: { select: { id: true, name: true, category: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      tx.sale.create({
        data: {
          productId: order.productId,
          userId: order.userId,
          quantity: order.quantity,
          unitPrice: product.price,
          totalPrice: Number(product.price) * order.quantity,
        },
      }),
    ]);

    if (newStock === 0) {
      await tx.notification.create({
        data: {
          title: 'Stok Tükendi',
          message: `${product.name} stok tükendi!`,
          type: NotificationType.OUT_OF_STOCK,
          productId: order.productId,
        },
      });
    } else if (newStock <= 1) {
      await tx.notification.create({
        data: {
          title: 'Düşük Stok',
          message: `${product.name} kritik stok seviyesinde (${newStock} adet)`,
          type: NotificationType.LOW_STOCK,
          productId: order.productId,
        },
      });
    }

    return { order: completedOrder, sale };
  });

  // ── Tüm ortaklara satış push bildirimi (sipariş tamamlandı) ─────────────
  const completedProduct = result.order.product;
  const totalStr = Number(result.sale.totalPrice).toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  });
  const cPushTitle = '✅ Sipariş Tamamlandı!';
  const cPushBody = `${completedProduct.name} — ${result.sale.quantity} adet\nToplam: ${totalStr}`;

  await prisma.notification.create({
    data: {
      title: cPushTitle,
      message: cPushBody,
      type: NotificationType.SALE,
      productId: completedProduct.id,
    },
  });

  await sendPushToAll(cPushTitle, cPushBody, { type: 'SALE', orderId: result.order.id });

  res.json({ success: true, data: result });
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

  res.json({ success: true, message: 'Sipariş iptal edildi' });
});
