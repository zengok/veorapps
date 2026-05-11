import { Request, Response } from 'express';
import { NotificationType, OrderStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPushToAll } from '../utils/pushNotification';

function parsePositiveQuantity(quantity: unknown): number {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    throw Object.assign(new Error('Adet pozitif bir tam sayı olmalı'), { status: 400 });
  }
  return qty;
}

export const createSale = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity } = req.body as { productId: string; quantity: number };
  const qty = parsePositiveQuantity(quantity);

  const saleId = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });

    if (!product || !product.isActive) {
      throw Object.assign(new Error('Ürün bulunamadı'), { status: 404 });
    }

    const pendingOrders = await tx.order.aggregate({
      _sum: { quantity: true },
      where: { productId, status: OrderStatus.PENDING },
    });
    const reservedStock = pendingOrders._sum.quantity ?? 0;
    const availableStock = product.stock - reservedStock;

    if (availableStock < qty) {
      throw Object.assign(
        new Error(`Yetersiz kullanılabilir stok. Kullanılabilir: ${Math.max(availableStock, 0)} adet`),
        { status: 400 }
      );
    }

    const stockUpdate = await tx.product.updateMany({
      where: { id: productId, isActive: true, stock: { gte: qty } },
      data: { stock: { decrement: qty } },
    });

    if (stockUpdate.count === 0) {
      const latest = await tx.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });
      throw Object.assign(
        new Error(`Yetersiz stok. Mevcut: ${latest?.stock ?? product.stock} adet`),
        { status: 400 }
      );
    }

    const updatedProduct = await tx.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    const newStock = updatedProduct?.stock ?? product.stock - qty;

    const sale = await tx.sale.create({
      data: {
        productId,
        userId: req.userId,
        quantity: qty,
        unitPrice: product.price,
        totalPrice: Number(product.price) * qty,
      },
    });

    if (newStock === 0) {
      await tx.notification.create({
        data: {
          title: 'Stok Tükendi',
          message: `${product.name} stok tükendi!`,
          type: NotificationType.OUT_OF_STOCK,
          productId,
        },
      });
    } else if (newStock <= 1) {
      await tx.notification.create({
        data: {
          title: 'Düşük Stok',
          message: `${product.name} kritik stok seviyesinde (${newStock} adet)`,
          type: NotificationType.LOW_STOCK,
          productId,
        },
      });
    }

    return sale.id;
  });

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      product: { select: { id: true, name: true, category: true } },
      user: { select: { id: true, name: true } },
    },
  });

  // ── Tüm ortaklara push bildirimi gönder ─────────────────────────────────
  if (sale) {
    const totalStr = Number(sale.totalPrice).toLocaleString('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 2,
    });
    const sellerName = sale.user?.name ?? 'Bilinmeyen';
    const pushTitle = '💰 Satış Yapıldı!';
    const pushBody = `${sale.product.name} — ${sale.quantity} adet\nToplam: ${totalStr}\nSatan: ${sellerName}`;

    // DB kaydı (uygulama içi bildirim listesi için)
    await prisma.notification.create({
      data: {
        title: pushTitle,
        message: pushBody,
        type: NotificationType.SALE,
        productId: sale.product.id,
      },
    });

    // Anlık push (tüm telefonlar)
    await sendPushToAll(pushTitle, pushBody, {
      type: 'SALE',
      saleId: sale.id,
    });
  }

  res.status(201).json({ success: true, data: sale });
});

export const getSales = asyncHandler(async (req: Request, res: Response) => {
  const {
    limit = '50',
    offset = '0',
    startDate,
    endDate,
  } = req.query as { limit?: string; offset?: string; startDate?: string; endDate?: string };

  const where = {
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, category: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
    }),
    prisma.sale.count({ where }),
  ]);

  res.json({ success: true, data: { sales, total } });
});
