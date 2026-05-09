import { Request, Response } from 'express';
import { Category } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';

interface ExcelRow {
  name?: string;
  ad?: string;
  isim?: string;
  urun?: string;
  'ürün'?: string;
  price?: number | string;
  fiyat?: number | string;
  stock?: number | string;
  stok?: number | string;
  adet?: number | string;
  category?: string;
  kategori?: string;
}

function normalizeRow(raw: Record<string, unknown>): ExcelRow {
  const lower: Record<string, unknown> = {};
  for (const key of Object.keys(raw)) {
    lower[key.toLowerCase().trim()] = raw[key];
  }
  return lower as ExcelRow;
}

function extractName(row: ExcelRow): string | null {
  return (
    (row.name as string) ||
    (row.ad as string) ||
    (row.isim as string) ||
    (row.urun as string) ||
    (row['ürün'] as string) ||
    null
  );
}

function extractPrice(row: ExcelRow): number {
  const raw = row.price ?? row.fiyat;
  const n = parseFloat(String(raw).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function extractStock(row: ExcelRow): number {
  const raw = row.stock ?? row.stok ?? row.adet;
  const n = parseInt(String(raw), 10);
  return isNaN(n) ? 0 : n;
}

function extractCategory(row: ExcelRow, sheetCategory?: Category): Category {
  const raw = ((row.category ?? row.kategori) as string | undefined)?.toLowerCase()?.trim();
  if (raw) {
    if (raw.includes('kad') || raw === 'women' || raw === 'w') return 'WOMEN';
    if (raw.includes('erk') || raw === 'men' || raw === 'm') return 'MEN';
  }
  return sheetCategory ?? 'WOMEN';
}

/**
 * POST /api/import/excel
 * Body: { rows: [{ name, price, stock, category }], sheetCategory?: 'WOMEN'|'MEN' }
 *
 * Mobil uygulama XLSX dosyasını parse ederek satırları JSON olarak gönderir.
 * Her satır için: eğer aynı isimde (case-insensitive) ürün varsa stok/fiyat güncellenir,
 * yoksa yeni ürün oluşturulur.
 */
export const importFromExcel = asyncHandler(async (req: Request, res: Response) => {
  const { rows, sheetCategory } = req.body as {
    rows: Record<string, unknown>[];
    sheetCategory?: Category;
  };

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ success: false, error: 'rows dizisi boş veya eksik' });
    return;
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const rawRow of rows) {
    try {
      const row = normalizeRow(rawRow);
      const name = extractName(row);
      if (!name || name.trim() === '') continue;

      const price = extractPrice(row);
      const stock = extractStock(row);
      const category = extractCategory(row, sheetCategory);

      // Aynı isimde aktif ürün var mı?
      const existing = await prisma.product.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          isActive: true,
        },
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            stock,
            ...(price > 0 && { price }),
            category,
          },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            name: name.trim(),
            category,
            price: price > 0 ? price : 0,
            stock,
          },
        });
        created++;
      }
    } catch (err) {
      errors.push(String(err));
    }
  }

  res.json({
    success: true,
    data: {
      created,
      updated,
      total: created + updated,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    },
    message: `${created} yeni ürün oluşturuldu, ${updated} ürün güncellendi.`,
  });
});
