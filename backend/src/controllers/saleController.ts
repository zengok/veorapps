import { Request, Response } from 'express';
import { NotificationType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';

export const createSale = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity } = req.body as { productId: string; quantity: number };
  const qty = parseInt(String(quantity), 10);

  const saleId = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });

    if (!product || !product.isActive) {
      throw Object.assign(new Error('Ürün bulunamadı'), { status: 404 });
    }
    if (product.stock < qty) {
      throw Object.assign(
        new Error(`Yetersiz stok. Mevcut: ${product.stock} adet`),
        { status: 400 }
      );
    }

    const newStock = product.stock - qty;

    const [, sale] = await Promise.all([
      tx.product.update({ where: { id: productId }, data: { stock: newStock } }),
      tx.sale.create({
        data: {
          productId,
          userId: req.userId,
          quantity: qty,
          unitPrice: product.price,
          totalPrice: Number(product.price) * qty,
        },
      }),
    ]);

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
