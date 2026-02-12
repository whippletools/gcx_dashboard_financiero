// app/api/tendencia-cobrado/route.ts
// API Route para US-001: Tendencia Cobrado con comparativo año pasado
// GET /api/tendencia-cobrado?year=2024&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, DASHBOARD_QUERIES } from '@/lib/reco-api';
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
 */
async function fetchYearData(
  year: number,
  idEmpresa: number
): Promise<MonthlyCollectionData[]> {
  const months: MonthlyCollectionData[] = [];

  // Query para tendencia de cobrado por mes
  const query = `
    SELECT 
      MONTH(FechaPago) as Mes,
      SUM(TotalCobrado) as TotalCobrado,
      COUNT(*) as CantidadFacturas
    FROM dbo.fn_CGA_Cobrados(${idEmpresa}, ${year})
    WHERE YEAR(FechaPago) = ${year}
    GROUP BY MONTH(FechaPago)
    ORDER BY Mes
  `;

  const result = await executeQuery(query);

  if (!result.success || !result.data) {
    console.warn(`Error fetching data for ${year}:`, result.error);
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
  const dataMap = new Map();
  result.data.forEach((row: any) => {
    const mes = row.Mes || row.mes || row.MONTH || row.month;
    if (mes) {
      dataMap.set(mes, {
        totalCollected: row.TotalCobrado || row.totalCobrado || row.TOTALCOBRADO || 0,
        invoiceCount: row.CantidadFacturas || row.cantidadFacturas || row.CANTIDADFACTURAS || 0,
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
