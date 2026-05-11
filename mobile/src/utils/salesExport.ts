import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { salesApi } from '../services/api';

export async function exportMonthlySales(period: string): Promise<{
  filename: string;
  total: number;
  period: string;
}> {
  const res = await salesApi.exportMonthly(period);
  if (!res.success || !res.data) {
    throw new Error(res.error ?? res.message ?? 'Excel çıktısı oluşturulamadı');
  }

  const targetDir = FileSystem.documentDirectory;
  if (!targetDir) {
    throw new Error('Dosya kaydetme alanı bulunamadı');
  }

  const fileUri = `${targetDir}${res.data.filename}`;
  await FileSystem.writeAsStringAsync(fileUri, res.data.base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: res.data.mimeType,
      dialogTitle: `${res.data.period} satış Excel çıktısı`,
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  }

  return {
    filename: res.data.filename,
    total: res.data.total,
    period: res.data.period,
  };
}

export function getMonthPeriod(offset: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + offset, 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
