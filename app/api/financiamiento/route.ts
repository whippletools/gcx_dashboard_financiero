// app/api/financiamiento/route.ts
// API Route para US-004: Tendencia Financiamiento CxC DAC
// GET /api/financiamiento?year=2026&idEmpresa=1&officeId=DAC001

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
      SELECT DISTINCT Unidad AS id, Unidad AS name
      FROM dbo.fn_CuentasPorCobrar_Excel(EOMONTH(DATEFROMPARTS(${year}, 12, 1)), ${idEmpresa})
      WHERE Unidad IS NOT NULL AND TipoCliente = 'Externo'
    `;
    
    const officesResult = await executeQuery(officesQuery);
    const offices: Office[] = (officesResult.data || []).map((row: any, index: number) => ({
      id: row.id || `office-${index}`,
      name: row.name || 'Sin Oficina',
    }));

    const units: Unit[] = [
      { id: 'all', name: 'Todas las Unidades' },
    ];

    // Query CROSS APPLY: replica sp_Tendencia_Financiamiento
    // fn_Tendencia_Financiamiento(@FechaInicio DATE, @FechaCorte DATE, @IdEmpresa INT)
    const officeFilter = officeId && officeId !== 'all' ? `WHERE f.Unidad = '${officeId}'` : '';
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
        f.Unidad,
        f.Oficina,
        SUM(f.PagosFinanciadosPendiente) AS FinanciadoPTE,
        SUM(f.PagosFinanciadosFacturado) AS FinanciadoFAC,
        m.NumeroMes AS MES
      FROM CTE_Meses m
      CROSS APPLY dbo.fn_Tendencia_Financiamiento(m.FechaInicioMes, m.FechaFinMes, ${idEmpresa}) f
      ${officeFilter}
      GROUP BY f.Unidad, f.Oficina, m.NumeroMes
      ORDER BY m.NumeroMes
      OPTION (MAXRECURSION 12)
    `;

    const result = await executeQuery(query);

    const months: MonthFinancingData[] = [];
    const tableDetails: FinancingDetail[] = [];

    if (!result.success || !result.data) {
      console.warn('Error fetching financiamiento:', result.error);
      for (let month = 1; month <= 12; month++) {
        months.push({
          month,
          monthName: formatMonthName(month),
          pendingInvoice: 0,
          invoiced: 0,
          total: 0,
        });
      }
    } else {
      // Agrupar por mes
      const monthGroups = new Map<number, any[]>();
      result.data.forEach((row: any) => {
        const mes = row.MES || row.Mes || row.mes;
        if (!monthGroups.has(mes)) {
          monthGroups.set(mes, []);
        }
        monthGroups.get(mes)!.push(row);
      });

      for (let month = 1; month <= 12; month++) {
        const monthData = monthGroups.get(month) || [];

        const pendingInvoice = monthData.reduce((sum, item) => sum + (item.FinanciadoPTE || 0), 0);
        const invoiced = monthData.reduce((sum, item) => sum + (item.FinanciadoFAC || 0), 0);

        months.push({
          month,
          monthName: formatMonthName(month),
          pendingInvoice: Math.round(pendingInvoice * 100) / 100,
          invoiced: Math.round(invoiced * 100) / 100,
          total: Math.round((pendingInvoice + invoiced) * 100) / 100,
        });

        // Detalles por oficina
        monthData.forEach((item: any) => {
          tableDetails.push({
            unit: item.Unidad || 'General',
            office: item.Oficina || 'Sin Oficina',
            pendingInvoice: Math.round((item.FinanciadoPTE || 0) * 100) / 100,
            invoiced: Math.round((item.FinanciadoFAC || 0) * 100) / 100,
            month,
          });
        });
      }
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
