import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';

const TZ = 'Europe/Istanbul';

function getIstanbulRanges() {
  const now = toZonedTime(new Date(), TZ);
  return {
    todayStart: fromZonedTime(startOfDay(now), TZ),
    weekStart: fromZonedTime(startOfWeek(now, { weekStartsOn: 1 }), TZ),
    monthStart: fromZonedTime(startOfMonth(now), TZ),
  };
}

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const { todayStart, weekStart, monthStart } = getIstanbulRanges();

  const [
    dailySalesAgg,
    weeklySalesAgg,
    monthlySalesAgg,
    dailyRevenueAgg,
    stockValueAgg,
    totalProducts,
    lowStockCount,
    unreadNotifications,
  ] = await Promise.all([
    // Günlük toplam adet
    prisma.sale.aggregate({
      _sum: { quantity: true },
      where: { createdAt: { gte: todayStart } },
    }),
    // Haftalık toplam adet
    prisma.sale.aggregate({
      _sum: { quantity: true },
      where: { createdAt: { gte: weekStart } },
    }),
    // Aylık toplam adet
    prisma.sale.aggregate({
      _sum: { quantity: true },
      where: { createdAt: { gte: monthStart } },
    }),
    // Günlük ciro
    prisma.sale.aggregate({
      _sum: { totalPrice: true },
      where: { createdAt: { gte: todayStart } },
    }),
    // Toplam stok değeri (aktif ürünler)
    prisma.product.findMany({
      where: { isActive: true },
      select: { price: true, stock: true },
    }),
    // Aktif ürün sayısı
    prisma.product.count({ where: { isActive: true } }),
    // Kritik stok sayısı (stock <= 1)
    prisma.product.count({ where: { isActive: true, stock: { lte: 1 } } }),
    // Okunmamış bildirim sayısı
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  const totalStockValue = stockValueAgg.reduce(
    (sum, p) => sum + Number(p.price) * p.stock,
    0
  );

  res.json({
    success: true,
    data: {
      dailySales: dailySalesAgg._sum.quantity ?? 0,
      weeklySales: weeklySalesAgg._sum.quantity ?? 0,
      monthlySales: monthlySalesAgg._sum.quantity ?? 0,
      dailyRevenue: Number(dailyRevenueAgg._sum.totalPrice ?? 0),
      totalStockValue,
      totalProducts,
      lowStockCount,
      unreadNotifications,
    },
  });
});

// ── Günlük Veri Sıfırlama ────────────────────────────────────────────────────
// Sadece bugünkü Sale kayıtlarını siler. Stok ve Sipariş verilerine dokunmaz.
export const resetDailyData = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };

  if (!password) {
    res.status(400).json({ success: false, error: 'Şifre gerekli' });
    return;
  }

  // Mevcut kullanıcıyı DB'den çek (şifre hash dahil)
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  if (!user) {
    res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    res.status(401).json({ success: false, error: 'Şifre hatalı' });
    return;
  }

  // Bugünün başlangıcını İstanbul saatine göre hesapla
  const { todayStart } = getIstanbulRanges();

  // Yalnızca bugünkü satışları sil (stok ve siparişe dokunma)
  const deleted = await prisma.sale.deleteMany({
    where: { createdAt: { gte: todayStart } },
  });

  res.json({
    success: true,
    data: { deletedSalesCount: deleted.count },
    message: `Bugünkü ${deleted.count} satış kaydı sıfırlandı`,
  });
});
