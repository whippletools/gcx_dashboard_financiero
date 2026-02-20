// app/api/tendencia-cobrado/route.ts
// API Route para US-001: Tendencia Cobrado con comparativo año pasado
// GET /api/tendencia-cobrado?year=2026&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryWithRetry } from '@/lib/reco-api';
import { CollectionTrendData, MonthlyCollectionData } from '@/types/dashboard';
import { formatMonthName } from '@/lib/utils/formatters';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const idEmpresa = parseInt(searchParams.get('idEmpresa') || '1');
    const targetMonth = searchParams.get('month') ? parseInt(searchParams.get('month') as string) : null;

    if (isNaN(year) || isNaN(idEmpresa)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos. Se requiere year y idEmpresa numéricos.' },
        { status: 400 }
      );
    }

    // Si se pide un mes específico, devolver solo ese mes para ambos años
    if (targetMonth && !isNaN(targetMonth) && targetMonth >= 1 && targetMonth <= 12) {
      console.log(`[TENDENCIA-COBRADO] Consultando mes individual: ${targetMonth}/${year} y ${targetMonth}/${year - 1}`);
      const currentYearMonth = await fetchSingleMonth(year, targetMonth, idEmpresa);
      const previousYearMonth = await fetchSingleMonth(year - 1, targetMonth, idEmpresa);
      
      return NextResponse.json({
        currentYearMonth,
        previousYearMonth
      });
    }

    // Comportamiento por defecto: obtener datos de los primeros meses (solo 3 para evitar timeout)
    console.log(`[TENDENCIA-COBRADO] Consultando batch de meses para año actual: ${year}, año anterior: ${year - 1}`);
    const currentYearData = await fetchYearData(year, idEmpresa);
    const previousYearData = await fetchYearData(year - 1, idEmpresa);
    
    // Log resumen de resultados
    const currentTotal = currentYearData.reduce((sum, m) => sum + m.totalCollected, 0);
    const previousTotal = previousYearData.reduce((sum, m) => sum + m.totalCollected, 0);
    console.log(`[TENDENCIA-COBRADO] Resultado - Año actual: $${currentTotal}, Año anterior: $${previousTotal}`);

    const response: CollectionTrendData = {
      currentYear: currentYearData,
      previousYear: previousYearData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/tendencia-cobrado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Ejecuta consulta para un mes individual
 */
async function fetchSingleMonth(
  year: number,
  month: number,
  idEmpresa: number
): Promise<MonthlyCollectionData> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const query = `
    SELECT
      SUM(GastosME_Cob + IngresosME_Cob) AS TotalCobrado,
      COUNT(*) AS CantidadFacturas
    FROM dbo.fn_CGA_Cobrados('${startDate}', '${endDate}', ${idEmpresa})
  `;

  try {
    const result = await executeQueryWithRetry(query, { useCache: false, retries: 1 });
    
    if (!result.success || !result.data || result.data.length === 0) {
      return {
        month,
        monthName: formatMonthName(month),
        totalCollected: 0,
        invoiceCount: 0,
        year,
      };
    }
    
    const row = result.data[0];
    return {
      month,
      monthName: formatMonthName(month),
      totalCollected: Math.round((row.TotalCobrado || 0) * 100) / 100,
      invoiceCount: row.CantidadFacturas || 0,
      year,
    };
  } catch (error) {
    console.error(`[TENDENCIA-COBRADO] Excepción mes ${month}/${year}:`, error);
    return {
      month,
      monthName: formatMonthName(month),
      totalCollected: 0,
      invoiceCount: 0,
      year,
    };
  }
}

/**
 * Ejecuta consultas en batches con límite de concurrencia
 */
async function fetchYearData(
  year: number,
  idEmpresa: number
): Promise<MonthlyCollectionData[]> {
  const months: MonthlyCollectionData[] = [];
  const BATCH_SIZE = 1; // Consultas secuenciales para evitar bloqueos en TVF
  const MAX_MONTHS = 6; // Limitar a 6 meses para evitar timeouts (semestre actual)

  // Calcular meses a consultar (últimos 6 meses del año)
  const startMonth = 1; // Podemos ajustar esto según la fecha actual

  for (let batchStart = startMonth; batchStart <= MAX_MONTHS; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, 12);
    const batchPromises = [];

    for (let month = batchStart; month <= batchEnd; month++) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const query = `
        SELECT
          SUM(GastosME_Cob + IngresosME_Cob) AS TotalCobrado,
          COUNT(*) AS CantidadFacturas
        FROM dbo.fn_CGA_Cobrados('${startDate}', '${endDate}', ${idEmpresa})
      `;

      batchPromises.push(
        executeQueryWithRetry(query, { useCache: true, retries: 1 })
          .then(result => {
            if (!result.success || !result.data || result.data.length === 0) {
              console.warn(`[TENDENCIA-COBRADO] Error mes ${month}/${year}:`, result.error);
              return {
                month,
                monthName: formatMonthName(month),
                totalCollected: 0,
                invoiceCount: 0,
                year,
              };
            }
            const row = result.data[0];
            console.log(`[TENDENCIA-COBRADO] OK mes ${month}/${year}:`, row.TotalCobrado);
            return {
              month,
              monthName: formatMonthName(month),
              totalCollected: Math.round((row.TotalCobrado || 0) * 100) / 100,
              invoiceCount: row.CantidadFacturas || 0,
              year,
            };
          })
          .catch(error => {
            console.error(`[TENDENCIA-COBRADO] Excepción mes ${month}/${year}:`, error);
            return {
              month,
              monthName: formatMonthName(month),
              totalCollected: 0,
              invoiceCount: 0,
              year,
            };
          })
      );
    }

    // Esperar el batch actual antes de continuar
    const batchResults = await Promise.all(batchPromises);
    months.push(...batchResults);
    
    // Pequeña pausa entre batches para liberar recursos
    if (batchEnd < 12) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return months.sort((a, b) => a.month - b.month);
}
