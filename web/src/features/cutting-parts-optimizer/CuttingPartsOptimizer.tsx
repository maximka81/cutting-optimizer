'use client';

import React, { useEffect, useState } from 'react';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';

import { optimize } from '@/shared/api/optimizer-api';
import { OptimizationInput, OptimizationResult } from '@/shared/api/optimizer.dto';
import { toast } from '@/shared/components/hooks/use-toast';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Toaster,
} from '@/shared/ui/shadcn';
import CuttingPlan from './CuttingPlan';
import { groupAndCountSheets } from './lib/utils';
import useStore from './model/store';
import { OptimizerMaterialsTable } from './OptimizerMaterialsTable';
import { OptimizerPartsTable } from './OptimizerPartsTable';
import OptimizerSettingsForm from './OptimizerSettingsForm';

interface CuttingPartsOptimizerProps {
  optimizationInput: OptimizationInput | null;
}

const CuttingPartsOptimizer = ({ optimizationInput }: CuttingPartsOptimizerProps) => {
  const [activeTab, setActiveTab] = useState<'parts' | 'materials' | 'settings'>('parts');

  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [resultJSONisOpen, setResultJSONisOpen] = React.useState(false);
  const [resultMainisOpen, setResultMainisOpen] = React.useState(true);

  const store = useStore();

  //console.log(`Вызов CuttingPartsOptimizer!!!!`)

  // Используем useEffect для установки данных в store только один раз при изменении optimizationInput
  useEffect(() => {
    if (optimizationInput) {
      store.setParts(optimizationInput.parts);
      store.setMaterials(optimizationInput.availableMaterials ?? []);
      store.setOptions(optimizationInput.options);
    }
  }, [optimizationInput]); // Зависимость только от optimizationInput

  const handleOptimize = async () => {
    try {
      const body: OptimizationInput = {
        parts: store.parts,
        options: store.options,
      };

      if (!store.options.useInfiniteMaterials) {
        body.availableMaterials = store.materials;
      }

      const result = await optimize(body);
      setResult(result);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data.message.join(', ') || 'Неизвестная ошибка';
        toast({
          variant: 'destructive',
          title: 'Ошибка оптимизации',
          description: errorMessage,
          duration: 5000,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка оптимизации',
          description: error instanceof Error ? error.message : 'Неизвестная ошибка',
          duration: 5000,
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-64 border-r bg-gray-100 p-6">
        <h2 className="text-lg font-semibold">Оптимизатор раскроя</h2>
        <Separator className="my-4" />
        <nav className="space-y-2">
          <Button
            variant={activeTab === 'parts' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('parts')}
          >
            Детали
          </Button>
          <Button
            variant={activeTab === 'materials' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('materials')}
          >
            Материалы
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('settings')}
          >
            Настройки
          </Button>
        </nav>
      </div>

      <div className="flex-1 p-6">
        {activeTab === 'parts' && (
          <>
            <h1 className="text-2xl font-bold">Детали</h1>
            <Separator className="my-4" />
            <OptimizerPartsTable />
          </>
        )}
        {activeTab === 'materials' && !store.options.useInfiniteMaterials && (
          <>
            <h1 className="text-2xl font-bold">Материалы</h1>
            <Separator className="my-4" />
            <OptimizerMaterialsTable />
          </>
        )}
        {activeTab === 'materials' && store.options.useInfiniteMaterials && (
          <Card>
            <CardHeader>
              <CardTitle>Материалы</CardTitle>
              <CardDescription>Используются бесконечные материалы</CardDescription>
            </CardHeader>
          </Card>
        )}
        {activeTab === 'settings' && <OptimizerSettingsForm />}

        <Button onClick={handleOptimize} className="mt-6">
          Расчитать
        </Button>

        {result && (
          <Card className="mt-6">
            <Collapsible open={resultMainisOpen} onOpenChange={setResultMainisOpen}>
              <CardHeader>
                <CollapsibleTrigger>
                  <CardTitle className="">
                    Результат{' '}
                    {resultMainisOpen ? (
                      <FontAwesomeIcon icon={faChevronUp} />
                    ) : (
                      <FontAwesomeIcon icon={faChevronDown} />
                    )}
                  </CardTitle>
                </CollapsibleTrigger>
              </CardHeader>
              <CardContent>
                <CollapsibleContent>
                  <h3 className="mb-4 text-xl font-semibold">Оптимизация</h3>
                  <div className="mb-4 flex flex-col space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Метод оптимизации: {result.method}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Общая площадь материалов: {(result.totalMaterialArea / 1000000).toFixed(2)} м²
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Общая площадь изделий:{' '}
                      {((result.totalMaterialArea - result.totalWaste) / 1000000).toFixed(2)} м²
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Общая площадь отходов: {(result.totalWaste / 1000000).toFixed(2)} м²
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Площадь отходов: <br />
                      {result.waste.map((waste, index) => (
                        <span key={index}>
                          {waste.color} {waste.thickness} мм: {(waste.square / 1000000).toFixed(2)}{' '}
                          м²
                          <br />
                        </span>
                      ))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Коэффициент использования материалов: {result.utilizationRate.toFixed(0)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Количество листов: {result.sheets.length}
                    </p>
                  </div>
                  <h3 className="mb-4 text-xl font-semibold">Листы</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Длина</TableHead>
                        <TableHead>Ширина</TableHead>
                        <TableHead>Цвет</TableHead>
                        <TableHead>Толщина</TableHead>
                        <TableHead>Количество</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupAndCountSheets(result.sheets).map((sheet, index) => (
                        <TableRow key={index}>
                          <TableCell>{sheet.length}</TableCell>
                          <TableCell>{sheet.width}</TableCell>
                          <TableCell>{sheet.color}</TableCell>
                          <TableCell>{sheet.thickness}</TableCell>
                          <TableCell>{sheet.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CollapsibleContent>
              </CardContent>
            </Collapsible>
          </Card>
        )}

        {result && <CuttingPlan sheets={result.sheets} />}
        {result && !result.isComplete && (
          <Card className="mt-6">
            <Collapsible
              open={true}
              // open={resultJSONisOpen}
              // onOpenChange={setResultJSONisOpen}
            >
              <CardHeader>
                <CollapsibleTrigger>
                  <CardTitle>
                    Нераспределенные детали{' '}
                    {resultJSONisOpen ? (
                      <FontAwesomeIcon icon={faChevronUp} />
                    ) : (
                      <FontAwesomeIcon icon={faChevronDown} />
                    )}
                  </CardTitle>
                </CollapsibleTrigger>
              </CardHeader>
              <CardContent>
                <CollapsibleContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Id изделия</TableHead>
                        <TableHead>Длина</TableHead>
                        <TableHead>Ширина</TableHead>
                        <TableHead>Цвет</TableHead>
                        <TableHead>Толщина</TableHead>
                        <TableHead>Количество</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.unplacedParts.map((part, index) => (
                        <TableRow key={index}>
                          <TableCell>{part.id}</TableCell>
                          <TableCell>{part.length}</TableCell>
                          <TableCell>{part.width}</TableCell>
                          <TableCell>{part.color}</TableCell>
                          <TableCell>{part.thickness}</TableCell>
                          <TableCell>{part.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CollapsibleContent>
              </CardContent>
            </Collapsible>
          </Card>
        )}
        {result && (
          <Card className="mt-6">
            <Collapsible open={resultJSONisOpen} onOpenChange={setResultJSONisOpen}>
              <CardHeader>
                <CollapsibleTrigger>
                  <CardTitle>
                    Результат JSON{' '}
                    {resultJSONisOpen ? (
                      <FontAwesomeIcon icon={faChevronUp} />
                    ) : (
                      <FontAwesomeIcon icon={faChevronDown} />
                    )}
                  </CardTitle>
                </CollapsibleTrigger>
              </CardHeader>
              <CardContent>
                <CollapsibleContent>
                  <pre className="rounded-lg bg-gray-100 p-4">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CollapsibleContent>
              </CardContent>
            </Collapsible>
          </Card>
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default CuttingPartsOptimizer;
