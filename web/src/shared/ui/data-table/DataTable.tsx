'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Check, MoreHorizontal, Pencil, Plus, Trash, X } from 'lucide-react';

import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn';

export type EditableColumnConfig<T = string | number> = {
  type: 'text' | 'number' | 'select' | 'checkbox';
  options?: { label: string; value: T }[];
  validate?: (value: T) => boolean;
};

export type EditableConfig<TData> = {
  [K in keyof TData]?: EditableColumnConfig<TData[K]>;
};

interface EditingState<TData> {
  id: string;
  data: Partial<TData>;
}

interface DataTableProps<TData extends { id: string }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  editableConfig?: EditableConfig<TData>;
  onRowSave?: (oldData: TData, newData: TData) => void;
  onRowDelete?: (data: TData) => void;
  showActions?: boolean;
  enableAddRow?: boolean;
  onRowAdd?: (data: Partial<TData>) => void;
  defaultValues?: Partial<TData>;
  validateRow?: (data: Partial<TData>) => { isValid: boolean; error?: string };
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  editableConfig,
  onRowSave,
  onRowDelete,
  showActions = true,
  enableAddRow = false,
  onRowAdd,
  defaultValues,
  validateRow,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: false }]);
  const [editingRow, setEditingRow] = useState<EditingState<TData> | null>(null);
  const [newRowData, setNewRowData] = useState<Partial<TData>>(defaultValues || {});
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleStartEdit = useCallback((row: TData) => {
    setEditingRow({
      id: row.id,
      data: { ...row },
    });
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingRow) return;

    const oldData = data.find((item) => item.id === editingRow.id);
    if (!oldData) return;

    const newData = { ...oldData, ...editingRow.data } as TData;

    if (validateRow) {
      const validation = validateRow(newData);
      if (!validation.isValid) {
        setValidationError(validation.error || 'Ошибка валидации');
        return;
      }
    }

    setValidationError(null);
    onRowSave?.(oldData, newData);
    setEditingRow(null);
  }, [editingRow, data, onRowSave, validateRow]);

  const handleCancelEdit = useCallback(() => {
    setEditingRow(null);
  }, []);

  const updateData = useCallback((rowId: string, columnId: string, value: any) => {
    setEditingRow((old) => {
      if (old?.id !== rowId) return old;
      return {
        id: rowId,
        data: {
          ...old.data,
          [columnId]: value,
        },
      };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingRow) return;

      if (e.key === 'Enter') {
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingRow, handleSaveEdit, handleCancelEdit]);

  const handleAddRow = () => {
    if (validateRow) {
      const validation = validateRow(newRowData);
      if (!validation.isValid) {
        setValidationError(validation.error || 'Ошибка валидации');
        return;
      }
    }

    setValidationError(null);
    onRowAdd?.(newRowData);
    setNewRowData(defaultValues || {});
  };

  const updateNewRowData = (columnId: string, value: any) => {
    setNewRowData((prev) => ({
      ...prev,
      [columnId]: value,
    }));
  };

  const renderEditableCell = (
    value: any,
    columnId: string,
    rowId: string | null,
    config?: EditableColumnConfig,
    isNewRow?: boolean,
  ) => {
    if (!config) return value;

    const currentValue = isNewRow
      ? (newRowData[columnId as keyof TData] ?? value)
      : (editingRow?.data[columnId as keyof TData] ?? value);

    if (config.type === 'select' && config.options) {
      return (
        <select
          value={String(currentValue)}
          onChange={(e) => {
            const newValue =
              typeof config.options?.[0]?.value === 'number'
                ? Number.parseFloat(e.target.value)
                : e.target.value;
            if (isNewRow) {
              updateNewRowData(columnId, newValue);
            } else {
              updateData(rowId!, columnId, newValue);
            }
          }}
          className="h-8 w-full rounded border bg-white px-2"
        >
          {config.options.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      );
    } else if (config.type === 'checkbox') {
      return (
        <Checkbox
          checked={Boolean(currentValue)}
          onCheckedChange={(checked) => {
            if (isNewRow) {
              updateNewRowData(columnId, checked);
            } else {
              updateData(rowId!, columnId, checked);
            }
          }}
        />
      );
    }

    return (
      <Input
        value={currentValue}
        onChange={(e) => {
          const newValue = config.type === 'number' ? Number(e.target.value) : e.target.value;
          if (config.validate?.(newValue) === false) return;
          if (isNewRow) {
            updateNewRowData(columnId, newValue);
          } else {
            updateData(rowId!, columnId, newValue);
          }
        }}
        onFocus={(e) => {
          (e.target as HTMLInputElement).select();
        }}
        type={config.type}
        className="h-8 bg-white"
      />
    );
  };

  const allColumns = showActions
    ? [
        ...columns,
        {
          id: 'actions',
          cell: ({ row }: { row: { original: TData } }) => {
            const rowData = row.original;

            return (
              <>
                <DropdownMenu>
                  {editingRow?.id !== rowData.id && (
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  )}
                  <DropdownMenuContent align="end">
                    {editingRow?.id !== rowData.id && (
                      <DropdownMenuItem
                        onClick={() => handleStartEdit(rowData)}
                        className="text-600"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Редактировать
                      </DropdownMenuItem>
                    )}
                    {editingRow?.id !== rowData.id && onRowDelete && (
                      <DropdownMenuItem
                        onClick={() => onRowDelete(rowData)}
                        className="text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {editingRow?.id === rowData.id && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSaveEdit}
                      className="h-8 w-8 p-0 text-green-600"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancelEdit}
                      className="h-8 w-8 p-0 text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            );
          },
        },
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-row-id={row.original.id}
                data-state={row.getIsSelected() && 'selected'}
                onDoubleClick={() => handleStartEdit(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {editingRow?.id === row.original.id &&
                    editableConfig?.[cell.column.id as keyof TData] ? (
                      renderEditableCell(
                        cell.getValue(),
                        cell.column.id,
                        row.original.id,
                        editableConfig[
                          cell.column.id as keyof TData
                        ] as unknown as EditableColumnConfig<string | number>,
                      )
                    ) : editableConfig?.[cell.column.id as keyof TData]?.type === 'checkbox' ? (
                      <Checkbox
                        checked={Boolean(cell.getValue())}
                        onCheckedChange={(checked) => {
                          updateData(row.original.id, cell.column.id, checked);
                        }}
                      />
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Нет данных
              </TableCell>
            </TableRow>
          )}
          {enableAddRow && editableConfig && (
            <TableRow>
              {columns.map((column, index) => {
                const columnId = column.id as string;
                return (
                  <TableCell key={`new-row-${columnId}`}>
                    {editableConfig?.[columnId as keyof TData]
                      ? renderEditableCell(
                          '',
                          columnId,
                          null,
                          editableConfig?.[
                            columnId as keyof TData
                          ] as unknown as EditableColumnConfig<string | number>,
                          true,
                        )
                      : null}
                  </TableCell>
                );
              })}
              {showActions && (
                <TableCell key="new-row-actions">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAddRow}
                      className="h-8 w-8 p-0 text-green-600"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      {validationError && <div className="p-2 text-sm text-red-600">{validationError}</div>}
    </div>
  );
}
