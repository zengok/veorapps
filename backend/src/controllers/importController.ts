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

function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(raw)) {
    // Tüm boşlukları sil, küçük harfe çevir
    const cleanKey = key.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
    normalized[cleanKey] = raw[key];
  }
  return normalized;
}

function extractName(row: Record<string, unknown>): string | null {
  const keys = Object.keys(row);
  const nameKey = keys.find(k => 
    k.includes('ad') || k.includes('isim') || k.includes('ürün') || k.includes('urun') || k.includes('name') || k.includes('parfüm') || k.includes('parfum')
  );
  if (nameKey && row[nameKey]) return String(row[nameKey]);
  return null;
}

function extractPrice(row: Record<string, unknown>): number {
  const keys = Object.keys(row);
  const priceKey = keys.find(k => k.includes('fiyat') || k.includes('price') || k.includes('tutar') || k.includes('bedel'));
  if (priceKey && row[priceKey] !== undefined) {
    const raw = String(row[priceKey]).replace(',', '.');
    const n = parseFloat(raw);
    if (!isNaN(n)) return n;
  }
  return 0;
}

function extractStock(row: Record<string, unknown>): number {
  const keys = Object.keys(row);
  const stockKey = keys.find(k => k.includes('stok') || k.includes('stock') || k.includes('adet') || k.includes('miktar') || k.includes('kalan'));
  if (stockKey && row[stockKey] !== undefined) {
    const n = parseInt(String(row[stockKey]), 10);
    if (!isNaN(n)) return n;
  }
  return 0;
}

function extractCategory(row: Record<string, unknown>, sheetCategory?: Category): Category {
  const keys = Object.keys(row);
  const catKey = keys.find(k => k.includes('kategori') || k.includes('category') || k.includes('cinsiyet') || k.includes('tür') || k.includes('tur'));
  if (catKey && row[catKey]) {
    const raw = String(row[catKey]).toLowerCase().trim();
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
  let skipped = 0;
  const errors: string[] = [];

  for (const rawRow of rows) {
    try {
      const row = normalizeRow(rawRow);
      const name = extractName(row);
      if (!name || name.trim() === '') {
        skipped++;
        continue;
      }

      const price = extractPrice(row);
      const stock = extractStock(row);
      const category = extractCategory(row, sheetCategory);

      // Aynı isim ve kategoride aktif ürün var mı?
      const existing = await prisma.product.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          category,
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
      skipped,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    },
    message: `${created} yeni ürün oluşturuldu, ${updated} ürün güncellendi, ${skipped} satır atlandı.`,
  });
});
