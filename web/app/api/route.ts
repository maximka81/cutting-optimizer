import { NextRequest, NextResponse } from 'next/server';

import { removeZeroSizeParts } from '@/features/cutting-parts-optimizer/lib/utils';
import { getData, storeData } from './file-storage';

export async function POST(req: NextRequest) {
  const jsonData = await req.json(); // Получаем JSON из тела запроса
  try {
    //console.log(`jsonData:`, jsonData) // Логируем полученные данные
    const data = removeZeroSizeParts(jsonData); // Удаляем детали с нулевыми размерами
    const dataId = await storeData(data); // Сохраняем данные в файл
    const redirectUrl = new URL(
      `${process.env.NEXT_PUBLIC_OPTICUT_WEB_URL}?dataId=${dataId}`,
      req.url,
    ); // Создаем URL для редиректа
    const redirectUrlString = redirectUrl.toString(); // Преобразуем URL в строку

    return Response.json({ redirectUrlString });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error storing data:', error.message); // Логируем ошибку
    } else {
      console.error('Error storing data:', error); // Логируем ошибку
    }
    return NextResponse.json({ error: 'Error storing data' }, { status: 500 }); // Возвращаем ошибку
  }
}

export async function GET(req: NextRequest) {
  const dataId = req.nextUrl.searchParams.get('dataId'); // Получаем dataId из URL
  if (!dataId) {
    return NextResponse.json({ error: 'Отсутсвует необходимый параметр dataId' }, { status: 400 });
  }
  if (Array.isArray(dataId)) {
    return NextResponse.json({ error: 'Неверный формат dataId' }, { status: 400 });
  }
  const data = await getData(dataId);
  return NextResponse.json(data);
}
