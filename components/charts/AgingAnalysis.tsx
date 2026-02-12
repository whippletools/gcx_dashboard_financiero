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

  // Table columns definition
  const columns = [
    {
      key: 'clientName',
      label: 'Cliente',
      sortable: true,
      width: '25%',
    },
    {
      key: 'rfc',
      label: 'RFC',
      sortable: true,
      width: '15%',
    },
    {
      key: 'range1to30',
      label: '1-30 días',
      sortable: true,
      align: 'right' as const,
      format: 'currency' as const,
      width: '12%',
    },
    {
      key: 'range31to60',
      label: '31-60 días',
      sortable: true,
      align: 'right' as const,
      format: 'currency' as const,
      width: '12%',
    },
    {
      key: 'range61to90',
      label: '61-90 días',
      sortable: true,
      align: 'right' as const,
      format: 'currency' as const,
      width: '12%',
    },
    {
      key: 'range91to120',
      label: '91-120 días',
      sortable: true,
      align: 'right' as const,
      format: 'currency' as const,
      width: '12%',
    },
    {
      key: 'range121plus',
      label: '121+ días',
      sortable: true,
      align: 'right' as const,
      format: 'currency' as const,
      width: '12%',
      cellClassName: 'bg-red-50 text-red-700 font-medium',
    },
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Pie Chart */}
          <div className="lg:col-span-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="amount"
                    nameKey="range"
                    onClick={(entry) => setSelectedRange(entry.range as AgingRange)}
                    label={({ range, percentage }) => 
                      `${agingRiskColors[range as AgingRange].label}: ${percentage.toFixed(1)}%`
                    }
                    labelLine={false}
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
            
            {/* Range Filter Buttons */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              <button
                onClick={() => setSelectedRange(null)}
                className={`px-3 py-1.5 rounded-full text-label-medium transition-colors ${
                  selectedRange === null
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Todos
              </button>
              {data.chartData.map((bucket) => (
                <button
                  key={bucket.range}
                  onClick={() => setSelectedRange(bucket.range)}
                  className={`px-3 py-1.5 rounded-full text-label-medium transition-colors border ${
                    selectedRange === bucket.range
                      ? 'border-2 font-medium'
                      : 'border hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: selectedRange === bucket.range ? bucket.color : 'transparent',
                    borderColor: bucket.color,
                    color: selectedRange === bucket.range ? 'white' : bucket.color,
                  }}
                >
                  {agingRiskColors[bucket.range].label}
                </button>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="lg:col-span-3">
            <DataTable
              data={filteredTableData.slice(0, 50)} // Limit to top 50 clients
              columns={columns}
              title={selectedRange ? `Clientes - ${agingRiskColors[selectedRange].label}` : 'Detalle por Cliente'}
              sortable
              defaultSortColumn="total"
              defaultSortDirection="desc"
              maxHeight="400px"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-4 border-t border-outline-variant">
          {data.chartData.map((bucket) => (
            <div 
              key={bucket.range}
              className="text-center p-3 rounded-lg bg-surface-container-low"
              style={{ 
                borderLeft: `4px solid ${bucket.color}`,
              }}
            >
              <p className="text-label-medium text-on-surface-variant">
                {agingRiskColors[bucket.range].label}
              </p>
              <p className="text-title-medium text-on-surface font-semibold">
                {formatCurrency(bucket.amount)}
              </p>
              <p className="text-label-small text-on-surface-variant">
                {bucket.percentage.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
