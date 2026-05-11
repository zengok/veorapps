import cron from 'node-cron';
import { endOfMonth, format, parse, startOfMonth } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { NotificationType, PrismaClient } from '@prisma/client';
import { prisma } from './prisma';
import { sendPushToAll } from './pushNotification';

const TZ = 'Europe/Istanbul';
const SETTING_ID = 'monthly-target';

export function getCurrentMonthKey(date = new Date()): string {
  return format(toZonedTime(date, TZ), 'yyyy-MM');
}

export function getMonthRange(monthKey = getCurrentMonthKey()) {
  const monthStartLocal = startOfMonth(parse(`${monthKey}-01`, 'yyyy-MM-dd', new Date()));
  const monthEndLocal = endOfMonth(monthStartLocal);

  return {
    monthKey,
    start: fromZonedTime(monthStartLocal, TZ),
    end: fromZonedTime(monthEndLocal, TZ),
  };
}

function formatTry(amount: number): string {
  return `${amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL`;
}

export async function getOrCreateMonthlyTargetSetting(client: PrismaClient = prisma) {
  const monthKey = getCurrentMonthKey();
  const setting = await client.monthlyTargetSetting.upsert({
    where: { id: SETTING_ID },
    update: {},
    create: {
      id: SETTING_ID,
      targetMonth: monthKey,
      targetRevenue: 0,
      isMonthlyTargetHit: false,
    },
  });

  if (setting.targetMonth === monthKey) return setting;

  return client.monthlyTargetSetting.update({
    where: { id: SETTING_ID },
    data: {
      targetMonth: monthKey,
      isMonthlyTargetHit: false,
      hitAt: null,
    },
  });
}

export async function getCurrentMonthlyRevenue(client: PrismaClient = prisma): Promise<number> {
  const { start, end } = getMonthRange();
  const result = await client.sale.aggregate({
    _sum: { totalPrice: true },
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  return Number(result._sum.totalPrice ?? 0);
}

export async function checkMonthlyTargetAndNotify(): Promise<void> {
  const setting = await getOrCreateMonthlyTargetSetting();
  const targetRevenue = Number(setting.targetRevenue);

  if (targetRevenue <= 0 || setting.isMonthlyTargetHit) return;

  const monthlyRevenue = await getCurrentMonthlyRevenue();
  if (monthlyRevenue < targetRevenue) return;

  const updated = await prisma.monthlyTargetSetting.updateMany({
    where: {
      id: SETTING_ID,
      targetMonth: getCurrentMonthKey(),
      isMonthlyTargetHit: false,
      targetRevenue: setting.targetRevenue,
    },
    data: {
      isMonthlyTargetHit: true,
      hitAt: new Date(),
    },
  });

  if (updated.count === 0) return;

  const title = '🏹 HEDEF TAM NOKTASINDAN VURULDU! 🎯';
  const message = `Tebrikler! Bu ayki ${formatTry(targetRevenue)} ciro hedefimizi an itibarıyla aştık! 🚀`;

  await prisma.notification.create({
    data: {
      title,
      message,
      type: NotificationType.INFO,
    },
  });

  await sendPushToAll(title, message, {
    type: 'MONTHLY_TARGET_HIT',
    targetRevenue,
    monthlyRevenue,
    month: setting.targetMonth,
  });
}

export async function resetMonthlyTargetFlagForCurrentMonth(): Promise<void> {
  const monthKey = getCurrentMonthKey();
  await prisma.monthlyTargetSetting.upsert({
    where: { id: SETTING_ID },
    update: {
      targetMonth: monthKey,
      isMonthlyTargetHit: false,
      hitAt: null,
    },
    create: {
      id: SETTING_ID,
      targetMonth: monthKey,
      targetRevenue: 0,
      isMonthlyTargetHit: false,
      hitAt: null,
    },
  });
}

export function startMonthlyTargetResetScheduler(): void {
  cron.schedule(
    '0 0 1 * *',
    () => {
      resetMonthlyTargetFlagForCurrentMonth().catch((err) => {
        console.error('[MonthlyTarget] Aylık hedef bayrağı sıfırlanamadı:', err);
      });
    },
    { timezone: TZ }
  );
}
