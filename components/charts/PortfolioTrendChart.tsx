'use client';

// components/charts/PortfolioTrendChart.tsx
// US-003: Tendencia Cartera CXC (Vencido vs En tiempo)
// Material Design 3 Stacked Bar Chart implementation

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
import { BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PortfolioTrendData, MonthPortfolioData } from '@/types/dashboard';
import { formatCurrency, formatPercentage, formatMonthNameShort } from '@/lib/utils/formatters';
import { trendSeriesColors, chartAxisColors } from '@/lib/utils/colors';
import { DataTable } from '@/components/tables/DataTable';

interface PortfolioTrendChartProps {
  data: PortfolioTrendData;
  title?: string;
  className?: string;
}

interface ChartDataPoint {
  month: number;
  monthName: string;
  overdue: number;
  onTime: number;
  total: number;
  overduePercentage: number;
}

export function PortfolioTrendChart({
  data,
  title = 'Tendencia de la Cartera CXC',
  className,
}: PortfolioTrendChartProps) {
  const [showTable, setShowTable] = useState(false);

  // Transform data for Recharts
  const chartData: ChartDataPoint[] = data.months.map((month) => ({
    month: month.month,
    monthName: formatMonthNameShort(month.month),
    overdue: month.overdue,
    onTime: month.onTime,
    total: month.total,
    overduePercentage: month.overduePercentage,
  }));

  // Calculate summary metrics
  const latestMonth = data.months[data.months.length - 1];
  const totalPortfolio = data.months.reduce((sum, m) => sum + m.total, 0);
  const totalOverdue = data.months.reduce((sum, m) => sum + m.overdue, 0);
  const avgOverduePercentage = totalPortfolio > 0 ? (totalOverdue / totalPortfolio) * 100 : 0;

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const overdue = payload.find(p => p.dataKey === 'overdue');
      const onTime = payload.find(p => p.dataKey === 'onTime');
      const monthIndex = chartData.findIndex(d => d.monthName === label) + 1;
      const monthData = data.months.find(m => m.month === monthIndex);

      return (
        <div className="bg-surface-container-highest border border-outline-variant rounded-lg p-3 shadow-elevation-2 min-w-[200px]">
          <p className="text-title-small text-on-surface mb-2">
            {formatMonthNameShort(monthIndex)}
          </p>
          {overdue && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: trendSeriesColors.vencido }} />
              <span className="text-body-medium text-on-surface-variant">Vencido:</span>
              <span className="text-body-medium text-on-surface font-medium">
                {formatCurrency(Number(overdue.value))}
              </span>
            </div>
          )}
          {onTime && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: trendSeriesColors.enTiempo }} />
              <span className="text-body-medium text-on-surface-variant">En tiempo:</span>
              <span className="text-body-medium text-on-surface font-medium">
                {formatCurrency(Number(onTime.value))}
              </span>
            </div>
          )}
          <div className="border-t border-outline-variant mt-2 pt-2">
            <div className="flex justify-between">
              <span className="text-body-medium text-on-surface-variant">Total:</span>
              <span className="text-body-medium text-on-surface font-semibold">
                {formatCurrency(monthData?.total || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-medium text-on-surface-variant">% Vencido:</span>
              <span className={`text-body-medium font-semibold ${
                (monthData?.overduePercentage || 0) > 20 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatPercentage(monthData?.overduePercentage || 0)}
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
    { key: 'clientName', label: 'Cliente', sortable: true, width: '25%' },
    { key: 'rfc', label: 'RFC', sortable: true, width: '15%' },
    { key: 'onTime', label: 'En Tiempo', sortable: true, align: 'right' as const, format: 'currency' as const, width: '15%' },
    { key: 'overdue', label: 'Vencido', sortable: true, align: 'right' as const, format: 'currency' as const, width: '15%' },
    { key: 'total', label: 'Total', sortable: true, align: 'right' as const, format: 'currency' as const, width: '15%' },
    { key: 'branch', label: 'Sucursal', sortable: true, width: '15%' },
  ];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <CardTitle className="text-title-large text-on-surface">
            {title}
          </CardTitle>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-label-medium text-on-surface-variant">Cartera Total (Promedio)</p>
            <p className="text-headline-small text-on-surface font-semibold">
              {formatCurrency(totalPortfolio / 12)}
            </p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
            avgOverduePercentage > 20 ? 'bg-red-100' : 'bg-green-100'
          }`}>
            {avgOverduePercentage > 20 ? (
              <AlertCircle className="w-4 h-4 text-red-700" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-700" />
            )}
            <span className={`text-label-medium font-medium ${
              avgOverduePercentage > 20 ? 'text-red-700' : 'text-green-700'
            }`}>
              {avgOverduePercentage.toFixed(1)}% Vencido
            </span>
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
                dataKey="overdue"
                name="Vencido"
                stackId="portfolio"
                fill={trendSeriesColors.vencido}
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="onTime"
                name="En Tiempo"
                stackId="portfolio"
                fill={trendSeriesColors.enTiempo}
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
          {showTable ? 'Ocultar Detalle' : 'Ver Detalle por Cliente'}
        </button>

        {/* Detail Table */}
        {showTable && (
          <div className="mt-4">
            <DataTable
              data={data.tableData.slice(0, 100)}
              columns={columns}
              title="Detalle de Cartera por Cliente"
              sortable
              defaultSortColumn="total"
              defaultSortDirection="desc"
              maxHeight="400px"
            />
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-outline-variant">
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <p className="text-label-medium text-blue-700">Total Vencido</p>
            <p className="text-title-medium text-blue-900 font-semibold">
              {formatCurrency(totalOverdue)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-50">
            <p className="text-label-medium text-orange-700">Total En Tiempo</p>
            <p className="text-title-medium text-orange-900 font-semibold">
              {formatCurrency(totalPortfolio - totalOverdue)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-container-low">
            <p className="text-label-medium text-on-surface-variant">Cartera Actual</p>
            <p className="text-title-medium text-on-surface font-semibold">
              {formatCurrency(latestMonth?.total || 0)}
            </p>
          </div>
          <div className={`text-center p-3 rounded-lg ${
            (latestMonth?.overduePercentage || 0) > 20 ? 'bg-red-50' : 'bg-green-50'
          }`}>
            <p className={`text-label-medium ${
              (latestMonth?.overduePercentage || 0) > 20 ? 'text-red-700' : 'text-green-700'
            }`}>
              % Vencido Actual
            </p>
            <p className={`text-title-medium font-semibold ${
              (latestMonth?.overduePercentage || 0) > 20 ? 'text-red-900' : 'text-green-900'
            }`}>
              {formatPercentage(latestMonth?.overduePercentage || 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
