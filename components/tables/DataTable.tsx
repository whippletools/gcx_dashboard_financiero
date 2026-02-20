'use client';

// components/tables/DataTable.tsx
// Reusable Data Table component following Material Design 3

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/lib/utils/formatters';

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'percentage' | 'number' | 'date' | 'none';
  width?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  sortable?: boolean;
  defaultSortColumn?: string;
  defaultSortDirection?: 'asc' | 'desc';
  maxHeight?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  sortable = true,
  defaultSortColumn,
  defaultSortDirection = 'asc',
  maxHeight = '400px',
  className,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(defaultSortColumn || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);

  const sortedData = useMemo(() => {
    if (!sortable || !sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [data, sortColumn, sortDirection, sortable]);

  const handleSort = (columnKey: string) => {
    if (!sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const formatValue = (value: any, format?: string): string => {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatNumber(value);
      case 'date':
        return formatDate(value);
      default:
        return String(value);
    }
  };

  return (
    <div className={className}>
      {title && (
        <h3 className="text-title-small text-on-surface-variant mb-3">
          {title}
        </h3>
      )}
      <div 
        className="overflow-auto rounded-lg border border-outline-variant"
        style={{ maxHeight }}
      >
        <table className="w-full min-w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-blue-700">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 text-left text-label-medium font-semibold text-white ${
                    column.sortable && sortable ? 'cursor-pointer hover:bg-blue-600' : ''
                  } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className={`flex items-center gap-1 ${
                    column.align === 'center' ? 'justify-center' : 
                    column.align === 'right' ? 'justify-end' : 'justify-start'
                  }`}>
                    {column.label}
                    {column.sortable && sortable && (
                      <span className="ml-1">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-4 h-4 text-primary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-outline" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant bg-surface">
            {sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-surface-container transition-colors"
              >
                {columns.map((column) => {
                  const value = row[column.key as string];
                  const formattedValue = formatValue(value, column.format);

                  return (
                    <td
                      key={`${rowIndex}-${String(column.key)}`}
                      className={`px-4 py-3 text-body-medium text-on-surface ${
                        column.align === 'center' ? 'text-center' : 
                        column.align === 'right' ? 'text-right' : 'text-left'
                      } ${column.cellClassName || ''}`}
                    >
                      {formattedValue}
                    </td>
                  );
                })}
              </tr>
            ))}
            {sortedData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-body-medium text-on-surface-variant"
                >
                  No hay datos disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-label-small text-on-surface-variant">
        {sortedData.length} registros
      </div>
    </div>
  );
}
