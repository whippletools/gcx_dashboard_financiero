// app/api/garantias/tendencia/route.ts
// API Route para US-008: Tendencia Cartera de Garantías
// Periodicidad: SEMANAL | Umbral vencido: 45 días
// GET /api/garantias/tendencia?year=2026&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryWithRetry } from '@/lib/reco-api';

export const dynamic = 'force-dynamic';

const OVERDUE_THRESHOLD = 45; // días para considerar vencido

// Genera todos los viernes (fin de semana laboral) del año
function getWeekDates(year: number): { weekNumber: number; weekLabel: string; date: string }[] {
  const weeks: { weekNumber: number; weekLabel: string; date: string }[] = [];
  const today = new Date();
  // Empezar desde el primer lunes del año
  const start = new Date(year, 0, 1);
  // Avanzar al primer viernes
  while (start.getDay() !== 5) start.setDate(start.getDate() + 1);

  let weekNum = 1;
  const cursor = new Date(start);
  while (cursor.getFullYear() === year && cursor <= today) {
    const yyyy = cursor.getFullYear();
    const mm = String(cursor.getMonth() + 1).padStart(2, '0');
    const dd = String(cursor.getDate()).padStart(2, '0');
    weeks.push({
      weekNumber: weekNum,
      weekLabel: `Sem.${weekNum}`,
      date: `${yyyy}-${mm}-${dd}`,
    });
    cursor.setDate(cursor.getDate() + 7);
    weekNum++;
  }
  return weeks;
}

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

    const weekDates = getWeekDates(year);
    // Limitar a las últimas 20 semanas para evitar timeouts
    const recentWeeks = weekDates.slice(-20);

    const weeks: any[] = [];
    const tableDetails: any[] = [];

    for (const week of recentWeeks) {
      const query = `
        SELECT
          sProveedor AS Nombre,
          DiasTranscurridos,
          CASE WHEN DiasTranscurridos > ${OVERDUE_THRESHOLD} THEN Saldo ELSE 0 END AS Vencido,
          CASE WHEN DiasTranscurridos <= ${OVERDUE_THRESHOLD} THEN Saldo ELSE 0 END AS EnProceso,
          Saldo,
          sNombreSucursal AS Sucursal
        FROM dbo.fn_GarantiasPorCobrar('${week.date}', ${idEmpresa})
        WHERE Saldo > 0
      `;

      let rowData: any[] = [];
      try {
        const result = await executeQueryWithRetry(query, { useCache: true, retries: 1 });
        rowData = result.success ? (result.data || []) : [];
      } catch (e) {
        console.error(`[GARANTIAS-TENDENCIA] Error semana ${week.weekLabel}:`, e);
      }

      const totalPortfolio = rowData.reduce((s, r) => s + (r.Saldo || 0), 0);
      const totalOverdue   = rowData.reduce((s, r) => s + (r.Vencido || 0), 0);
      const totalOnTime    = rowData.reduce((s, r) => s + (r.EnProceso || 0), 0);
      const overduePercentage = totalPortfolio > 0 ? (totalOverdue / totalPortfolio) * 100 : 0;

      weeks.push({
        weekNumber:        week.weekNumber,
        weekLabel:         week.weekLabel,
        date:              week.date,
        garantiasEnProceso: Math.round(totalOnTime    * 100) / 100,
        programado:        Math.round(totalPortfolio  * 100) / 100,
        overdue:           Math.round(totalOverdue    * 100) / 100,
        total:             Math.round(totalPortfolio  * 100) / 100,
        overduePercentage: Math.round(overduePercentage * 100) / 100,
      });

      rowData.forEach((item: any) => {
        tableDetails.push({
          providerName: item.Nombre    || 'Sin Proveedor',
          onTime:       Math.round((item.EnProceso || 0) * 100) / 100,
          overdue:      Math.round((item.Vencido   || 0) * 100) / 100,
          total:        Math.round((item.Saldo     || 0) * 100) / 100,
          branch:       item.Sucursal || 'Sin Sucursal',
          weekLabel:    week.weekLabel,
        });
      });

      await new Promise(resolve => setTimeout(resolve, 80));
    }

    return NextResponse.json({ weeks, tableData: tableDetails, overdueThreshold: OVERDUE_THRESHOLD });
  } catch (error) {
    console.error('Error en /api/garantias/tendencia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
