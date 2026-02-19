// app/api/facturacion/route.ts
// API Route para US-007: Facturación DAC (Honorarios vs Resto)
// GET /api/facturacion?year=2024&aduanaId=ADU001

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryWithRetry } from '@/lib/reco-api';
import { BillingData, MonthBillingData, AduanaBilling } from '@/types/dashboard';
import { formatMonthName } from '@/lib/utils/formatters';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const aduanaId = searchParams.get('aduanaId');

    if (isNaN(year)) {
      return NextResponse.json(
        { error: 'Parámetro year inválido.' },
        { status: 400 }
      );
    }

    // Obtener lista de aduanas usando API RECO (GROUP BY en vez de DISTINCT)
    const aduanasQuery = `
      SELECT Unidad AS aduana
      FROM dbo.fn_CuentasPorCobrar_Excel('${year}-12-31', 1)
      WHERE Unidad IS NOT NULL AND TipoCliente = 'Externo'
      GROUP BY Unidad
    `;

    console.log(`[FACTURACION] Query aduanas (limitado a 20)`);
    
    const aduanasResult = await executeQueryWithRetry(aduanasQuery, { useCache: true, retries: 1 });
    const uniqueAduanas = (aduanasResult.data || []).map((row: any) => row.aduana || row.Unidad).filter(Boolean);

    // Optimización: Consultas batch por mes - limitado a 6 meses
    const monthlyTotals: MonthBillingData[] = [];
    const BATCH_SIZE = 1;
    const MAX_MONTHS = 6; // Limitar a semestre para evitar timeouts

    for (let batchStart = 1; batchStart <= MAX_MONTHS; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, 12);
      const batchPromises = [];

      for (let month = batchStart; month <= batchEnd; month++) {
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
        
        // Query agregada por todas las aduanas
        const aduanaFilter = aduanaId && aduanaId !== 'all' ? `AND Unidad = '${aduanaId}'` : '';
        const query = `
          SELECT 
            SUM(Honorarios) AS TotalHonorarios,
            SUM(Complementarios) AS TotalComplementos
          FROM dbo.fn_CuentasPorCobrar_Excel('${endDate}', 1)
          WHERE TipoCliente = 'Externo' ${aduanaFilter}
        `;

        batchPromises.push(
          executeQueryWithRetry(query, { useCache: true, retries: 1 })
            .then(result => ({ month, result }))
            .catch(error => {
              console.error(`[FACTURACION] Error mes ${month}:`, error);
              return { month, result: { success: false, data: [] } };
            })
        );
      }

      const batchResults = await Promise.all(batchPromises);

      for (const { month, result } of batchResults) {
        const data = result.success ? (result.data || []) : [];
        const honorarios = data.reduce((sum, item) => sum + (item.TotalHonorarios || 0), 0);
        const otros = data.reduce((sum, item) => sum + (item.TotalComplementos || 0), 0);

        monthlyTotals.push({
          month,
          monthName: formatMonthName(month),
          honorarios: Math.round(honorarios * 100) / 100,
          otros: Math.round(otros * 100) / 100,
          total: Math.round((honorarios + otros) * 100) / 100,
        });
      }

      if (batchEnd < 12) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Construir respuesta simplificada
    const aduanaName = aduanaId && aduanaId !== 'all' ? aduanaId : 'Todas las Aduanas';
    const totalHonorarios = monthlyTotals.reduce((sum, m) => sum + m.honorarios, 0);
    const totalOtros = monthlyTotals.reduce((sum, m) => sum + m.otros, 0);

    const aduanas: AduanaBilling[] = [{
      id: aduanaName,
      name: aduanaName,
      monthlyData: monthlyTotals.sort((a, b) => a.month - b.month),
      average: (totalHonorarios + totalOtros) / 12,
      totalHonorarios: Math.round(totalHonorarios * 100) / 100,
      totalOtros: Math.round(totalOtros * 100) / 100,
    }];

    const months: string[] = monthlyTotals.map(m => m.monthName);

    const response: BillingData = {
      aduanas,
      months,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/facturacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
