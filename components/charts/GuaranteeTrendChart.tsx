'use client';

// components/charts/GuaranteeTrendChart.tsx
// US-008: Tendencia Cartera de Garantías — Semanal, umbral 45 días
// Naranja = Vencido (parte inferior) | Azul = En Proceso (parte superior)

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GuaranteeTrendData } from '@/types/dashboard';
import { formatCurrency } from '@/lib/utils/formatters';
import { chartAxisColors } from '@/lib/utils/colors';

const COLOR_VENCIDO  = '#F97316'; // naranja
const COLOR_EN_PROCESO = '#3B82F6'; // azul

interface GuaranteeTrendChartProps {
  data: GuaranteeTrendData;
  title?: string;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const vencido   = payload.find(p => p.dataKey === 'overdue');
  const enProceso = payload.find(p => p.dataKey === 'garantiasEnProceso');
  const total = (Number(vencido?.value) || 0) + (Number(enProceso?.value) || 0);
  const pct = total > 0 ? ((Number(vencido?.value) || 0) / total * 100).toFixed(1) : '0.0';
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm min-w-[210px]">
      <p className="font-bold text-gray-800 mb-2">{label}</p>
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_VENCIDO }} />
        <span className="text-gray-600">Vencido (&gt;45 días):</span>
        <span className="font-semibold ml-auto">{formatCurrency(Number(vencido?.value) || 0)}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_EN_PROCESO }} />
        <span className="text-gray-600">En Proceso:</span>
        <span className="font-semibold ml-auto">{formatCurrency(Number(enProceso?.value) || 0)}</span>
      </div>
      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
        <span className="text-gray-600">Total:</span>
        <span className="font-bold">{formatCurrency(total)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">% Vencido:</span>
        <span className={`font-bold ${parseFloat(pct) > 20 ? 'text-red-600' : 'text-green-600'}`}>{pct}%</span>
      </div>
    </div>
  );
};

export function GuaranteeTrendChart({
  data,
  title = 'Tendencia de la Cartera de Garantías',
  className,
}: GuaranteeTrendChartProps) {
  const [showTable, setShowTable] = useState(true);

  const weeks = data.weeks ?? [];
  const latestWeek = weeks[weeks.length - 1];
  const totalPortfolio = weeks.reduce((s, w) => s + w.total, 0);
  const totalOverdue   = weeks.reduce((s, w) => s + w.overdue, 0);
  const avgOverduePct  = totalPortfolio > 0 ? (totalOverdue / totalPortfolio) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
              <Shield className="w-5 h-5 text-blue-700" />
            </div>
            <CardTitle className="text-base sm:text-title-large">{title}</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-on-surface-variant bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
              45 días vencido
            </span>
            <div className="relative group">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-help ${
                avgOverduePct > 20 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {avgOverduePct > 20
                  ? <AlertCircle className="w-3.5 h-3.5" />
                  : <CheckCircle2 className="w-3.5 h-3.5" />}
                {avgOverduePct.toFixed(1)}% Vencido
              </div>
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <p className="text-xs text-gray-800 font-medium mb-1">
                  {avgOverduePct > 20 ? '⚠️ Garantías en riesgo' : '✅ Garantías saludables'}
                </p>
                <p className="text-xs text-gray-600">
                  Del total de garantías, el{' '}
                  <span className={`font-semibold ${avgOverduePct > 20 ? 'text-red-700' : 'text-green-700'}`}>
                    {avgOverduePct.toFixed(1)}%
                  </span>{' '}
                  corresponde a garantías vencidas ({formatCurrency(totalOverdue)}) con más de 45 días, de un total de {formatCurrency(totalPortfolio)}.
                  {avgOverduePct > 20
                    ? ' Se recomienda dar seguimiento a las garantías con mayor antigüedad.'
                    : ' Las garantías se encuentran dentro de parámetros aceptables.'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 mt-2 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLOR_VENCIDO }} />
            Naranja: Vencido (parte inferior)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLOR_EN_PROCESO }} />
            Azul: En tiempo (parte superior)
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 px-2 sm:px-4">

          {/* Tabla semanal con scroll horizontal */}
          <div className="overflow-x-auto rounded-lg border border-outline-variant min-w-0">
            <table className="w-full min-w-[380px] text-xs sm:text-sm">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="text-center px-2 py-2 sm:px-3 sm:py-3 font-semibold whitespace-nowrap sticky left-0 bg-blue-700 z-10">No. Sem.</th>
                  <th className="text-right px-2 py-2 sm:px-3 sm:py-3 font-semibold whitespace-nowrap">En Proceso</th>
                  <th className="text-right px-2 py-2 sm:px-3 sm:py-3 font-semibold whitespace-nowrap">Programado</th>
                  <th className="text-right px-2 py-2 sm:px-3 sm:py-3 font-semibold whitespace-nowrap">Total</th>
                  <th className="text-right px-2 py-2 sm:px-3 sm:py-3 font-semibold">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {weeks.map((w) => (
                  <tr key={w.weekNumber} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-center font-medium text-blue-700 sticky left-0 bg-white z-10">{w.weekLabel}</td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right font-mono whitespace-nowrap">{formatCurrency(w.garantiasEnProceso)}</td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right font-mono whitespace-nowrap">{formatCurrency(w.programado)}</td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right font-mono font-semibold whitespace-nowrap">{formatCurrency(w.total)}</td>
                    <td className={`px-2 py-1.5 sm:px-3 sm:py-2 text-right font-bold ${
                      w.overduePercentage > 20 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {w.overduePercentage.toFixed(0)}%
                    </td>
                  </tr>
                ))}
                {weeks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">
                      Sin datos disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Gráfica apilada */}
          <div className="h-[260px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeks} margin={{ top: 10, right: 8, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartAxisColors.grid} vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  axisLine={{ stroke: chartAxisColors.axis }}
                  tickLine={false}
                  tick={{ fill: chartAxisColors.tick, fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  interval={1}
                />
                <YAxis
                  axisLine={{ stroke: chartAxisColors.axis }}
                  tickLine={false}
                  tick={{ fill: chartAxisColors.tick, fontSize: 10 }}
                  tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
                  width={36}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 6, fontSize: '11px' }}
                />
                <Bar dataKey="overdue" name="Vencido" stackId="s" fill={COLOR_VENCIDO} radius={[0, 0, 3, 3]} />
                <Bar dataKey="garantiasEnProceso" name="En Proceso" stackId="s" fill={COLOR_EN_PROCESO} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resumen inferior */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-outline-variant mx-2 sm:mx-4">
          <div className="text-center p-3 rounded-lg bg-orange-50">
            <p className="text-xs sm:text-label-medium text-orange-700">Total Vencido</p>
            <p className="text-sm sm:text-title-medium text-orange-900 font-semibold">{formatCurrency(totalOverdue)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <p className="text-xs sm:text-label-medium text-blue-700">Total En Proceso</p>
            <p className="text-sm sm:text-title-medium text-blue-900 font-semibold">{formatCurrency(totalPortfolio - totalOverdue)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-50">
            <p className="text-xs sm:text-label-medium text-gray-600">Cartera Última Semana</p>
            <p className="text-sm sm:text-title-medium text-gray-900 font-semibold">{formatCurrency(latestWeek?.total || 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
