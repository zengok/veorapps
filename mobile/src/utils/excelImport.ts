import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';

export type ExcelCategory = 'WOMEN' | 'MEN' | 'AUTO';

export interface ParsedExcelResult {
  /** Kadın parfümleri satırları */
  women: Record<string, unknown>[];
  /** Erkek parfümleri satırları */
  men: Record<string, unknown>[];
  /** Kategori sütunu içermeyen, düz tek sheet'ten gelen satırlar */
  uncategorized: Record<string, unknown>[];
  /** Toplam okunan satır sayısı */
  totalRows: number;
  /** Sheet adları */
  sheetNames: string[];
}

/**
 * Kullanıcıya dosya seçtirip XLSX'i parse eder.
 * Sheet adına göre kadın/erkek ayrımı yapar.
 * "Kadın" / "Women" / "W" içeren sheet → WOMEN
 * "Erkek" / "Men" / "M" içeren sheet → MEN
 * Tek sheet ise satır içindeki "kategori" sütununa bakar.
 */
export async function pickAndParseExcel(): Promise<ParsedExcelResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
      '*/*',
    ],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const file = result.assets[0];

  // Dosyayı base64 olarak oku
  const base64 = await FileSystem.readAsStringAsync(file.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const workbook = XLSX.read(base64, { type: 'base64' });

  const women: Record<string, unknown>[] = [];
  const men: Record<string, unknown>[] = [];
  const uncategorized: Record<string, unknown>[] = [];
  let totalRows = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });
    totalRows += rows.length;

    const nameLower = sheetName.toLowerCase();
    let sheetCat: 'WOMEN' | 'MEN' | null = null;

    if (nameLower.includes('kad') || nameLower.includes('women') || nameLower === 'w') {
      sheetCat = 'WOMEN';
    } else if (nameLower.includes('erk') || nameLower.includes('men') || nameLower === 'm') {
      sheetCat = 'MEN';
    }

    for (const row of rows) {
      const enriched = { ...row, _sheetCategory: sheetCat };
      if (sheetCat === 'WOMEN') {
        women.push(enriched);
      } else if (sheetCat === 'MEN') {
        men.push(enriched);
      } else {
        // Satır içindeki kategori sütununa bak
        const catRaw = String(
          (row['kategori'] ?? row['category'] ?? row['Kategori'] ?? row['Category'] ?? '') as string
        ).toLowerCase();
        if (catRaw.includes('kad') || catRaw === 'women' || catRaw === 'w') {
          women.push({ ...row, _sheetCategory: 'WOMEN' });
        } else if (catRaw.includes('erk') || catRaw === 'men' || catRaw === 'm') {
          men.push({ ...row, _sheetCategory: 'MEN' });
        } else {
          uncategorized.push(enriched);
        }
      }
    }
  }

  return {
    women,
    men,
    uncategorized,
    totalRows,
    sheetNames: workbook.SheetNames,
  };
}
