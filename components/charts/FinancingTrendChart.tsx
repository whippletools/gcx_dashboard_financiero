// components/charts/FinancingTrendChart.tsx
// US-004: Tendencia Financiamiento CxC DAC
// Material Design 3 Grouped Bar Chart with filters

'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Building2, Filter } from 'lucide-react';
import { FinancingTrendData, MonthFinancingData, Office, Unit } from '@/types/dashboard';
import { formatCurrency, formatMonthNameShort } from '@/lib/utils/formatters';
import { trendSeriesColors, chartAxisColors } from '@/lib/utils/colors';
import { DataTable } from '@/components/tables/DataTable';

interface FinancingTrendChartProps {
  data: FinancingTrendData;
  title?: string;
  className?: string;
  onOfficeChange?: (officeId: string) => void;
}

interface ChartDataPoint {
  month: number;
  monthName: string;
  pendingInvoice: number;
  invoiced: number;
}

export function FinancingTrendChart({
  data,
  title = 'Tendencia de Financiamiento DAC',
  className,
  onOfficeChange,
}: FinancingTrendChartProps) {
  const [selectedOffice, setSelectedOffice] = useState<string>('all');
  const [showTable, setShowTable] = useState(false);

  // Transform data for Recharts
  const chartData: ChartDataPoint[] = data.months.map((month) => ({
    month: month.month,
    monthName: formatMonthNameShort(month.month),
    pendingInvoice: month.pendingInvoice,
    invoiced: month.invoiced,
  }));

  // Calculate summary metrics
  const totalPending = data.months.reduce((sum, m) => sum + m.pendingInvoice, 0);
  const totalInvoiced = data.months.reduce((sum, m) => sum + m.invoiced, 0);
  const totalFinancing = totalPending + totalInvoiced;

  // Handle office filter change
  const handleOfficeChange = (officeId: string) => {
    setSelectedOffice(officeId);
    onOfficeChange?.(officeId);
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const pending = payload.find(p => p.dataKey === 'pendingInvoice');
      const invoiced = payload.find(p => p.dataKey === 'invoiced');

      return (
        <div className="bg-surface-container-highest border border-outline-variant rounded-lg p-3 shadow-elevation-2 min-w-[200px]">
          <p className="text-title-small text-on-surface mb-2">{label}</p>
          {pending && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: trendSeriesColors.porFacturar }} />
              <span className="text-body-medium text-on-surface-variant">Por Facturar:</span>
              <span className="text-body-medium text-on-surface font-medium">
                {formatCurrency(Number(pending.value))}
              </span>
            </div>
          )}
          {invoiced && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: trendSeriesColors.facturado }} />
              <span className="text-body-medium text-on-surface-variant">Facturado:</span>
              <span className="text-body-medium text-on-surface font-medium">
                {formatCurrency(Number(invoiced.value))}
              </span>
            </div>
          )}
          <div className="border-t border-outline-variant mt-2 pt-2">
            <div className="flex justify-between">
              <span className="text-body-medium text-on-surface-variant">Total:</span>
              <span className="text-body-medium text-on-surface font-semibold">
                {formatCurrency((Number(pending?.value) || 0) + (Number(invoiced?.value) || 0))}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Table columns
  const columns = [
    { key: 'unit', label: 'Unidad', sortable: true, width: '20%' },
    { key: 'office', label: 'Oficina', sortable: true, width: '25%' },
    { key: 'pendingInvoice', label: 'Financiado PTE', sortable: true, align: 'right' as const, format: 'currency' as const, width: '20%' },
    { key: 'invoiced', label: 'Financiado FAC', sortable: true, align: 'right' as const, format: 'currency' as const, width: '20%' },
    { key: 'month', label: 'Mes', sortable: true, align: 'center' as const, width: '15%' },
  ];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          <CardTitle className="text-title-large text-on-surface">
            {title}
          </CardTitle>
        </div>
        <div className="flex items-center gap-4">
          {/* Office Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-on-surface-variant" />
            <select
              value={selectedOffice}
              onChange={(e) => handleOfficeChange(e.target.value)}
              className="px-3 py-1.5 bg-surface-container rounded-lg text-body-medium text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todas las oficinas</option>
              {data.filters.offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <p className="text-label-medium text-on-surface-variant">Total Financiamiento</p>
            <p className="text-headline-small text-on-surface font-semibold">
              {formatCurrency(totalFinancing / 12)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid 
                strokeDasharray="4 4" 
                stroke={chartAxisColors.grid}
                vertical={false}
              />
              <XAxis 
                dataKey="monthName"
                axisLine={{ stroke: chartAxisColors.axis }}
                tickLine={{ stroke: chartAxisColors.axis }}
                tick={{ fill: chartAxisColors.tick, fontSize: 12 }}
              />
              <YAxis 
                axisLine={{ stroke: chartAxisColors.axis }}
                tickLine={{ stroke: chartAxisColors.axis }}
                tick={{ fill: chartAxisColors.tick, fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top"
                align="right"
                iconType="square"
                wrapperStyle={{ paddingBottom: '20px' }}
              />
              <Bar
                dataKey="pendingInvoice"
                name="Por Facturar"
                fill={trendSeriesColors.porFacturar}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="invoiced"
                name="Facturado"
                fill={trendSeriesColors.facturado}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Toggle Table Button */}
        <button
          onClick={() => setShowTable(!showTable)}
          className="mt-4 px-4 py-2 bg-primary-container text-on-primary-container rounded-full text-label-medium font-medium hover:bg-primary-container/80 transition-colors"
        >
          {showTable ? 'Ocultar Detalle' : 'Ver Detalle por Oficina'}
        </button>

        {/* Detail Table */}
        {showTable && (
          <div className="mt-4">
            <DataTable
              data={data.tableData.slice(0, 100)}
              columns={columns}
              title="Detalle de Financiamiento por Oficina"
              sortable
              defaultSortColumn="pendingInvoice"
              defaultSortDirection="desc"
              maxHeight="400px"
            />
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-outline-variant">
          <div className="text-center p-3 rounded-lg bg-purple-50">
            <p className="text-label-medium text-purple-700">Total Por Facturar</p>
            <p className="text-title-medium text-purple-900 font-semibold">
              {formatCurrency(totalPending)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-teal-50">
            <p className="text-label-medium text-teal-700">Total Facturado</p>
            <p className="text-title-medium text-teal-900 font-semibold">
              {formatCurrency(totalInvoiced)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-container-low">
            <p className="text-label-medium text-on-surface-variant">Promedio Mensual</p>
            <p className="text-title-medium text-on-surface font-semibold">
              {formatCurrency(totalFinancing / 12)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-container-low">
            <p className="text-label-medium text-on-surface-variant">% Facturado</p>
            <p className="text-title-medium text-on-surface font-semibold">
              {totalFinancing > 0 ? ((totalInvoiced / totalFinancing) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
