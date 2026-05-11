import { Request, Response } from 'express';
import { NotificationType, OrderStatus } from '@prisma/client';
import { endOfMonth, format, parse } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import * as XLSX from 'xlsx';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPushToAll } from '../utils/pushNotification';
import { writeAuditLog } from '../utils/auditLog';

const TZ = 'Europe/Istanbul';

function parsePositiveQuantity(quantity: unknown): number {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    throw Object.assign(new Error('Adet pozitif bir tam sayı olmalı'), { status: 400 });
  }
  return qty;
}

function parseCustomerNote(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw Object.assign(new Error('Satış notu metin olmalı'), { status: 400 });
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 300) {
    throw Object.assign(new Error('Satış notu en fazla 300 karakter olmalı'), { status: 400 });
  }
  return trimmed;
}

function getMonthlyRange(period?: string) {
  const label = period && /^\d{4}-\d{2}$/.test(period)
    ? period
    : format(toZonedTime(new Date(), TZ), 'yyyy-MM');
  const monthStartLocal = parse(`${label}-01`, 'yyyy-MM-dd', new Date());
  const monthEndLocal = endOfMonth(monthStartLocal);

  return {
    label,
    start: fromZonedTime(monthStartLocal, TZ),
    end: fromZonedTime(monthEndLocal, TZ),
  };
}

export const createSale = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity, customerNote } = req.body as {
    productId: string;
    quantity: number;
    customerNote?: string;
  };
  const qty = parsePositiveQuantity(quantity);
  const note = parseCustomerNote(customerNote);

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
        customerNote: note,
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
    const noteText = sale.customerNote ? `\nKime/Not: ${sale.customerNote}` : '';
    const pushBody = `${sale.product.name} — ${sale.quantity} adet\nToplam: ${totalStr}\nSatan: ${sellerName}${noteText}`;

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

    await writeAuditLog({
      req,
      action: 'SALE_CREATE',
      entityType: 'Sale',
      entityId: sale.id,
      metadata: {
        productId: sale.product.id,
        productName: sale.product.name,
        quantity: sale.quantity,
        totalPrice: Number(sale.totalPrice),
        customerNote: sale.customerNote,
      },
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

export const exportMonthlySales = asyncHandler(async (req: Request, res: Response) => {
  const { period, encoding } = req.query as { period?: string; encoding?: string };
  const { label, start, end } = getMonthlyRange(period);

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      product: { select: { name: true, category: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const rows = sales.map((sale) => ({
    Tarih: toZonedTime(sale.createdAt, TZ).toLocaleString('tr-TR'),
    Urun: sale.product.name,
    Kategori: sale.product.category === 'WOMEN' ? 'Kadın' : 'Erkek',
    Adet: sale.quantity,
    Birim_Fiyat_TL: Number(sale.unitPrice),
    Toplam_TL: Number(sale.totalPrice),
    Kime_Not: sale.customerNote ?? '',
    Satan: sale.user?.name ?? '',
  }));

  const summaryRows = [
    { Alan: 'Dönem', Deger: label },
    { Alan: 'Satış Kaydı', Deger: sales.length },
    { Alan: 'Toplam Adet', Deger: sales.reduce((sum, sale) => sum + sale.quantity, 0) },
    { Alan: 'Toplam Ciro TL', Deger: sales.reduce((sum, sale) => sum + Number(sale.totalPrice), 0) },
  ];

  const workbook = XLSX.utils.book_new();
  const salesSheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{
    Tarih: '',
    Urun: '',
    Kategori: '',
    Adet: '',
    Birim_Fiyat_TL: '',
    Toplam_TL: '',
    Kime_Not: '',
    Satan: '',
  }]);
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

  salesSheet['!cols'] = [
    { wch: 20 },
    { wch: 28 },
    { wch: 12 },
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 },
    { wch: 18 },
  ];
  summarySheet['!cols'] = [{ wch: 18 }, { wch: 18 }];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ozet');
  XLSX.utils.book_append_sheet(workbook, salesSheet, 'Satislar');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const filename = `veor-satislar-${label}.xlsx`;

  if (encoding === 'base64') {
    res.json({
      success: true,
      data: {
        filename,
        period: label,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: buffer.toString('base64'),
        total: sales.length,
      },
    });
    return;
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});
