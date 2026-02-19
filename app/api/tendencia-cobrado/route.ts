// app/api/tendencia-cobrado/route.ts
// API Route para US-001: Tendencia Cobrado con comparativo año pasado
// GET /api/tendencia-cobrado?year=2026&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/reco-api';
import { CollectionTrendData, MonthlyCollectionData } from '@/types/dashboard';
import { formatMonthName } from '@/lib/utils/formatters';

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

    // Obtener datos del año actual y anterior usando API RECO
    const currentYearData = await fetchYearData(year, idEmpresa);
    const previousYearData = await fetchYearData(year - 1, idEmpresa);

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
 * Obtiene datos mensuales de cobrado para un año específico usando API RECO
 * Queries individuales por mes a fn_CGA_Cobrados(FechaIni, FechaFin, IdEmpresa)
 * Secuencial para evitar timeout en la API
 */
async function fetchYearData(
  year: number,
  idEmpresa: number
): Promise<MonthlyCollectionData[]> {
  const months: MonthlyCollectionData[] = [];

  for (let month = 1; month <= 12; month++) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const query = `
      SELECT
        SUM(GastosME_Cob + IngresosME_Cob) AS TotalCobrado,
        COUNT(*) AS CantidadFacturas
      FROM dbo.fn_CGA_Cobrados('${startDate}', '${endDate}', ${idEmpresa})
    `;

    console.log(`[TENDENCIA-COBRADO] Query año ${year} mes ${month}:\n${query.trim()}`);

    const result = await executeQuery(query);

    if (!result.success || !result.data || result.data.length === 0) {
      console.warn(`[TENDENCIA-COBRADO] Error mes ${month}/${year}:`, result.error);
      months.push({
        month,
        monthName: formatMonthName(month),
        totalCollected: 0,
        invoiceCount: 0,
        year,
      });
    } else {
      const row = result.data[0];
      console.log(`[TENDENCIA-COBRADO] Resultado mes ${month}/${year}:`, JSON.stringify(row));
      months.push({
        month,
        monthName: formatMonthName(month),
        totalCollected: Math.round((row.TotalCobrado || 0) * 100) / 100,
        invoiceCount: row.CantidadFacturas || 0,
        year,
      });
    }
  }

  return months;
}
