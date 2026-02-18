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
 * Usa CROSS APPLY con fn_CGA_Cobrados(FechaIni, FechaFin, IdEmpresa)
 */
async function fetchYearData(
  year: number,
  idEmpresa: number
): Promise<MonthlyCollectionData[]> {
  // Query con CTE de meses + CROSS APPLY a fn_CGA_Cobrados
  // Firma real: fn_CGA_Cobrados(@dFechaIni DATE, @dFechaFin DATE, @nIdEmp11 INT)
  const query = `
    WITH CTE_Meses AS (
      SELECT 
        1 AS NumeroMes,
        DATEFROMPARTS(${year}, 1, 1) AS FechaInicioMes,
        EOMONTH(DATEFROMPARTS(${year}, 1, 1)) AS FechaFinMes
      UNION ALL
      SELECT 
        NumeroMes + 1,
        DATEFROMPARTS(${year}, NumeroMes + 1, 1),
        EOMONTH(DATEFROMPARTS(${year}, NumeroMes + 1, 1))
      FROM CTE_Meses
      WHERE NumeroMes < 12
    )
    SELECT 
      m.NumeroMes AS Mes,
      SUM(c.GastosME_Cob + c.IngresosME_Cob) AS TotalCobrado,
      COUNT(*) AS CantidadFacturas
    FROM CTE_Meses m
    CROSS APPLY dbo.fn_CGA_Cobrados(m.FechaInicioMes, m.FechaFinMes, ${idEmpresa}) c
    GROUP BY m.NumeroMes
    ORDER BY m.NumeroMes
    OPTION (MAXRECURSION 12)
  `;

  console.log(`[TENDENCIA-COBRADO] Query año ${year}:\n${query.trim()}`);

  const result = await executeQuery(query);

  const months: MonthlyCollectionData[] = [];

  if (!result.success || !result.data) {
    console.warn(`Error fetching cobrado data for ${year}:`, result.error);
    // Generar meses vacíos en caso de error
    for (let month = 1; month <= 12; month++) {
      months.push({
        month,
        monthName: formatMonthName(month),
        totalCollected: 0,
        invoiceCount: 0,
        year,
      });
    }
    return months;
  }

  // Mapear resultados de la BD a la estructura esperada
  const dataMap = new Map<number, { totalCollected: number; invoiceCount: number }>();
  result.data.forEach((row: any) => {
    const mes = row.Mes || row.mes;
    if (mes) {
      dataMap.set(mes, {
        totalCollected: row.TotalCobrado || 0,
        invoiceCount: row.CantidadFacturas || 0,
      });
    }
  });

  // Generar datos para todos los meses
  for (let month = 1; month <= 12; month++) {
    const monthData = dataMap.get(month) || { totalCollected: 0, invoiceCount: 0 };
    
    months.push({
      month,
      monthName: formatMonthName(month),
      totalCollected: Math.round(monthData.totalCollected * 100) / 100,
      invoiceCount: monthData.invoiceCount,
      year,
    });
  }

  return months;
}
