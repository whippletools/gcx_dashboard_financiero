'use client';

// components/cartera/cartera-overview.tsx
// US-002: Antigüedad de Cartera - Página dedicada

import { AgingAnalysis } from '@/components/charts/AgingAnalysis';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useAgingData } from '@/hooks';

export function CarteraOverview() {
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: agingData, isLoading, isError } = useAgingData({
    fechaCorte: todayStr,
    idEmpresa: 1,
  });

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {isError ? (
        <div className="flex items-center justify-center h-64 text-red-500">
          Error al cargar datos de cartera. Intenta de nuevo.
        </div>
      ) : agingData ? (
        <AgingAnalysis data={agingData} />
      ) : (
        <div className="flex items-center justify-center h-64 text-on-surface-variant">
          Sin datos de antigüedad disponibles
        </div>
      )}
    </div>
  );
}
