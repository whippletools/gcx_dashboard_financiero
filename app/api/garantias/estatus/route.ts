// app/api/garantias/estatus/route.ts
// API Route para US-005: Estatus de Garantías
// GET /api/garantias/estatus?year=2026&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/reco-api';
import { GuaranteeStatusData, MonthGuaranteeData, GuaranteeStatusDetail, GuaranteeStatus } from '@/types/dashboard';
import { formatMonthName } from '@/lib/utils/formatters';

// Mapeo de códigos de estatus a nombres
const STATUS_MAP: Record<string, GuaranteeStatus> = {
  'Programadas': 'Programadas',
  'Naviera': 'Naviera',
  'Operacion': 'Operacion',
};

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

    // Query CROSS APPLY: replica sp_Estatus_Garantia usando fn_Garantias_Estatus
    // fn_Garantias_Estatus(@FechaIni DATE, @FechaFin DATE, @IdEmpresa INT)
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
        g.EstatusGarantia AS Estatus,
        SUM(g.nImporte) AS ImporteMN,
        m.NumeroMes AS MES
      FROM CTE_Meses m
      CROSS APPLY dbo.fn_Garantias_Estatus(m.FechaInicioMes, m.FechaFinMes, ${idEmpresa}) g
      GROUP BY g.EstatusGarantia, m.NumeroMes
      ORDER BY m.NumeroMes, g.EstatusGarantia
      OPTION (MAXRECURSION 12)
    `;

    const result = await executeQuery(query);

    const months: MonthGuaranteeData[] = [];
    const tableDetails: GuaranteeStatusDetail[] = [];

    if (!result.success || !result.data) {
      console.warn('Error fetching garantias estatus:', result.error);
      for (let month = 1; month <= 12; month++) {
        months.push({
          month,
          monthName: formatMonthName(month),
          scheduled: 0,
          naviera: 0,
          operation: 0,
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

        const scheduled = monthData
          .filter((item) => item.Estatus === 'Programadas')
          .reduce((sum, item) => sum + (item.ImporteMN || 0), 0);
        
        const naviera = monthData
          .filter((item) => item.Estatus === 'Naviera')
          .reduce((sum, item) => sum + (item.ImporteMN || 0), 0);
        
        const operation = monthData
          .filter((item) => item.Estatus === 'Operacion')
          .reduce((sum, item) => sum + (item.ImporteMN || 0), 0);

        const total = scheduled + naviera + operation;

        months.push({
          month,
          monthName: formatMonthName(month),
          scheduled: Math.round(scheduled * 100) / 100,
          naviera: Math.round(naviera * 100) / 100,
          operation: Math.round(operation * 100) / 100,
          total: Math.round(total * 100) / 100,
        });

        // Agregar detalles por estatus para este mes
        ['Programadas', 'Naviera', 'Operacion'].forEach((statusName) => {
          const statusAmount = monthData
            .filter((item) => item.Estatus === statusName)
            .reduce((sum, item) => sum + (item.ImporteMN || 0), 0);

          if (statusAmount > 0) {
            tableDetails.push({
              status: STATUS_MAP[statusName],
              amount: Math.round(statusAmount * 100) / 100,
              month,
              monthName: formatMonthName(month),
            });
          }
        });
      }
    }

    const response: GuaranteeStatusData = {
      months,
      tableData: tableDetails,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/garantias/estatus:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
