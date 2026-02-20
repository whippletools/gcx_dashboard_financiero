'use client';

// components/garantias/garantias-overview.tsx
// US-005: Estatus de Garantías (tabla resumen + tabla semanal + gráfica)
// US-008: Tendencia Cartera de Garantías (vencido vs en tiempo)

import { useState } from 'react';
import { GuaranteeStatusChart } from '@/components/charts/GuaranteeStatusChart';
import { GuaranteeTrendChart } from '@/components/charts/GuaranteeTrendChart';
import { useGuaranteeStatus, useGuaranteeTrend } from '@/hooks';

export function GarantiasOverview() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // US-005: Estatus de Garantías (fn_Garantias_Estatus)
  const { data: statusData, isLoading: isLoadingStatus, isError: isErrorStatus } = useGuaranteeStatus({
    year: selectedYear,
    idEmpresa: 1,
  });

  // US-008: Tendencia Cartera de Garantías (fn_GarantiasPorCobrar)
  const { data: trendData, isLoading: isLoadingTrend, isError: isErrorTrend } = useGuaranteeTrend({
    year: selectedYear,
    idEmpresa: 1,
  });

  return (
    <div className="space-y-8">

      {/* Selector de año */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">Año:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-2 bg-surface-container rounded-lg border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          {Array.from({ length: 5 }, (_, i) => currentYear - i).map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>
      </div>

      {/* US-005: Estatus de Garantías — resumen + tabla semanal + gráfica */}
      <section>
        {isLoadingStatus ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Cargando estatus de garantías...
          </div>
        ) : isErrorStatus ? (
          <div className="flex items-center justify-center h-64 text-red-500 text-sm">
            Error al cargar estatus de garantías.
          </div>
        ) : statusData ? (
          <GuaranteeStatusChart data={statusData} year={selectedYear} />
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Sin datos de estatus de garantías disponibles.
          </div>
        )}
      </section>

      {/* US-008: Tendencia Cartera de Garantías (vencido vs en tiempo) */}
      <section>
        {isLoadingTrend ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Cargando tendencia de cartera de garantías...
          </div>
        ) : isErrorTrend ? (
          <div className="flex items-center justify-center h-64 text-red-500 text-sm">
            Error al cargar tendencia de garantías.
          </div>
        ) : trendData ? (
          <GuaranteeTrendChart data={trendData} />
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Sin datos de tendencia de garantías disponibles.
          </div>
        )}
      </section>

    </div>
  );
}
