// app/api/financiamiento/route.ts
// API Route para US-004: Tendencia Financiamiento CxC DAC
// GET /api/financiamiento?year=2024&idEmpresa=1&officeId=DAC001

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/reco-api';
import { FinancingTrendData, MonthFinancingData, FinancingDetail, Office, Unit } from '@/types/dashboard';
import { formatMonthName } from '@/lib/utils/formatters';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const idEmpresa = parseInt(searchParams.get('idEmpresa') || '1');
    const officeId = searchParams.get('officeId');

    if (isNaN(year) || isNaN(idEmpresa)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos. Se requiere year y idEmpresa numéricos.' },
        { status: 400 }
      );
    }

    // Obtener lista de oficinas usando API RECO
    const officesQuery = `
      SELECT DISTINCT UD as id, UD as name
      FROM dbo.fn_CuentasPorCobrar_Excel('${year}-12-31', ${idEmpresa})
      WHERE UD IS NOT NULL AND RFC NOT LIKE '%INTERNO%'
    `;
    
    const officesResult = await executeQuery(officesQuery);
    const offices: Office[] = (officesResult.data || []).map((row: any, index: number) => ({
      id: row.id || row.UD || `office-${index}`,
      name: row.name || row.UD || 'Sin Oficina',
    }));

    // Mock units - en producción vendrían de otra tabla
    const units: Unit[] = [
      { id: 'all', name: 'Todas las Unidades' },
      { id: 'u1', name: 'Unidad A' },
      { id: 'u2', name: 'Unidad B' },
    ];

    // Query mensual usando API RECO
    const months: MonthFinancingData[] = [];
    const tableDetails: FinancingDetail[] = [];

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Query usando fn_Tendencia_Financiamiento
      const query = `
        SELECT 
          UD,
          SUM(FinanciadoPTE) as ANTICIPO,
          SUM(FinanciadoFAC) as FINANCIAMIENTO
        FROM dbo.fn_Tendencia_Financiamiento(${idEmpresa}, ${year}, ${month})
        ${officeId && officeId !== 'all' ? `WHERE UD = '${officeId}'` : ''}
        GROUP BY UD
      `;

      const result = await executeQuery(query);

      if (!result.success) {
        console.warn(`Error fetching financing data for month ${month}:`, result.error);
      }

      const validData = result.data || [];

      // Calcular totales de financiamiento
      // FinanciadoPTE = ANTICIPO (financiamiento por facturar)
      // FinanciadoFAC = FINANCIAMIENTO (financiamiento facturado)
      const pendingInvoice = validData.reduce((sum, item) => sum + (item.ANTICIPO || 0), 0);
      const invoiced = validData.reduce((sum, item) => sum + (item.FINANCIAMIENTO || 0), 0);

      months.push({
        month,
        monthName: formatMonthName(month),
        pendingInvoice: Math.round(pendingInvoice * 100) / 100,
        invoiced: Math.round(invoiced * 100) / 100,
        total: Math.round((pendingInvoice + invoiced) * 100) / 100,
      });

      // Agregar detalles por oficina para este mes
      const officeGroups = new Map<string, any[]>();
      validData.forEach((item) => {
        const key = item.UD || 'Sin Oficina';
        if (!officeGroups.has(key)) {
          officeGroups.set(key, []);
        }
        officeGroups.get(key)!.push(item);
      });

      Array.from(officeGroups.entries()).forEach(([office, items]) => {
        const unit = 'General'; // En producción vendría del campo correspondiente
        const officePending = items.reduce((sum, item) => sum + (item.ANTICIPO || 0), 0);
        const officeInvoiced = items.reduce((sum, item) => sum + (item.FINANCIAMIENTO || 0), 0);

        tableDetails.push({
          unit,
          office,
          pendingInvoice: Math.round(officePending * 100) / 100,
          invoiced: Math.round(officeInvoiced * 100) / 100,
          month,
        });
      });
    }

    const response: FinancingTrendData = {
      months,
      tableData: tableDetails,
      filters: {
        offices,
        units,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/financiamiento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
