// app/api/facturacion/route.ts
// API Route para US-007: Facturación DAC (Honorarios vs Complementarios)
// Fuente: fn_CuentasPorCobrar_Excel — TOP 300 filas, agrupación mensual en JS
// GET /api/facturacion?year=2026

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryWithRetry } from '@/lib/reco-api';
import { BillingData, MonthBillingData, AduanaBilling } from '@/types/dashboard';
import { formatMonthName } from '@/lib/utils/formatters';

export const dynamic = 'force-dynamic';

function getAvailableMonths(year: number): number[] {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const maxMonth = year < currentYear ? 12 : currentMonth;
  return Array.from({ length: maxMonth }, (_, i) => i + 1);
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const aduanaId = searchParams.get('aduanaId') || 'all';

    if (isNaN(year)) {
      return NextResponse.json({ error: 'Parámetro year inválido.' }, { status: 400 });
    }

    // Fecha de corte: último día del año solicitado o hoy si es el año actual
    const today = new Date();
    const cutoffDate = year < today.getFullYear()
      ? `${year}-12-31`
      : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const aduanaFilter = aduanaId !== 'all' ? `AND Unidad = '${aduanaId.replace(/'/g, "''")}'` : '';

    // ── Query simple: traer columnas mínimas sin GROUP BY en SQL ──
    // fn_CuentasPorCobrar_Excel es una TVF lenta — evitar GROUP BY/YEAR() en SQL
    // Procesamos la agrupación en JavaScript
    const mainQuery = `
      SELECT TOP 300
        FechaDocumento,
        Unidad,
        ISNULL(Honorarios, 0)      AS Honorarios,
        ISNULL(Complementarios, 0) AS Complementarios
      FROM dbo.fn_CuentasPorCobrar_Excel('${todayStr()}', 1)
      WHERE TipoCliente = 'Externo'
        ${aduanaFilter}
    `;

    const mainResult = await executeQueryWithRetry(mainQuery, { useCache: true, retries: 2 });
    const allRows: any[] = mainResult.success ? (mainResult.data || []) : [];

    // Filtrar por año en JavaScript
    const rows = allRows.filter((r: any) => {
      if (!r.FechaDocumento) return false;
      const d = new Date(r.FechaDocumento);
      return d.getFullYear() === year;
    });

    // ── Agregar por mes usando FechaDocumento ──
    const monthMap = new Map<number, { honorarios: number; otros: number }>();
    const aduanasSet = new Set<string>();

    for (const row of rows) {
      const mes   = new Date(row.FechaDocumento).getMonth() + 1; // 1-12
      const unidad = (row.Unidad || '').trim();
      const hon    = row.Honorarios    || 0;
      const otros  = row.Complementarios || 0;

      if (unidad) aduanasSet.add(unidad);

      const existing = monthMap.get(mes) || { honorarios: 0, otros: 0 };
      monthMap.set(mes, {
        honorarios: existing.honorarios + hon,
        otros:      existing.otros + otros,
      });
    }

    // Construir monthlyTotals para los meses disponibles
    const availableMonths = getAvailableMonths(year);
    const monthlyTotals: MonthBillingData[] = availableMonths.map((month) => {
      const agg = monthMap.get(month) || { honorarios: 0, otros: 0 };
      return {
        month,
        monthName: formatMonthName(month),
        honorarios: Math.round(agg.honorarios * 100) / 100,
        otros:      Math.round(agg.otros * 100) / 100,
        total:      Math.round((agg.honorarios + agg.otros) * 100) / 100,
      };
    });

    // ── Construir respuesta ──
    const totalHonorarios = monthlyTotals.reduce((s, m) => s + m.honorarios, 0);
    const totalOtros      = monthlyTotals.reduce((s, m) => s + m.otros, 0);
    const totalGeneral    = totalHonorarios + totalOtros;
    const uniqueAduanas   = Array.from(aduanasSet).sort();

    const aduanasList: AduanaBilling[] = [
      {
        id: 'all',
        name: 'Todas las Aduanas',
        monthlyData: monthlyTotals,
        average: monthlyTotals.length > 0 ? totalGeneral / monthlyTotals.length : 0,
        totalHonorarios: Math.round(totalHonorarios * 100) / 100,
        totalOtros:      Math.round(totalOtros * 100) / 100,
      },
      ...uniqueAduanas.map(aduana => {
        const aduanaAllRows = rows.filter(r => (r.Unidad || '').trim() === aduana);
        const aduanaMonthlyData = availableMonths.map(month => {
          const mRows = aduanaAllRows.filter(r =>
            new Date(r.FechaDocumento).getMonth() + 1 === month
          );
          const hon  = mRows.reduce((s, r) => s + (r.Honorarios    || 0), 0);
          const otro = mRows.reduce((s, r) => s + (r.Complementarios || 0), 0);
          return {
            month,
            monthName: formatMonthName(month),
            honorarios: Math.round(hon  * 100) / 100,
            otros:      Math.round(otro * 100) / 100,
            total:      Math.round((hon + otro) * 100) / 100,
          };
        });
        const totHon  = aduanaAllRows.reduce((s, r) => s + (r.Honorarios    || 0), 0);
        const totOtro = aduanaAllRows.reduce((s, r) => s + (r.Complementarios || 0), 0);
        return {
          id: aduana,
          name: aduana,
          monthlyData: aduanaMonthlyData,
          average: aduanaMonthlyData.length > 0 ? (totHon + totOtro) / aduanaMonthlyData.length : 0,
          totalHonorarios: Math.round(totHon  * 100) / 100,
          totalOtros:      Math.round(totOtro * 100) / 100,
        };
      }),
    ];

    const response: BillingData = {
      aduanas: aduanasList,
      months: monthlyTotals.map(m => m.monthName),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/facturacion:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
