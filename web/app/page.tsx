'use client';

import React, { use, useEffect, useState } from 'react';

import CuttingPartsOptimizer from '@/features/cutting-parts-optimizer/CuttingPartsOptimizer';
import { OptimizationInput } from '@/shared/api/optimizer.dto';

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default function Page({ searchParams }: Props) {
  const params = use(searchParams);
  //console.log('PAGE.searchParams:', params) // Логируем searchParams

  const { dataId } = params;
  const [optimizationInput, setOptimizationInput] = useState<OptimizationInput | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(dataId));

  useEffect(() => {
    if (dataId) {
      //console.log('PAGE.dataId:', dataId) // Логируем dataId
      fetch(`/api?dataId=${dataId}`, {
        method: 'GET',
      })
        .then((response) => response.json())
        .then((resultData) => {
          setOptimizationInput(resultData);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Ошибка загрузки данных:', error);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [dataId]);

  return (
    <div>
      {isLoading && <p>Загрузка...</p>}
      {!isLoading && <CuttingPartsOptimizer optimizationInput={optimizationInput} />}
    </div>
  );
}
