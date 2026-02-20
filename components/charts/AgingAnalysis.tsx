'use client';

// components/charts/AgingAnalysis.tsx
// US-002: Antigüedad de Cartera con PieChart + DataTable
// Material Design 3 implementation

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertTriangle } from 'lucide-react';
import { AgingData, AgingBucket, AgingDetail, AgingRange } from '@/types/dashboard';
import { formatCurrency, formatPercentage } from '@/lib/utils/formatters';
import { agingRiskColors, getAgingColor, chartColors } from '@/lib/utils/colors';
import { DataTable } from '@/components/tables/DataTable';

interface AgingAnalysisProps {
  data: AgingData;
  title?: string;
  className?: string;
}

export function AgingAnalysis({
  data,
  title = 'Antigüedad de Cartera',
  className,
}: AgingAnalysisProps) {
  const [selectedRange, setSelectedRange] = useState<AgingRange | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Filter table data by selected range
  const filteredTableData = selectedRange
    ? data.tableData.filter((row) => {
        switch (selectedRange) {
          case '1-30':
            return row.range1to30 > 0;
          case '31-60':
            return row.range31to60 > 0;
          case '61-90':
            return row.range61to90 > 0;
          case '91-120':
            return row.range91to120 > 0;
          case '121-5000':
            return row.range121plus > 0;
          default:
            return true;
        }
      })
    : data.tableData;

  // Custom Tooltip for Pie Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const bucket: AgingBucket = payload[0].payload;
      return (
        <div className="bg-surface-container-highest border border-outline-variant rounded-lg p-3 shadow-elevation-2">
          <p className="text-title-small text-on-surface mb-1">
            {agingRiskColors[bucket.range].label}
          </p>
          <p className="text-headline-small text-on-surface font-semibold">
            {formatCurrency(bucket.amount)}
          </p>
          <p className="text-body-medium text-on-surface-variant">
            {formatPercentage(bucket.percentage)} del total
          </p>
          <p className="text-label-small mt-1" style={{ color: bucket.color }}>
            Riesgo: {bucket.riskLevel === 'low' ? 'Bajo' : 
                    bucket.riskLevel === 'medium' ? 'Medio' : 
                    bucket.riskLevel === 'high' ? 'Alto' : 'Crítico'}
          </p>
        </div>
      );
    }
    return null;
  };

  // Columns for detail table (by client)
  const detailColumns = [
    { key: 'clientName', label: 'Cliente', sortable: true, width: '25%' },
    { key: 'rfc', label: 'RFC', sortable: true, width: '15%' },
    { key: 'range1to30', label: '1-30 días', sortable: true, align: 'right' as const, format: 'currency' as const, width: '12%' },
    { key: 'range31to60', label: '31-60 días', sortable: true, align: 'right' as const, format: 'currency' as const, width: '12%' },
    { key: 'range61to90', label: '61-90 días', sortable: true, align: 'right' as const, format: 'currency' as const, width: '12%' },
    { key: 'range91to120', label: '91-120 días', sortable: true, align: 'right' as const, format: 'currency' as const, width: '12%' },
    { key: 'range121plus', label: '121+ días', sortable: true, align: 'right' as const, format: 'currency' as const, width: '12%', cellClassName: 'bg-red-50 text-red-700 font-medium' },
    { key: 'total', label: 'Total', sortable: true, align: 'right' as const, format: 'currency' as const, width: '12%' },
    { key: 'branch', label: 'Sucursal', sortable: true, width: '12%' },
  ];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <CardTitle className="text-title-large text-on-surface">
            {title}
          </CardTitle>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-label-medium text-on-surface-variant">Cartera Total</p>
            <p className="text-headline-small text-on-surface font-semibold">
              {formatCurrency(data.summary.totalAmount)}
            </p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100">
            <AlertTriangle className="w-4 h-4 text-orange-700" />
            <span className="text-label-medium font-medium text-orange-700">
              {data.summary.totalClients} clientes
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Layout principal: Tabla de rangos + Pie Chart lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Tabla de rangos (como la imagen) */}
          <div>
            <div className="overflow-hidden rounded-lg border border-outline-variant">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-700 text-white">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-white">Rango</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-white">Monto</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-white">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {data.chartData.map((bucket) => (
                    <tr
                      key={bucket.range}
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                        selectedRange === bucket.range ? 'bg-muted/40' : ''
                      }`}
                      onClick={() => setSelectedRange(selectedRange === bucket.range ? null : bucket.range)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ backgroundColor: bucket.color }}
                          />
                          <span className="text-sm font-medium text-on-surface">
                            {agingRiskColors[bucket.range].label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono font-medium text-on-surface">
                        {formatCurrency(bucket.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="text-sm font-bold"
                          style={{ color: bucket.color }}
                        >
                          {bucket.percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Fila de total */}
                  <tr className="bg-muted/60 font-semibold border-t-2 border-outline-variant">
                    <td className="px-4 py-3 text-sm font-bold text-on-surface">Total General</td>
                    <td className="px-4 py-3 text-right text-sm font-mono font-bold text-on-surface">
                      {formatCurrency(data.summary.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-on-surface">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="flex flex-col items-center justify-center">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="amount"
                    nameKey="range"
                    onClick={(entry) => setSelectedRange(selectedRange === entry.range ? null : entry.range as AgingRange)}
                    label={({ percentage }) => `${percentage.toFixed(1)}%`}
                    labelLine={true}
                  >
                    {data.chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={selectedRange === entry.range ? chartColors.black : 'transparent'}
                        strokeWidth={selectedRange === entry.range ? 3 : 0}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value: string) => agingRiskColors[value as AgingRange]?.label || value}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Botón para ver detalle por cliente */}
        <div className="mt-6 pt-4 border-t border-outline-variant">
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="px-4 py-2 bg-primary-container text-on-primary-container rounded-full text-sm font-medium hover:bg-primary-container/80 transition-colors"
          >
            {showDetail ? 'Ocultar detalle por cliente' : 'Ver detalle por cliente'}
          </button>

          {showDetail && (
            <div className="mt-4">
              <DataTable
                data={filteredTableData.slice(0, 100)}
                columns={detailColumns}
                title={selectedRange ? `Clientes — ${agingRiskColors[selectedRange].label}` : 'Todos los clientes'}
                sortable
                defaultSortColumn="total"
                defaultSortDirection="desc"
                maxHeight="400px"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
