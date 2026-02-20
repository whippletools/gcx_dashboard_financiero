'use client';

// components/charts/BillingChart.tsx
// US-007: Facturación DAC — Tabla mensual + Gráfica apilada
// Honorarios: parte inferior (azul #3B82F6)
// Resto facturación: parte superior (naranja #F97316)

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Building2 } from 'lucide-react';
import { BillingData, AduanaBilling, MonthBillingData } from '@/types/dashboard';
import { formatCurrency, formatMonthNameShort } from '@/lib/utils/formatters';
import { chartAxisColors } from '@/lib/utils/colors';

const COLOR_HONORARIOS = '#3B82F6'; // azul — parte inferior
const COLOR_RESTO      = '#F97316'; // naranja — parte superior

interface BillingChartProps {
  data: BillingData;
  title?: string;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const hon   = payload.find(p => p.dataKey === 'honorarios');
  const resto = payload.find(p => p.dataKey === 'otros');
  const total = (Number(hon?.value) || 0) + (Number(resto?.value) || 0);
  const pct   = total > 0 ? ((Number(hon?.value) || 0) / total * 100).toFixed(1) : '0.0';
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm min-w-[210px]">
      <p className="font-bold text-gray-800 mb-2">{label}</p>
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_HONORARIOS }} />
        <span className="text-gray-600">Honorarios:</span>
        <span className="font-semibold ml-auto">{formatCurrency(Number(hon?.value) || 0)}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_RESTO }} />
        <span className="text-gray-600">Resto:</span>
        <span className="font-semibold ml-auto">{formatCurrency(Number(resto?.value) || 0)}</span>
      </div>
      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
        <span className="text-gray-600">Total:</span>
        <span className="font-bold">{formatCurrency(total)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">% Honorarios:</span>
        <span className="font-bold text-blue-600">{pct}%</span>
      </div>
    </div>
  );
};

export function BillingChart({ data, title = 'Facturación DAC', className }: BillingChartProps) {
  const [selectedAduanaId, setSelectedAduanaId] = useState<string>('all');

  // Seleccionar datos de aduana o agregar todas
  const aduanaData: AduanaBilling | undefined =
    selectedAduanaId === 'all'
      ? data.aduanas.find(a => a.id === 'all') ?? data.aduanas[0]
      : data.aduanas.find(a => a.id === selectedAduanaId) ?? data.aduanas[0];

  const monthlyData: MonthBillingData[] = aduanaData?.monthlyData ?? [];
  const nonZeroMonths = monthlyData.filter(m => m.total > 0);

  const totalHonorarios = monthlyData.reduce((s, m) => s + m.honorarios, 0);
  const totalOtros      = monthlyData.reduce((s, m) => s + m.otros, 0);
  const totalGeneral    = totalHonorarios + totalOtros;
  const promedio        = nonZeroMonths.length > 0 ? totalGeneral / nonZeroMonths.length : 0;

  const chartData = monthlyData.map(m => ({
    monthName: formatMonthNameShort(m.month),
    honorarios: m.honorarios,
    otros: m.otros,
  }));

  return (
    <Card className={className}>
      {/* ── Header ── */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
            <Receipt className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-title-large">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total de facturación por todas las aduanas DAC — Periodicidad: Mensual
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              value={selectedAduanaId}
              onChange={e => setSelectedAduanaId(e.target.value)}
              className="px-2 py-1.5 bg-surface-container rounded-lg text-xs sm:text-sm text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
            >
              {data.aduanas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-muted-foreground">Total Facturado</p>
            <p className="text-lg sm:text-headline-small font-semibold">{formatCurrency(totalGeneral)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 pb-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 px-2 sm:px-4 pt-2">

          {/* ── Tabla mensual ── */}
          <div className="overflow-x-auto rounded-lg border border-outline-variant min-w-0">
            <table className="w-full min-w-[380px] text-xs sm:text-sm">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="text-left px-3 py-2 font-semibold sticky left-0 bg-blue-700 z-10">Mes</th>
                  <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">Honorarios</th>
                  <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">Resto</th>
                  <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">Total</th>
                  <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyData.map(m => (
                  <tr key={m.month} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-1.5 font-medium text-blue-700 sticky left-0 bg-white z-10 whitespace-nowrap">
                      {m.monthName}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono whitespace-nowrap text-blue-700">
                      {m.honorarios > 0 ? formatCurrency(m.honorarios) : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono whitespace-nowrap text-orange-700">
                      {m.otros > 0 ? formatCurrency(m.otros) : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold whitespace-nowrap">
                      {m.total > 0 ? formatCurrency(m.total) : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                      {m.total > 0 ? formatCurrency(promedio) : '—'}
                    </td>
                  </tr>
                ))}
                {/* Fila totales */}
                <tr className="bg-blue-50 font-bold border-t-2 border-blue-300">
                  <td className="px-3 py-2 sticky left-0 bg-blue-50 z-10">Total</td>
                  <td className="px-3 py-2 text-right font-mono text-blue-700 whitespace-nowrap">{formatCurrency(totalHonorarios)}</td>
                  <td className="px-3 py-2 text-right font-mono text-orange-700 whitespace-nowrap">{formatCurrency(totalOtros)}</td>
                  <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{formatCurrency(totalGeneral)}</td>
                  <td className="px-3 py-2 text-right font-mono text-muted-foreground whitespace-nowrap">{formatCurrency(promedio)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Gráfica apilada ── */}
          <div className="h-[260px] sm:h-[320px]">
            <div className="flex flex-wrap gap-3 mb-2 text-xs text-muted-foreground px-1">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_HONORARIOS }} />
                Azul: Honorarios (parte inferior)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_RESTO }} />
                Naranja: Resto (parte superior)
              </span>
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartAxisColors.grid} vertical={false} />
                <XAxis
                  dataKey="monthName"
                  axisLine={{ stroke: chartAxisColors.axis }}
                  tickLine={false}
                  tick={{ fill: chartAxisColors.tick, fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis
                  axisLine={{ stroke: chartAxisColors.axis }}
                  tickLine={false}
                  tick={{ fill: chartAxisColors.tick, fontSize: 10 }}
                  tickFormatter={v => `$${(v / 1_000_000).toFixed(0)}M`}
                  width={38}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: '11px', paddingBottom: 4 }}
                />
                {promedio > 0 && (
                  <ReferenceLine
                    y={promedio}
                    stroke="#6B7280"
                    strokeDasharray="5 5"
                    label={{ value: 'Prom.', position: 'right', fontSize: 10, fill: '#6B7280' }}
                  />
                )}
                {/* Honorarios abajo (azul) */}
                <Bar dataKey="honorarios" name="Honorarios" stackId="s" fill={COLOR_HONORARIOS} radius={[0, 0, 3, 3]} />
                {/* Resto arriba (naranja) */}
                <Bar dataKey="otros" name="Resto" stackId="s" fill={COLOR_RESTO} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Resumen inferior ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-outline-variant mx-2 sm:mx-4">
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <p className="text-xs text-blue-700 font-medium">Total Honorarios</p>
            <p className="text-sm sm:text-base text-blue-900 font-semibold">{formatCurrency(totalHonorarios)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-50">
            <p className="text-xs text-orange-700 font-medium">Resto Facturación</p>
            <p className="text-sm sm:text-base text-orange-900 font-semibold">{formatCurrency(totalOtros)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-600 font-medium">Promedio Mensual</p>
            <p className="text-sm sm:text-base text-gray-900 font-semibold">{formatCurrency(promedio)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
