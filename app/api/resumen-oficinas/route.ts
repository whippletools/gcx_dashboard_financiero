// app/api/resumen-oficinas/route.ts
// API Route para US-006: Resumen Corporativo por Oficina
// GET /api/resumen-oficinas?fechaCorte=2024-01-31&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/reco-api';
import { OfficeSummaryData, OfficeSummary, OfficeSummaryParams } from '@/types/dashboard';
import { formatMonthName } from '@/lib/utils/formatters';

export const dynamic = 'force-dynamic';

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
        Unidad AS Oficina,
        Cobrador AS Agente,
        Saldo AS Total,
        Vencido,
        DiasTranscurridos AS Dias,
        PagosNetos,
        Honorarios,
        Complementarios,
        RFC,
        Nombre
      FROM dbo.fn_CuentasPorCobrar_Excel('${fechaCorte}', ${idEmpresa})
      WHERE TipoCliente = 'Externo'
    `;

    console.log(`[RESUMEN-OFICINAS] Query:\n${query.trim()}`);

    const result = await executeQuery(query);

    if (!result.success || !result.data) {
      console.error('Error fetching cobranza data:', result.error);
      return NextResponse.json(
        { error: 'Error al obtener datos de la base de datos' },
        { status: 500 }
      );
    }

    const validData = result.data;

    // Agrupar por oficina (campo UD o AA)
    const officeGroups = new Map<string, any[]>();

    validData.forEach((item) => {
      const officeKey = item.Oficina || item.Agente || 'Sin Oficina';
      if (!officeGroups.has(officeKey)) {
        officeGroups.set(officeKey, []);
      }
      officeGroups.get(officeKey)!.push(item);
    });

    // Calcular métricas por oficina
    const offices: OfficeSummary[] = Array.from(officeGroups.entries())
      .map(([officeName, items], index) => {
        const invoiceCount = items.length;
        
        // Rangos de antigüedad (ajustados a los rangos del requerimiento: 01-30, 31-45, 46-60, 61-90, 91+)
        const range01to30 = items
          .filter((item) => item.Dias >= 1 && item.Dias <= 30)
          .reduce((sum, item) => sum + (item.Total || 0), 0);
        
        const range31to45 = items
          .filter((item) => item.Dias >= 31 && item.Dias <= 45)
          .reduce((sum, item) => sum + (item.Total || 0), 0);
        
        const range46to60 = items
          .filter((item) => item.Dias >= 46 && item.Dias <= 60)
          .reduce((sum, item) => sum + (item.Total || 0), 0);
        
        const range61to90 = items
          .filter((item) => item.Dias >= 61 && item.Dias <= 90)
          .reduce((sum, item) => sum + (item.Total || 0), 0);
        
        const range91plus = items
          .filter((item) => item.Dias >= 91)
          .reduce((sum, item) => sum + (item.Total || 0), 0);

        const total = items.reduce((sum, item) => sum + (item.Total || 0), 0);
        const dacBalance = items.reduce((sum, item) => sum + (item.Honorarios || 0), 0);
        const clientBalance = items.reduce((sum, item) => sum + (item.Complementarios || 0), 0);
        const collected = items.reduce((sum, item) => sum + (item.PagosNetos || 0), 0);
        const overdue = items.reduce((sum, item) => sum + (item.Vencido || 0), 0);

        return {
          id: `office-${index}`,
          name: officeName,
          invoiceCount,
          range01to30: Math.round(range01to30 * 100) / 100,
          range31to45: Math.round(range31to45 * 100) / 100,
          range46to60: Math.round(range46to60 * 100) / 100,
          range61to90: Math.round(range61to90 * 100) / 100,
          range91plus: Math.round(range91plus * 100) / 100,
          total: Math.round(total * 100) / 100,
          dacBalance: Math.round(dacBalance * 100) / 100,
          clientBalance: Math.round(clientBalance * 100) / 100,
          collected: Math.round(collected * 100) / 100,
          overdue: Math.round(overdue * 100) / 100,
        };
      })
      .sort((a, b) => b.total - a.total);

    // Calcular totales
    const totals: OfficeSummary = {
      id: 'totals',
      name: 'TOTALES',
      invoiceCount: offices.reduce((sum, o) => sum + o.invoiceCount, 0),
      range01to30: offices.reduce((sum, o) => sum + o.range01to30, 0),
      range31to45: offices.reduce((sum, o) => sum + o.range31to45, 0),
      range46to60: offices.reduce((sum, o) => sum + o.range46to60, 0),
      range61to90: offices.reduce((sum, o) => sum + o.range61to90, 0),
      range91plus: offices.reduce((sum, o) => sum + o.range91plus, 0),
      total: offices.reduce((sum, o) => sum + o.total, 0),
      dacBalance: offices.reduce((sum, o) => sum + o.dacBalance, 0),
      clientBalance: offices.reduce((sum, o) => sum + o.clientBalance, 0),
      collected: offices.reduce((sum, o) => sum + o.collected, 0),
      overdue: offices.reduce((sum, o) => sum + o.overdue, 0),
    };

    const response: OfficeSummaryData = {
      offices,
      totals,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/resumen-oficinas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
