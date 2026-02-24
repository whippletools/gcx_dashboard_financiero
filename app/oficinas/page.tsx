'use client';

import { OfficeSummaryTable } from '@/components/oficinas/OfficeSummaryTable';
import { useOfficeSummary } from '@/hooks/useOfficeSummary';

export const dynamic = 'force-dynamic';

export default function OficinasPage() {
  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading, isError } = useOfficeSummary({
    fechaCorte: today,
    idEmpresa: 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Oficinas</h1>
        <p className="text-muted-foreground text-pretty">
          Resumen corporativo de cartera por oficina — Antigüedad, Saldo DAC, Cobrado y Vencido
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Cargando resumen por oficinas...
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">
          Error al cargar resumen por oficinas.
        </div>
      ) : data ? (
        <OfficeSummaryTable data={data} />
      ) : (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Sin datos disponibles.
        </div>
      )}
    </div>
  );
}
