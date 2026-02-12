// components/tables/GuaranteeStatusTable.tsx
// US-005: Estatus de Garantías (Programadas/Naviera/Operación)
// Material Design 3 implementation with monthly breakdown

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, CheckCircle2, Ship, Settings, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { GuaranteeStatusData, GuaranteeStatusDetail, MonthGuaranteeData, GuaranteeStatus } from '@/types/dashboard';
import { formatCurrency, formatMonthNameShort } from '@/lib/utils/formatters';
import { guaranteeStatusColors } from '@/lib/utils/colors';

interface GuaranteeStatusTableProps {
  data: GuaranteeStatusData;
  title?: string;
  className?: string;
}

type SortColumn = keyof GuaranteeStatusDetail;
type SortDirection = 'asc' | 'desc';

export function GuaranteeStatusTable({
  data,
  title = 'Estatus de Garantías',
  className,
}: GuaranteeStatusTableProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('amount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter data by selected month
  const filteredData = useMemo(() => {
    if (selectedMonth === null) return data.tableData;
    return data.tableData.filter((item) => item.month === selectedMonth);
  }, [data.tableData, selectedMonth]);

  // Sort data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
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
  }, [filteredData, sortColumn, sortDirection]);

  // Calculate totals per status
  const totalsByStatus = useMemo(() => {
    const result: Record<GuaranteeStatus, number> = {
      Programadas: 0,
      Naviera: 0,
      Operacion: 0,
    };

    filteredData.forEach((item) => {
      result[item.status] += item.amount;
    });

    return result;
  }, [filteredData]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    };
  };

  const getStatusIcon = (status: GuaranteeStatus) => {
    switch (status) {
      case 'Programadas':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Naviera':
        return <Ship className="w-4 h-4" />;
      case 'Operacion':
        return <Settings className="w-4 h-4" />;
    }
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 text-outline" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-primary" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary" />
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle className="text-title-large text-on-surface">
            {title}
          </CardTitle>
        </div>
        <div className="text-right">
          <p className="text-label-medium text-on-surface-variant">Total Garantías</p>
          <p className="text-headline-small text-on-surface font-semibold">
            {formatCurrency(Object.values(totalsByStatus).reduce((a, b) => a + b, 0))}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Month Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedMonth(null)}
            className={`px-3 py-1.5 rounded-full text-label-medium transition-colors ${
              selectedMonth === null
                ? 'bg-primary text-on-primary'
                : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Todo el año
          </button>
          {data.months.map((month) => (
            <button
              key={month.month}
              onClick={() => setSelectedMonth(month.month)}
              className={`px-3 py-1.5 rounded-full text-label-medium transition-colors ${
                selectedMonth === month.month
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {formatMonthNameShort(month.month)}
            </button>
          ))}
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {(Object.keys(totalsByStatus) as GuaranteeStatus[]).map((status) => (
            <div
              key={status}
              className="p-4 rounded-lg border-l-4"
              style={{
                backgroundColor: guaranteeStatusColors[status].fill,
                borderLeftColor: guaranteeStatusColors[status].border,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div style={{ color: guaranteeStatusColors[status].text }}>
                  {getStatusIcon(status)}
                </div>
                <span
                  className="text-label-medium font-medium"
                  style={{ color: guaranteeStatusColors[status].text }}
                >
                  {status}
                </span>
              </div>
              <p
                className="text-title-large font-semibold"
                style={{ color: guaranteeStatusColors[status].text }}
              >
                {formatCurrency(totalsByStatus[status])}
              </p>
            </div>
          ))}
        </div>

        {/* Data Table */}
        <div className="overflow-auto rounded-lg border border-outline-variant max-h-[400px]">
          <table className="w-full min-w-[500px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-variant">
                <th
                  className="px-4 py-3 text-left text-label-medium font-semibold text-on-surface-variant cursor-pointer hover:bg-surface-container"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Estatus
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-label-medium font-semibold text-on-surface-variant cursor-pointer hover:bg-surface-container"
                  onClick={() => handleSort('month')}
                >
                  <div className="flex items-center gap-1">
                    Mes
                    {renderSortIcon('month')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-label-medium font-semibold text-on-surface-variant cursor-pointer hover:bg-surface-container"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Importe
                    {renderSortIcon('amount')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant bg-surface">
              {sortedData.map((item, index) => (
                <tr key={index} className="hover:bg-surface-container transition-colors">
                  <td className="px-4 py-3">
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-label-medium font-medium"
                      style={{
                        backgroundColor: guaranteeStatusColors[item.status].fill,
                        color: guaranteeStatusColors[item.status].text,
                      }}
                    >
                      {getStatusIcon(item.status)}
                      {item.status}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body-medium text-on-surface">
                    {item.monthName}
                  </td>
                  <td className="px-4 py-3 text-right text-body-medium text-on-surface font-medium">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-body-medium text-on-surface-variant"
                  >
                    No hay datos disponibles para el período seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-label-small text-on-surface-variant">
          {sortedData.length} registros
        </div>
      </CardContent>
    </Card>
  );
}
