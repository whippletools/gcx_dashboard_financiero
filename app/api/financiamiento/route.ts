// app/api/financiamiento/route.ts
// API Route para US-004: Tendencia Financiamiento CxC DAC
// GET /api/financiamiento?year=2026&idEmpresa=1&officeId=DAC001

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryWithRetry } from '@/lib/reco-api';
import { FinancingTrendData, MonthFinancingData, FinancingDetail, Office, Unit } from '@/types/dashboard';
import { formatMonthName } from '@/lib/utils/formatters';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const idEmpresa = parseInt(searchParams.get('idEmpresa') || '1');
    const officeId = searchParams.get('officeId');

    if (isNaN(year) || isNaN(idEmpresa)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos. Se requiere year y idEmpresa numéricos.' },
        { status: 400 }
      );
    }

    // Obtener lista de oficinas usando API RECO (con retry)
    const officesQuery = `
      SELECT TOP 20 Unidad AS id, Unidad AS name
      FROM dbo.fn_CuentasPorCobrar_Excel(EOMONTH(DATEFROMPARTS(${year}, 12, 1)), ${idEmpresa})
      WHERE Unidad IS NOT NULL AND TipoCliente = 'Externo'
      GROUP BY Unidad
    `;
    
    console.log(`[FINANCIAMIENTO] Query oficinas (limitado a 20)`);

    const officesResult = await executeQueryWithRetry(officesQuery, { useCache: true, retries: 1 });
    const offices: Office[] = (officesResult.data || []).map((row: any, index: number) => ({
      id: row.id || `office-${index}`,
      name: row.name || 'Sin Oficina',
    }));

    const units: Unit[] = [
      { id: 'all', name: 'Todas las Unidades' },
    ];

    // Consultas por mes para financiamiento - limitado a 6 meses
    const months: MonthFinancingData[] = [];
    const tableDetails: FinancingDetail[] = [];
    const BATCH_SIZE = 1;
    const MAX_MONTHS = 6; // Limitar a semestre para evitar timeouts

    for (let batchStart = 1; batchStart <= MAX_MONTHS; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, 12);
      const batchPromises = [];

      for (let month = batchStart; month <= batchEnd; month++) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
        
        const officeFilter = officeId && officeId !== 'all' ? `WHERE Unidad = '${officeId}'` : '';
        
        const query = `
          SELECT 
            Unidad,
            Oficina,
            PagosFinanciadosPendiente,
            PagosFinanciadosFacturado
          FROM dbo.fn_Tendencia_Financiamiento('${startDate}', '${endDate}', ${idEmpresa})
          ${officeFilter}
        `;
        
        batchPromises.push(
          executeQueryWithRetry(query, { useCache: true, retries: 1 })
            .then(result => ({ month, result }))
            .catch(error => {
              console.error(`[FINANCIAMIENTO] Error mes ${month}:`, error);
              return { month, result: { success: false, data: [] } };
            })
        );
      }

      // Ejecutar batch
      const batchResults = await Promise.all(batchPromises);

      // Procesar resultados del batch
      for (const { month, result } of batchResults) {
        const monthData = result.success ? (result.data || []) : [];

        const pendingInvoice = monthData.reduce((sum, item) => sum + (item.PagosFinanciadosPendiente || 0), 0);
        const invoiced = monthData.reduce((sum, item) => sum + (item.PagosFinanciadosFacturado || 0), 0);

        months.push({
          month,
          monthName: formatMonthName(month),
          pendingInvoice: Math.round(pendingInvoice * 100) / 100,
          invoiced: Math.round(invoiced * 100) / 100,
          total: Math.round((pendingInvoice + invoiced) * 100) / 100,
        });

        // Detalles por oficina
        monthData.forEach((item: any) => {
          tableDetails.push({
            unit: item.Unidad || 'General',
            office: item.Oficina || 'Sin Oficina',
            pendingInvoice: Math.round((item.PagosFinanciadosPendiente || 0) * 100) / 100,
            invoiced: Math.round((item.PagosFinanciadosFacturado || 0) * 100) / 100,
            month,
          });
        });
      }

      // Pausa entre batches
      if (batchEnd < 12) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const response: FinancingTrendData = {
      months,
      tableData: tableDetails,
      filters: {
        offices,
        units,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/financiamiento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
