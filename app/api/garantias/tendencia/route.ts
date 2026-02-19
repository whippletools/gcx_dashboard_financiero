// app/api/garantias/tendencia/route.ts
// API Route para US-008: Tendencia Cartera de Garantías
// GET /api/garantias/tendencia?year=2026&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryWithRetry } from '@/lib/reco-api';
import { GuaranteeTrendData, MonthGuaranteeTrend, GuaranteeTrendDetail } from '@/types/dashboard';
import { formatMonthName } from '@/lib/utils/formatters';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const idEmpresa = parseInt(searchParams.get('idEmpresa') || '1');

    if (isNaN(year) || isNaN(idEmpresa)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos. Se requiere year y idEmpresa numéricos.' },
        { status: 400 }
      );
    }

    // Consultas por mes para garantías - limitado a 6 meses
    const months: MonthGuaranteeTrend[] = [];
    const tableDetails: GuaranteeTrendDetail[] = [];
    const BATCH_SIZE = 1;
    const MAX_MONTHS = 6; // Limitar a semestre para evitar timeouts

    for (let batchStart = 1; batchStart <= MAX_MONTHS; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, 12);
      const batchPromises = [];

      for (let month = batchStart; month <= batchEnd; month++) {
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
        
        const query = `
          SELECT
            sProveedor AS Nombre,
            CASE WHEN DiasTranscurridos < 1 THEN Saldo ELSE 0 END AS Vigente,
            CASE WHEN DiasTranscurridos >= 1 THEN Saldo ELSE 0 END AS Vencido,
            Saldo,
            sNombreSucursal AS Sucursal
          FROM dbo.fn_GarantiasPorCobrar('${endDate}', ${idEmpresa})
        `;
        
        batchPromises.push(
          executeQueryWithRetry(query, { useCache: true, retries: 1 })
            .then(result => ({ month, result }))
            .catch(error => {
              console.error(`[GARANTIAS-TENDENCIA] Error mes ${month}:`, error);
              return { month, result: { success: false, data: [] } };
            })
        );
      }

      // Ejecutar batch
      const batchResults = await Promise.all(batchPromises);

      // Procesar resultados del batch
      for (const { month, result } of batchResults) {
        const monthData = result.success ? (result.data || []) : [];

        const totalPortfolio = monthData.reduce((sum, item) => sum + (item.Saldo || 0), 0);
        const totalOverdue = monthData.reduce((sum, item) => sum + (item.Vencido || 0), 0);
        const onTime = totalPortfolio - totalOverdue;
        const overduePercentage = totalPortfolio > 0 ? (totalOverdue / totalPortfolio) * 100 : 0;

        months.push({
          month,
          monthName: formatMonthName(month),
          overdue: Math.round(totalOverdue * 100) / 100,
          onTime: Math.round(onTime * 100) / 100,
          total: Math.round(totalPortfolio * 100) / 100,
          overduePercentage: Math.round(overduePercentage * 100) / 100,
        });

        // Detalles por proveedor
        monthData.forEach((item: any) => {
          tableDetails.push({
            providerName: item.Nombre || 'Sin Proveedor',
            onTime: Math.round((item.Vigente || 0) * 100) / 100,
            overdue: Math.round((item.Vencido || 0) * 100) / 100,
            total: Math.round((item.Saldo || 0) * 100) / 100,
            branch: item.Sucursal || 'Sin Sucursal',
            month,
          });
        });
      }

      // Pausa entre batches
      if (batchEnd < 12) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const response: GuaranteeTrendData = {
      months,
      tableData: tableDetails,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/garantias/tendencia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
