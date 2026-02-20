'use client';

// components/cobranza/cobranza-overview.tsx
// US-001: Tendencia de Cobrado - Página dedicada

import { useState } from 'react';
import { CollectionTrendChart } from '@/components/charts/CollectionTrendChart';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useCollectionTrend } from '@/hooks';

export function CobranzaOverview() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: collectionData, isLoading, isError } = useCollectionTrend({
    year: selectedYear,
    idEmpresa: 1,
  });

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Selector de año */}
      <div className="flex items-center gap-4">
        <label className="text-body-medium text-on-surface-variant font-medium">Año:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-2 bg-surface-container rounded-lg border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {Array.from({ length: 5 }, (_, i) => currentYear - i).map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>
      </div>

      {isError ? (
        <div className="flex items-center justify-center h-64 text-red-500">
          Error al cargar datos de cobranza. Intenta de nuevo.
        </div>
      ) : collectionData ? (
        <CollectionTrendChart data={collectionData} />
      ) : (
        <div className="flex items-center justify-center h-64 text-on-surface-variant">
          Sin datos de cobranza disponibles para {selectedYear}
        </div>
      )}
    </div>
  );
}
