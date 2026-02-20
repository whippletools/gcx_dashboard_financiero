'use client';

// components/charts/BillingChart.tsx
// US-007: Facturación DAC (Honorarios vs Resto)
// Material Design 3 Stacked Bar Chart implementation
// Honorarios: parte inferior (azul), Resto: parte superior (negro)

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
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Building2, TrendingUp } from 'lucide-react';
import { BillingData, AduanaBilling, MonthBillingData } from '@/types/dashboard';
import { formatCurrency, formatMonthNameShort } from '@/lib/utils/formatters';
import { trendSeriesColors, chartColors, chartAxisColors } from '@/lib/utils/colors';

interface BillingChartProps {
  data: BillingData;
  title?: string;
  className?: string;
  selectedAduana?: string;
  onAduanaChange?: (aduanaId: string) => void;
}

interface ChartDataPoint {
  month: number;
  monthName: string;
  honorarios: number;
  otros: number;
  total: number;
}

export function BillingChart({
  data,
  title = 'Facturación por Aduana DAC',
  className,
  selectedAduana = 'all',
  onAduanaChange,
}: BillingChartProps) {
  const [selectedAduanaId, setSelectedAduanaId] = useState<string>(selectedAduana);

  // Get selected aduana data or aggregate all
  const aduanaData = selectedAduanaId === 'all' 
    ? aggregateAllAduanas(data.aduanas)
    : data.aduanas.find(a => a.id === selectedAduanaId) || data.aduanas[0];

  // Transform data for Recharts
  const chartData: ChartDataPoint[] = aduanaData?.monthlyData.map((month) => ({
    month: month.month,
    monthName: formatMonthNameShort(month.month),
    honorarios: month.honorarios,
    otros: month.otros,
    total: month.total,
  })) || [];

  // Calculate metrics
  const totalHonorarios = aduanaData?.totalHonorarios || 0;
  const totalOtros = aduanaData?.totalOtros || 0;
  const totalGeneral = totalHonorarios + totalOtros;
  const average = totalGeneral > 0 ? totalGeneral / 12 : 0;
  const honorariosPercentage = totalGeneral > 0 ? (totalHonorarios / totalGeneral) * 100 : 0;

  // Handle aduana change
  const handleAduanaChange = (aduanaId: string) => {
    setSelectedAduanaId(aduanaId);
    onAduanaChange?.(aduanaId);
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const honorarios = payload.find(p => p.dataKey === 'honorarios');
      const otros = payload.find(p => p.dataKey === 'otros');
      const total = (Number(honorarios?.value) || 0) + (Number(otros?.value) || 0);

      return (
        <div className="bg-surface-container-highest border border-outline-variant rounded-lg p-3 shadow-elevation-2 min-w-[200px]">
          <p className="text-title-small text-on-surface mb-2">{label}</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: trendSeriesColors.honorarios }} />
            <span className="text-body-medium text-on-surface-variant">Honorarios:</span>
            <span className="text-body-medium text-on-surface font-medium">
              {formatCurrency(Number(honorarios?.value))}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: trendSeriesColors.otros }} />
            <span className="text-body-medium text-on-surface-variant">Otros:</span>
            <span className="text-body-medium text-on-surface font-medium">
              {formatCurrency(Number(otros?.value))}
            </span>
          </div>
          <div className="border-t border-outline-variant mt-2 pt-2">
            <div className="flex justify-between">
              <span className="text-body-medium text-on-surface-variant">Total:</span>
              <span className="text-body-medium text-on-surface font-semibold">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary flex-shrink-0" />
          <CardTitle className="text-base sm:text-title-large text-on-surface">
            {title}
          </CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
            <select
              value={selectedAduanaId}
              onChange={(e) => handleAduanaChange(e.target.value)}
              className="px-2 py-1.5 bg-surface-container rounded-lg text-xs sm:text-body-medium text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
            >
              <option value="all">Todas las aduanas</option>
              {data.aduanas.map((aduana) => (
                <option key={aduana.id} value={aduana.id}>
                  {aduana.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:text-right">
            <p className="text-label-medium text-on-surface-variant">Total Facturado</p>
            <p className="text-lg sm:text-headline-small text-on-surface font-semibold">
              {formatCurrency(totalGeneral)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {/* Chart */}
        <div className="h-[280px] sm:h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 40, right: 30, left: 20, bottom: 20 }}
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
              {/* Línea de promedio */}
              <ReferenceLine 
                y={average} 
                stroke={chartColors.orange}
                strokeDasharray="5 5"
                label={{
                  value: `Promedio: ${formatCurrency(average)}`,
                  position: 'right',
                  fill: chartColors.orange,
                  fontSize: 12,
                }}
              />
              {/* Honorarios - parte inferior (azul) */}
              <Bar
                dataKey="honorarios"
                name="Honorarios"
                stackId="billing"
                fill={trendSeriesColors.honorarios}
                radius={[0, 0, 4, 4]}
              />
              {/* Otros - parte superior (negro/gris oscuro) */}
              <Bar
                dataKey="otros"
                name="Otros Conceptos"
                stackId="billing"
                fill={trendSeriesColors.otros}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-4 border-t border-outline-variant">
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <p className="text-label-medium text-blue-700">Total Honorarios</p>
            <p className="text-title-medium text-blue-900 font-semibold">
              {formatCurrency(totalHonorarios)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-100">
            <p className="text-label-medium text-gray-700">Otros Conceptos</p>
            <p className="text-title-medium text-gray-900 font-semibold">
              {formatCurrency(totalOtros)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-container-low">
            <p className="text-label-medium text-on-surface-variant">Promedio Mensual</p>
            <p className="text-title-medium text-on-surface font-semibold">
              {formatCurrency(average)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-50">
            <p className="text-label-medium text-orange-700">% Honorarios</p>
            <p className="text-title-medium text-orange-900 font-semibold">
              {honorariosPercentage.toFixed(1)}%
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-container-low">
            <p className="text-label-medium text-on-surface-variant">Aduanas</p>
            <p className="text-title-medium text-on-surface font-semibold">
              {data.aduanas.length}
            </p>
          </div>
        </div>

        {/* Tabla de aduanas */}
        {selectedAduanaId === 'all' && (
          <div className="mt-6 overflow-auto rounded-lg border border-outline-variant">
            <table className="w-full min-w-[600px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-blue-700">
                  <th className="px-4 py-3 text-left text-label-medium font-semibold text-white">
                    Aduana
                  </th>
                  <th className="px-4 py-3 text-right text-label-medium font-semibold text-white">
                    Honorarios
                  </th>
                  <th className="px-4 py-3 text-right text-label-medium font-semibold text-white">
                    Otros
                  </th>
                  <th className="px-4 py-3 text-right text-label-medium font-semibold text-white">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-label-medium font-semibold text-white">
                    Promedio
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface">
                {data.aduanas.slice(0, 10).map((aduana) => (
                  <tr key={aduana.id} className="hover:bg-surface-container transition-colors">
                    <td className="px-4 py-3 text-body-medium text-on-surface font-medium">
                      {aduana.name}
                    </td>
                    <td className="px-4 py-3 text-right text-body-medium text-on-surface">
                      {formatCurrency(aduana.totalHonorarios)}
                    </td>
                    <td className="px-4 py-3 text-right text-body-medium text-on-surface">
                      {formatCurrency(aduana.totalOtros)}
                    </td>
                    <td className="px-4 py-3 text-right text-body-medium text-on-surface font-semibold">
                      {formatCurrency(aduana.totalHonorarios + aduana.totalOtros)}
                    </td>
                    <td className="px-4 py-3 text-right text-body-medium text-on-surface-variant">
                      {formatCurrency(aduana.average)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Agrega datos de todas las aduanas en uno solo
 */
function aggregateAllAduanas(aduanas: AduanaBilling[]): AduanaBilling {
  const aggregatedMonthlyData: MonthBillingData[] = [];

  for (let month = 1; month <= 12; month++) {
    let monthHonorarios = 0;
    let monthOtros = 0;

    aduanas.forEach((aduana) => {
      const monthData = aduana.monthlyData.find(m => m.month === month);
      if (monthData) {
        monthHonorarios += monthData.honorarios;
        monthOtros += monthData.otros;
      }
    });

    aggregatedMonthlyData.push({
      month,
      monthName: formatMonthNameShort(month),
      honorarios: monthHonorarios,
      otros: monthOtros,
      total: monthHonorarios + monthOtros,
    });
  }

  const totalHonorarios = aduanas.reduce((sum, a) => sum + a.totalHonorarios, 0);
  const totalOtros = aduanas.reduce((sum, a) => sum + a.totalOtros, 0);

  return {
    id: 'all',
    name: 'Todas las Aduanas',
    monthlyData: aggregatedMonthlyData,
    average: (totalHonorarios + totalOtros) / 12,
    totalHonorarios,
    totalOtros,
  };
}
