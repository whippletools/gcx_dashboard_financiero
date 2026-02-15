// app/api/antiguedad-cartera/route.ts
// API Route para US-002: Antigüedad de Cartera con rangos exactos
// GET /api/antiguedad-cartera?fechaCorte=2024-01-31&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/reco-api';
import { AgingData, AgingBucket, AgingDetail, AgingRange, RiskLevel } from '@/types/dashboard';
import { agingRiskColors } from '@/lib/utils/colors';

const AGING_RANGES: { range: AgingRange; min: number; max: number }[] = [
  { range: '1-30', min: 1, max: 30 },
  { range: '31-60', min: 31, max: 60 },
  { range: '61-90', min: 61, max: 90 },
  { range: '91-120', min: 91, max: 120 },
  { range: '121-5000', min: 121, max: 5000 },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaCorte = searchParams.get('fechaCorte') || new Date().toISOString().split('T')[0];
    const idEmpresa = parseInt(searchParams.get('idEmpresa') || '1');

    if (!fechaCorte || isNaN(idEmpresa)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos. Se requiere fechaCorte (YYYY-MM-DD) y idEmpresa.' },
        { status: 400 }
      );
    }

    // Query usando API RECO - columnas reales de fn_CuentasPorCobrar_Excel
    const query = `
      SELECT 
        Nombre AS Cliente,
        RFC,
        Saldo AS Total,
        DiasTranscurridos AS Dias,
        NombreSucursal AS Sucursal
      FROM dbo.fn_CuentasPorCobrar_Excel('${fechaCorte}', ${idEmpresa})
      WHERE TipoCliente = 'Externo'
    `;

    const result = await executeQuery(query);

    if (!result.success || !result.data) {
      console.error('Error fetching cobranza data:', result.error);
      return NextResponse.json(
        { error: 'Error al obtener datos de la base de datos' },
        { status: 500 }
      );
    }

    const cobranzaData = result.data;

    // Calcular distribución por rangos de antigüedad
    const chartData = calculateAgingBuckets(cobranzaData || []);
    const tableData = calculateAgingDetails(cobranzaData || []);
    const summary = calculateSummary(cobranzaData || [], tableData);

    const response: AgingData = {
      chartData,
      tableData,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/antiguedad-cartera:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Calcula los buckets de antigüedad para la gráfica
 */
function calculateAgingBuckets(data: any[]): AgingBucket[] {
  const totalGeneral = data.reduce((sum, item) => sum + (item.Total || 0), 0);

  return AGING_RANGES.map(({ range, min, max }) => {
    const itemsInRange = data.filter((item) => {
      const dias = item.Dias || 0;
      return dias >= min && dias <= max;
    });

    const amount = itemsInRange.reduce((sum, item) => sum + (item.Total || 0), 0);
    const percentage = totalGeneral > 0 ? (amount / totalGeneral) * 100 : 0;
    const config = agingRiskColors[range];

    return {
      range,
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      color: config.fill,
      riskLevel: config.risk,
    };
  });
}

/**
 * Calcula el detalle por cliente para la tabla
 */
function calculateAgingDetails(data: any[]): AgingDetail[] {
  // Agrupar por RFC/Nombre de cliente
  const clientGroups = new Map<string, any[]>();

  data.forEach((item) => {
    const key = item.RFC || item.Nombre || 'Sin RFC';
    if (!clientGroups.has(key)) {
      clientGroups.set(key, []);
    }
    clientGroups.get(key)!.push(item);
  });

  // Calcular totales por rango para cada cliente
  return Array.from(clientGroups.entries()).map(([rfc, items]) => {
    const clientName = items[0]?.Cliente || 'Sin Nombre';
    const branch = items[0]?.Sucursal || 'Sin Sucursal';

    const range1to30 = sumByRange(items, 1, 30);
    const range31to60 = sumByRange(items, 31, 60);
    const range61to90 = sumByRange(items, 61, 90);
    const range91to120 = sumByRange(items, 91, 120);
    const range121plus = sumByRange(items, 121, 5000);

    const total = range1to30 + range31to60 + range61to90 + range91to120 + range121plus;

    return {
      clientName,
      rfc,
      range1to30: Math.round(range1to30 * 100) / 100,
      range31to60: Math.round(range31to60 * 100) / 100,
      range61to90: Math.round(range61to90 * 100) / 100,
      range91to120: Math.round(range91to120 * 100) / 100,
      range121plus: Math.round(range121plus * 100) / 100,
      total: Math.round(total * 100) / 100,
      branch,
    };
  }).sort((a, b) => b.total - a.total); // Ordenar por total descendente
}

/**
 * Suma los totales de items que caen en un rango de días específico
 */
function sumByRange(items: any[], minDays: number, maxDays: number): number {
  return items
    .filter((item) => {
      const dias = item.Dias || 0;
      return dias >= minDays && dias <= maxDays;
    })
    .reduce((sum, item) => sum + (item.Total || 0), 0);
}

/**
 * Calcula el resumen general
 */
function calculateSummary(data: any[], tableData: AgingDetail[]) {
  const totalAmount = data.reduce((sum, item) => sum + (item.Total || 0), 0);
  const totalClients = tableData.length;
  const avgDays = data.length > 0 
    ? data.reduce((sum, item) => sum + (item.Dias || 0), 0) / data.length 
    : 0;

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalClients,
    averageDays: Math.round(avgDays * 100) / 100,
  };
}
