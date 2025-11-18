import { OptimizationInput, SheetResult } from '@/shared/api/optimizer.dto';

export interface GroupedSheetResult extends SheetResult {
  count: number;
}

export function groupAndCountSheets(sheets: SheetResult[]): GroupedSheetResult[] {
  const groups: Record<string, GroupedSheetResult> = {};

  for (const sheet of sheets) {
    // Создаем уникальный ключ из комбинации свойств
    const groupKey = `${sheet.length}|${sheet.width}|${sheet.color}|${sheet.thickness}`;

    if (groups[groupKey]) {
      // Если группа уже существует, увеличиваем счетчик
      groups[groupKey].count++;
    } else {
      // Создаем новую группу
      groups[groupKey] = {
        ...sheet,
        count: 1,
      };
    }
  }

  // Преобразуем объект с группами в массив
  return Object.values(groups);
}

//Функция для удаления изделий с нулевыми размерами (длина и/или ширина)
export function removeZeroSizeParts(data: OptimizationInput): OptimizationInput {
  const filteredData = {
    ...data,
    parts: data.parts.filter((item) => item.length > 0 && item.width > 0),
  };
  return filteredData;
}
