'use client';

// components/financiamiento/financiamiento-overview.tsx
// US-004: Tendencia Financiamiento CxC DAC

import { useState } from 'react';
import { FinancingTrendChart } from '@/components/charts/FinancingTrendChart';
import { useFinancingTrend } from '@/hooks';

export function FinanciamientoOverview() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedOffice, setSelectedOffice] = useState<string | undefined>(undefined);

  const { data, isLoading, isError } = useFinancingTrend({
    year: selectedYear,
    idEmpresa: 1,
    officeId: selectedOffice,
  });

  return (
    <div className="space-y-6">

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-4">
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

        {data?.filters?.offices && data.filters.offices.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Oficina:</label>
            <select
              value={selectedOffice || 'all'}
              onChange={(e) => setSelectedOffice(e.target.value === 'all' ? undefined : e.target.value)}
              className="px-3 py-2 bg-surface-container rounded-lg border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="all">Todas las Oficinas</option>
              {data.filters.offices.map((office) => (
                <option key={office.id} value={office.id}>{office.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* US-004: Tendencia Financiamiento */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          Cargando tendencia de financiamiento — consultando mes a mes...
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center h-64 text-red-500 text-sm">
          Error al cargar datos de financiamiento.
        </div>
      ) : data ? (
        <FinancingTrendChart
          data={data}
          onOfficeChange={(officeId) => setSelectedOffice(officeId === 'all' ? undefined : officeId)}
        />
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          Sin datos de financiamiento disponibles.
        </div>
      )}

    </div>
  );
}
