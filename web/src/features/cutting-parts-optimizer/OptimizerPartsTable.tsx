'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { z } from 'zod';

import { Part } from '@/entities/part/model/types';
import { DataTable, EditableConfig } from '@/shared/ui/data-table';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn';
import { defaultOpticutDataList, defaultOpticutInput } from './lib/defaultOpticutData';
import useStore, { useParts } from './model/store';

type OptimizerPartsTableProps = React.HTMLAttributes<HTMLDivElement>;

const editableConfig: EditableConfig<Part> = {
  length: {
    type: 'number',
    validate: (value) => value > 0,
  },
  width: {
    type: 'number',
    validate: (value) => value > 0,
  },
  color: {
    type: 'text',
  },
  thickness: {
    type: 'select',
    options: [
      { label: '0.35', value: 0.35 },
      { label: '0.4', value: 0.4 },
      { label: '0.45', value: 0.45 },
      { label: '0.5', value: 0.5 },
      { label: '0.7', value: 0.7 },
    ],
  },
  quantity: {
    type: 'number',
    validate: (value) => value > 0,
  },
  description: {
    type: 'text',
  },
  canRotate: {
    type: 'checkbox',
  },
};

const partSchema = z.object({
  length: z.number().min(1, 'Длина должна быть больше 0'),
  width: z.number().min(1, 'Ширина должна быть больше 0'),
  color: z.string().min(1, 'Цвет обязателен'),
  thickness: z.number().min(0.1, 'Толщина должна быть больше 0.1'),
  quantity: z.number().min(1, 'Количество должно быть больше 0'),
  canRotate: z.boolean().default(true),
  description: z.string(),
});

export const OptimizerPartsTable = ({ ...props }: OptimizerPartsTableProps) => {
  const parts = useParts();
  const store = useStore();

  const columns = useMemo<ColumnDef<Part>[]>(
    () => [
      {
        id: 'id',
        accessorKey: 'id',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        sortingFn: (rowA, rowB) => {
          const a = parseInt(rowA.getValue('id'));
          const b = parseInt(rowB.getValue('id'));
          return a < b ? -1 : a > b ? 1 : 0;
        },
      },
      {
        id: 'length',
        accessorKey: 'length',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Длина
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        id: 'width',
        accessorKey: 'width',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Ширина
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        id: 'color',
        accessorKey: 'color',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Цвет
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        id: 'thickness',
        accessorKey: 'thickness',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Толщина
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        id: 'quantity',
        accessorKey: 'quantity',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Количество
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: 'Описание',
      },
      {
        id: 'canRotate',
        accessorKey: 'canRotate',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Поворот
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
    ],
    //Зависимости пустые, так как колонки статичны и не зависят от пропсов или состояния
    [],
  );

  const validateRow = (data: Partial<Part>) => {
    try {
      partSchema.parse({
        ...data,
        canRotate: true,
      });
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          error: error.errors[0].message,
        };
      }
      return {
        isValid: false,
        error: 'Ошибка валидации',
      };
    }
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Тестирование</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={(index) => store.setParts(defaultOpticutDataList[+index].parts)}>
            <SelectTrigger>
              <SelectValue placeholder="Готовый набор деталей" />
            </SelectTrigger>
            <SelectContent>
              {defaultOpticutDataList.map((data, index) => (
                <SelectItem key={index} value={index.toLocaleString()}>
                  {data.name}
                </SelectItem>
              ))}
              <SelectItem value="default">Default</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card {...props}>
        <CardHeader>
          <CardTitle>Список деталей</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={parts}
            editableConfig={editableConfig}
            onRowSave={(oldData, newData) => {
              const newParts = parts.map((p) => (p.id === oldData.id ? newData : p));
              store.setParts(newParts);
            }}
            onRowDelete={(data) => {
              const newParts = parts.filter((p) => p.id !== data.id);
              store.setParts(newParts);
            }}
            enableAddRow={true}
            onRowAdd={(data) => {
              store.addPart({
                length: data.length || 0,
                width: data.width || 0,
                color: data.color || '',
                thickness: data.thickness || 0.35,
                quantity: data.quantity || 1,
                label: data.label || '',
                description: data.description || '',
                canRotate: data.canRotate || true,
              });
            }}
            defaultValues={defaultOpticutInput().part}
            validateRow={validateRow}
          />
        </CardContent>
      </Card>
    </>
  );
};
