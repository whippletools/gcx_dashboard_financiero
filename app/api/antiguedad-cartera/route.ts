// app/api/antiguedad-cartera/route.ts
// API Route para US-002: Antigüedad de Cartera con rangos exactos
// GET /api/antiguedad-cartera?fechaCorte=2024-01-31&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryWithRetry } from '@/lib/reco-api';
import { AgingData, AgingBucket, AgingDetail, AgingRange } from '@/types/dashboard';
import { agingRiskColors } from '@/lib/utils/colors';

export const dynamic = 'force-dynamic';

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

    // Query US-002: solo Saldo y DiasTranscurridos para calcular buckets por rango
    const query = `
      SELECT 
        Saldo AS Total,
        DiasTranscurridos AS Dias
      FROM dbo.fn_CuentasPorCobrar_Excel('${fechaCorte}', ${idEmpresa})
      WHERE TipoCliente = 'Externo'
    `;

    console.log(`[ANTIGUEDAD-CARTERA] Query:\n${query.trim()}`);

    const result = await executeQueryWithRetry(query, { useCache: true, retries: 1 });

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
    const tableData: AgingDetail[] = []; // El detalle por cliente se carga desde /api/antiguedad-cartera/detalle
    const summary = calculateSummary(cobranzaData || []);

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
 * Calcula el resumen general a partir de los registros crudos
 */
function calculateSummary(data: any[]) {
  const totalAmount = data.reduce((sum, item) => sum + (item.Total || 0), 0);
  const avgDays = data.length > 0
    ? data.reduce((sum, item) => sum + (item.Dias || 0), 0) / data.length
    : 0;

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalClients: 0, // Se calcula en /api/antiguedad-cartera/detalle
    averageDays: Math.round(avgDays * 100) / 100,
  };
}
