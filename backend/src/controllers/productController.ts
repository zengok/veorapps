import { Request, Response } from 'express';
import { Category } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadImage, deleteImage } from '../utils/cloudinary';
import { writeAuditLog } from '../utils/auditLog';

function parseProductName(value: unknown, required: boolean): string | undefined {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw Object.assign(new Error('Ürün adı zorunludur'), { status: 400 });
  }
  return value.trim();
}

function parseCategory(value: unknown, required: boolean): Category | undefined {
  if (value === undefined && !required) return undefined;
  if (value !== Category.WOMEN && value !== Category.MEN) {
    throw Object.assign(new Error('Geçerli bir kategori seçiniz'), { status: 400 });
  }
  return value;
}

function parsePrice(value: unknown, required: boolean): number | undefined {
  if (value === undefined && !required) return undefined;
  const price = Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(price) || price <= 0) {
    throw Object.assign(new Error('Geçerli bir fiyat giriniz'), { status: 400 });
  }
  return price;
}

function parseStock(value: unknown, required: boolean): number | undefined {
  if (value === undefined && !required) return undefined;
  const stock = Number(value);
  if (!Number.isInteger(stock) || stock < 0) {
    throw Object.assign(new Error('Geçerli bir stok miktarı giriniz'), { status: 400 });
  }
  return stock;
}

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query as { category?: string };
  if (category && category !== 'ALL' && category !== Category.WOMEN && category !== Category.MEN) {
    res.status(400).json({ success: false, error: 'Geçerli bir kategori seçiniz' });
    return;
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category && category !== 'ALL' && { category: category as Category }),
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: products });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });

  if (!product || !product.isActive) {
    res.status(404).json({ success: false, error: 'Ürün bulunamadı' });
    return;
  }

  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, category, price, stock } = req.body as {
    name: string;
    category: Category;
    price: string;
    stock: string;
  };
  const parsedName = parseProductName(name, true)!;
  const parsedCategory = parseCategory(category, true)!;
  const parsedPrice = parsePrice(price, true)!;
  const parsedStock = parseStock(stock, true)!;

  let imageUrl: string | undefined;
  let cloudinaryPublicId: string | undefined;

  if (req.file) {
    const uploaded = await uploadImage(req.file.buffer);
    imageUrl = uploaded.url;
    cloudinaryPublicId = uploaded.publicId;
  }

  const product = await prisma.product.create({
    data: {
      name: parsedName,
      category: parsedCategory,
      price: parsedPrice,
      stock: parsedStock,
      imageUrl,
      cloudinaryPublicId,
    },
  });

  await writeAuditLog({
    req,
    action: 'PRODUCT_CREATE',
    entityType: 'Product',
    entityId: product.id,
    metadata: {
      name: product.name,
      category: product.category,
      price: Number(product.price),
      stock: product.stock,
    },
  });

  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });

  if (!existing || !existing.isActive) {
    res.status(404).json({ success: false, error: 'Ürün bulunamadı' });
    return;
  }

  const { name, category, price, stock, removeImage } = req.body as {
    name?: string;
    category?: Category;
    price?: string;
    stock?: string;
    removeImage?: string;
  };
  const parsedName = parseProductName(name, false);
  const parsedCategory = parseCategory(category, false);
  const parsedPrice = parsePrice(price, false);
  const parsedStock = parseStock(stock, false);

  let imageUrl: string | null = existing.imageUrl;
  let cloudinaryPublicId: string | null = existing.cloudinaryPublicId;

  if (req.file) {
    if (existing.cloudinaryPublicId) await deleteImage(existing.cloudinaryPublicId);
    const uploaded = await uploadImage(req.file.buffer);
    imageUrl = uploaded.url;
    cloudinaryPublicId = uploaded.publicId;
  } else if (removeImage === 'true') {
    if (existing.cloudinaryPublicId) await deleteImage(existing.cloudinaryPublicId);
    imageUrl = null;
    cloudinaryPublicId = null;
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...(parsedName !== undefined && { name: parsedName }),
      ...(parsedCategory !== undefined && { category: parsedCategory }),
      ...(parsedPrice !== undefined && { price: parsedPrice }),
      ...(parsedStock !== undefined && { stock: parsedStock }),
      imageUrl,
      cloudinaryPublicId,
    },
  });

  await writeAuditLog({
    req,
    action: 'PRODUCT_UPDATE',
    entityType: 'Product',
    entityId: product.id,
    metadata: {
      before: {
        name: existing.name,
        category: existing.category,
        price: Number(existing.price),
        stock: existing.stock,
        imageUrl: existing.imageUrl,
      },
      after: {
        name: product.name,
        category: product.category,
        price: Number(product.price),
        stock: product.stock,
        imageUrl: product.imageUrl,
      },
    },
  });

  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });

  if (!existing || !existing.isActive) {
    res.status(404).json({ success: false, error: 'Ürün bulunamadı' });
    return;
  }

  await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  await writeAuditLog({
    req,
    action: 'PRODUCT_DELETE',
    entityType: 'Product',
    entityId: existing.id,
    metadata: {
      name: existing.name,
      category: existing.category,
      price: Number(existing.price),
      stock: existing.stock,
    },
  });

  res.json({ success: true, message: 'Ürün pasife alındı' });
});
