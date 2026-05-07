import { Request, Response } from 'express';
import { Category } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadImage, deleteImage } from '../utils/cloudinary';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query as { category?: string };

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

  let imageUrl: string | undefined;
  let cloudinaryPublicId: string | undefined;

  if (req.file) {
    const uploaded = await uploadImage(req.file.buffer);
    imageUrl = uploaded.url;
    cloudinaryPublicId = uploaded.publicId;
  }

  const product = await prisma.product.create({
    data: {
      name,
      category,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      imageUrl,
      cloudinaryPublicId,
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

  const { name, category, price, stock } = req.body as {
    name?: string;
    category?: Category;
    price?: string;
    stock?: string;
  };

  let imageUrl: string | null = existing.imageUrl;
  let cloudinaryPublicId: string | null = existing.cloudinaryPublicId;

  if (req.file) {
    if (existing.cloudinaryPublicId) await deleteImage(existing.cloudinaryPublicId);
    const uploaded = await uploadImage(req.file.buffer);
    imageUrl = uploaded.url;
    cloudinaryPublicId = uploaded.publicId;
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(stock !== undefined && { stock: parseInt(stock, 10) }),
      imageUrl,
      cloudinaryPublicId,
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

  res.json({ success: true, message: 'Ürün pasife alındı' });
});
