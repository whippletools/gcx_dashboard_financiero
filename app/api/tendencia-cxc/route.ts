// app/api/tendencia-cxc/route.ts
// API Route para US-003: Tendencia Cartera CXC (Vencido vs En tiempo)
// GET /api/tendencia-cxc?year=2024&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/reco-api';
import { PortfolioTrendData, MonthPortfolioData, PortfolioDetail } from '@/types/dashboard';
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

    // Query mensual usando API RECO
    const months: MonthPortfolioData[] = [];
    const tableDetails: PortfolioDetail[] = [];

    for (let month = 1; month <= 12; month++) {
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Query a la base de datos RECO
      const query = `
        SELECT 
          Cliente as Nombre,
          RFC,
          Total,
          Vencido,
          Dias,
          UD
        FROM dbo.fn_CuentasPorCobrar_Excel('${endDate}', ${idEmpresa})
        WHERE RFC NOT LIKE '%INTERNO%'
      `;

      const result = await executeQuery(query);

      if (!result.success) {
        console.warn(`Error fetching data for month ${month}:`, result.error);
      }

      const validData = result.data || [];

      // Calcular métricas del mes
      const totalPortfolio = validData.reduce((sum, item) => sum + (item.Total || 0), 0);
      const totalOverdue = validData.reduce((sum, item) => sum + (item.Vencido || 0), 0);
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

      // Agregar detalles por cliente para este mes
      const clientGroups = new Map<string, any[]>();
      validData.forEach((item) => {
        const key = item.RFC || item.Nombre || 'Sin RFC';
        if (!clientGroups.has(key)) {
          clientGroups.set(key, []);
        }
        clientGroups.get(key)!.push(item);
      });

      Array.from(clientGroups.entries()).forEach(([rfc, items]) => {
        const clientName = items[0]?.Nombre || 'Sin Nombre';
        const branch = items[0]?.UD || 'Sin Sucursal';
        const clientTotal = items.reduce((sum, item) => sum + (item.Total || 0), 0);
        const clientOverdue = items.reduce((sum, item) => sum + (item.Vencido || 0), 0);
        const clientOnTime = clientTotal - clientOverdue;

        tableDetails.push({
          clientName,
          rfc,
          onTime: Math.round(clientOnTime * 100) / 100,
          overdue: Math.round(clientOverdue * 100) / 100,
          total: Math.round(clientTotal * 100) / 100,
          branch,
          month,
        });
      });
    }

    const response: PortfolioTrendData = {
      months,
      tableData: tableDetails,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/tendencia-cxc:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
