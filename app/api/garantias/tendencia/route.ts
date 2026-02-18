// app/api/garantias/tendencia/route.ts
// API Route para US-008: Tendencia Cartera de Garantías
// GET /api/garantias/tendencia?year=2026&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/reco-api';
import { GuaranteeTrendData, MonthGuaranteeTrend, GuaranteeTrendDetail } from '@/types/dashboard';
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

    // Query CROSS APPLY: replica sp_Tendencia_cartera_Garantias
    // fn_GarantiasPorCobrar(@FechaCorte DATE, @IdEmpresa INT)
    // Columnas reales: sProveedor, DiasTranscurridos, Saldo, sNombreSucursal
    const query = `
      WITH CTE_Meses AS (
        SELECT 
          1 AS NumeroMes,
          EOMONTH(DATEFROMPARTS(${year}, 1, 1)) AS FechaFinMes
        UNION ALL
        SELECT 
          NumeroMes + 1,
          EOMONTH(DATEFROMPARTS(${year}, NumeroMes + 1, 1))
        FROM CTE_Meses
        WHERE NumeroMes < 12
      )
      SELECT
        g.sProveedor AS Nombre,
        SUM(CASE WHEN g.DiasTranscurridos < 1 THEN g.Saldo ELSE 0 END) AS Vigente,
        SUM(CASE WHEN g.DiasTranscurridos >= 1 THEN g.Saldo ELSE 0 END) AS Vencido,
        SUM(g.Saldo) AS Saldo,
        g.sNombreSucursal AS Sucursal,
        m.NumeroMes AS Mes
      FROM CTE_Meses m
      CROSS APPLY dbo.fn_GarantiasPorCobrar(m.FechaFinMes, ${idEmpresa}) g
      GROUP BY g.sProveedor, g.sNombreSucursal, m.NumeroMes
      ORDER BY m.NumeroMes, g.sProveedor
      OPTION (MAXRECURSION 12)
    `;

    console.log(`[GARANTIAS-TENDENCIA] Query:\n${query.trim()}`);

    const result = await executeQuery(query);

    const months: MonthGuaranteeTrend[] = [];
    const tableDetails: GuaranteeTrendDetail[] = [];

    if (!result.success || !result.data) {
      console.warn('Error fetching garantias tendencia:', result.error);
      for (let month = 1; month <= 12; month++) {
        months.push({
          month,
          monthName: formatMonthName(month),
          overdue: 0,
          onTime: 0,
          total: 0,
          overduePercentage: 0,
        });
      }
    } else {
      // Agrupar por mes
      const monthGroups = new Map<number, any[]>();
      result.data.forEach((row: any) => {
        const mes = row.Mes || row.mes;
        if (!monthGroups.has(mes)) {
          monthGroups.set(mes, []);
        }
        monthGroups.get(mes)!.push(row);
      });

      for (let month = 1; month <= 12; month++) {
        const monthData = monthGroups.get(month) || [];

        const totalPortfolio = monthData.reduce((sum, item) => sum + (item.Saldo || 0), 0);
        const totalOverdue = monthData.reduce((sum, item) => sum + (item.Vencido || 0), 0);
        const onTime = totalPortfolio - totalOverdue;
        const overduePercentage = totalPortfolio > 0 ? (totalOverdue / totalPortfolio) * 100 : 0;

        months.push({
          month,
          monthName: formatMonthName(month),
          overdue: Math.round(totalOverdue * 100) / 100,
          onTime: Math.round(onTime * 100) / 100,
          total: Math.round(totalPortfolio * 100) / 100,
          overduePercentage: Math.round(overduePercentage * 100) / 100,
        });

        // Detalles por proveedor
        monthData.forEach((item: any) => {
          tableDetails.push({
            providerName: item.Nombre || 'Sin Proveedor',
            onTime: Math.round((item.Vigente || 0) * 100) / 100,
            overdue: Math.round((item.Vencido || 0) * 100) / 100,
            total: Math.round((item.Saldo || 0) * 100) / 100,
            branch: item.Sucursal || 'Sin Sucursal',
            month,
          });
        });
      }
    }

    const response: GuaranteeTrendData = {
      months,
      tableData: tableDetails,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/garantias/tendencia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
