import { promises as fs } from 'fs';
import path from 'path';

import { OptimizationInput } from '@/shared/api/optimizer.dto.js';

// Путь к папке с данными
const dataDirName = 'data';

export async function storeData(data: OptimizationInput): Promise<string> {
  // Генерируем уникальный ID
  const dataId = crypto.randomUUID();
  const dataDir = path.join(process.cwd(), dataDirName);
  // Создаем директорию, если её нет
  await fs.mkdir(dataDir, { recursive: true });
  const filePath = path.join(dataDir, `${dataId}.json`);
  // Сохраняем данные в файл
  await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');

  return dataId;
}

export async function getData(dataId: string): Promise<OptimizationInput | null> {
  const dataDir = path.join(process.cwd(), dataDirName);
  // Создаем директорию, если её нет
  await fs.mkdir(dataDir, { recursive: true });
  const filePath = path.join(dataDir, `${dataId}.json`);

  try {
    // Читаем данные из файла
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return null;
  }
}
