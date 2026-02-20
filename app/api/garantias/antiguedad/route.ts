// app/api/garantias/antiguedad/route.ts
// API Route para Antigüedad de Cartera Garantías
// GET /api/garantias/antiguedad?fechaCorte=2026-05-31&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryWithRetry } from '@/lib/reco-api';

export const dynamic = 'force-dynamic';

const AGING_COLORS: Record<string, string> = {
  '1-30':     '#FFEB3B', // amarillo
  '31-60':    '#4CAF50', // verde
  '61-90':    '#2196F3', // azul
  '91-120':   '#F44336', // rojo
  '121-5000': '#B71C1C', // rojo oscuro
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idEmpresa = parseInt(searchParams.get('idEmpresa') || '1');

    // Usar fecha de hoy si no se pasa
    const today = new Date();
    const fechaCorte = searchParams.get('fechaCorte') ||
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const query = `
      SELECT
        DiasTranscurridos,
        Saldo,
        sProveedor AS Proveedor,
        sNombreSucursal AS Sucursal
      FROM dbo.fn_GarantiasPorCobrar('${fechaCorte}', ${idEmpresa})
      WHERE Saldo > 0
    `;

    const result = await executeQueryWithRetry(query, { useCache: true, retries: 2 });

    if (!result.success) {
      return NextResponse.json({ error: 'Error al consultar antigüedad de garantías' }, { status: 500 });
    }

    const rows: any[] = result.data || [];

    // Clasificar en rangos
    const buckets: Record<string, { amount: number; count: number }> = {
      '1-30':     { amount: 0, count: 0 },
      '31-60':    { amount: 0, count: 0 },
      '61-90':    { amount: 0, count: 0 },
      '91-120':   { amount: 0, count: 0 },
      '121-5000': { amount: 0, count: 0 },
    };

    rows.forEach((row) => {
      const dias = Math.abs(row.DiasTranscurridos || 0);
      const saldo = row.Saldo || 0;
      if (dias <= 30)        buckets['1-30'].amount     += saldo, buckets['1-30'].count++;
      else if (dias <= 60)   buckets['31-60'].amount    += saldo, buckets['31-60'].count++;
      else if (dias <= 90)   buckets['61-90'].amount    += saldo, buckets['61-90'].count++;
      else if (dias <= 120)  buckets['91-120'].amount   += saldo, buckets['91-120'].count++;
      else                   buckets['121-5000'].amount += saldo, buckets['121-5000'].count++;
    });

    const totalAmount = Object.values(buckets).reduce((s, b) => s + b.amount, 0);

    const chartData = Object.entries(buckets).map(([range, b]) => ({
      range,
      amount: Math.round(b.amount * 100) / 100,
      count: b.count,
      percentage: totalAmount > 0 ? Math.round((b.amount / totalAmount) * 10000) / 100 : 0,
      color: AGING_COLORS[range],
    }));

    return NextResponse.json({
      chartData,
      totalAmount: Math.round(totalAmount * 100) / 100,
      fechaCorte,
    });
  } catch (error) {
    console.error('Error en /api/garantias/antiguedad:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
