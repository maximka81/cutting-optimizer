'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { z } from 'zod';

import { Material } from '@/entities/material/model/types';
import { DataTable, EditableConfig } from '@/shared/ui/data-table';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn';
import { defaultOpticutInput } from './lib/defaultOpticutData';
import useStore, { useMaterials } from './model/store';

type OptimizerMaterialsTableProps = React.HTMLAttributes<HTMLDivElement>;

const editableConfig: EditableConfig<Material> = {
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
  availableQuantity: {
    type: 'number',
    validate: (value) => value > 0,
  },
};

const materialSchema = z.object({
  length: z.number().min(1, 'Длина должна быть больше 0'),
  width: z.number().min(1, 'Ширина должна быть больше 0'),
  color: z.string().min(1, 'Цвет обязателен'),
  thickness: z.number().min(0.1, 'Толщина должна быть больше 0.1'),
  availableQuantity: z.number().min(1, 'Количество должно быть больше 0'),
});

export const OptimizerMaterialsTable = ({ ...props }: OptimizerMaterialsTableProps) => {
  const materials = useMaterials();
  const store = useStore();

  const columns = useMemo<ColumnDef<Material>[]>(
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
        id: 'availableQuantity',
        accessorKey: 'availableQuantity',
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
    ],
    //Зависимости пустые, так как колонки статичны и не зависят от пропсов или состояния
    [],
  );

  const validateRow = (data: Partial<Material>) => {
    try {
      materialSchema.parse({
        ...data,
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
    <Card {...props}>
      <CardHeader>
        <CardTitle>Список материалов</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={materials}
          editableConfig={editableConfig}
          onRowSave={(oldData, newData) => {
            const newMaterials = materials.map((m) => (m.id === oldData.id ? newData : m));
            store.setMaterials(newMaterials);
          }}
          onRowDelete={(data) => {
            const newMaterials = materials.filter((m) => m.id !== data.id);
            store.setMaterials(newMaterials);
          }}
          enableAddRow={true}
          onRowAdd={(data) => {
            store.addMaterial({
              length: data.length || 0,
              width: data.width || 0,
              color: data.color || '',
              thickness: data.thickness || 0.35,
              availableQuantity: data.availableQuantity || 1,
            });
          }}
          defaultValues={defaultOpticutInput().material}
          validateRow={validateRow}
        />
      </CardContent>
    </Card>
  );
};
