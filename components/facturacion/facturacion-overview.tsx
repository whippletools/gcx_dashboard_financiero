'use client';

// components/facturacion/facturacion-overview.tsx
// US-007: Facturación DAC — Honorarios vs Complementarios

import { useState } from 'react';
import { BillingChart } from '@/components/charts/BillingChart';
import { useBilling } from '@/hooks';

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
      {message}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-red-500 text-sm">
      {message}
    </div>
  );
}

export function FacturacionOverview() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data, isLoading, isError } = useBilling({
    year: selectedYear,
    aduanaId: 'all',
  });

  return (
    <div className="space-y-6">
      {/* Selector de año */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">Año:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-2 bg-surface-container rounded-lg border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm w-full sm:w-auto"
        >
          {Array.from({ length: 5 }, (_, i) => currentYear - i).map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>
      </div>

      {/* Gráfica de facturación */}
      {isLoading ? (
        <LoadingState message="Cargando datos de facturación..." />
      ) : isError ? (
        <ErrorState message="Error al cargar datos de facturación." />
      ) : data ? (
        <BillingChart data={data} />
      ) : (
        <LoadingState message="Sin datos de facturación disponibles." />
      )}
    </div>
  );
}
