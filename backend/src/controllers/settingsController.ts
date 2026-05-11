import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { writeAuditLog } from '../utils/auditLog';
import {
  checkMonthlyTargetAndNotify,
  getCurrentMonthlyRevenue,
  getOrCreateMonthlyTargetSetting,
} from '../utils/monthlyTarget';

function parseTargetRevenue(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw Object.assign(new Error('Aylık hedef ciro 0 veya daha büyük bir sayı olmalı'), { status: 400 });
  }
  if (amount > 999_999_999) {
    throw Object.assign(new Error('Aylık hedef ciro çok yüksek'), { status: 400 });
  }
  return Math.round(amount * 100) / 100;
}

export const getMonthlyTarget = asyncHandler(async (_req: Request, res: Response) => {
  const [setting, currentRevenue] = await Promise.all([
    getOrCreateMonthlyTargetSetting(),
    getCurrentMonthlyRevenue(),
  ]);

  res.json({
    success: true,
    data: {
      targetRevenue: Number(setting.targetRevenue),
      currentRevenue,
      targetMonth: setting.targetMonth,
      isMonthlyTargetHit: setting.isMonthlyTargetHit,
      hitAt: setting.hitAt,
    },
  });
});

export const updateMonthlyTarget = asyncHandler(async (req: Request, res: Response) => {
  const targetRevenue = parseTargetRevenue((req.body as { targetRevenue?: unknown }).targetRevenue);
  const current = await getOrCreateMonthlyTargetSetting();

  const setting = await prisma.monthlyTargetSetting.update({
    where: { id: current.id },
    data: {
      targetRevenue,
      isMonthlyTargetHit: false,
      hitAt: null,
    },
  });

  await writeAuditLog({
    req,
    action: 'MONTHLY_TARGET_UPDATE',
    entityType: 'MonthlyTargetSetting',
    entityId: setting.id,
    metadata: {
      targetRevenue,
      targetMonth: setting.targetMonth,
    },
  });

  await checkMonthlyTargetAndNotify();

  const refreshed = await getOrCreateMonthlyTargetSetting();
  const currentRevenue = await getCurrentMonthlyRevenue();

  res.json({
    success: true,
    data: {
      targetRevenue: Number(refreshed.targetRevenue),
      currentRevenue,
      targetMonth: refreshed.targetMonth,
      isMonthlyTargetHit: refreshed.isMonthlyTargetHit,
      hitAt: refreshed.hitAt,
    },
    message: 'Aylık hedef ciro güncellendi',
  });
});
