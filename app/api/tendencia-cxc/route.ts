// app/api/tendencia-cxc/route.ts
// API Route para US-003: Tendencia Cartera CXC (Vencido vs En tiempo)
// GET /api/tendencia-cxc?year=2026&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/reco-api';
import { PortfolioTrendData, MonthPortfolioData, PortfolioDetail } from '@/types/dashboard';
import { formatMonthName } from '@/lib/utils/formatters';

export const dynamic = 'force-dynamic';

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

    // Queries secuenciales por mes - fn_CuentasPorCobrar_Excel(@FechaCorte DATE, @IdEmpresa INT)
    // Secuencial para evitar timeout en la API (paralelo satura el servidor)
    const months: MonthPortfolioData[] = [];
    const tableDetails: PortfolioDetail[] = [];

    for (let month = 1; month <= 12; month++) {
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const query = `
        SELECT
          Nombre,
          RFC,
          SUM(Tiempo) AS Vigente,
          SUM(Vencido) AS Vencido,
          SUM(Saldo) AS Saldo,
          NombreSucursal AS Sucursal
        FROM dbo.fn_CuentasPorCobrar_Excel('${endDate}', ${idEmpresa})
        WHERE TipoCliente = 'Externo'
        GROUP BY Nombre, RFC, NombreSucursal
      `;

      console.log(`[TENDENCIA-CXC] Query Mes ${month}:\n${query.trim()}`);

      const result = await executeQuery(query);
      const validData = result.success && result.data ? result.data : [];

      if (!result.success) {
        console.warn(`[TENDENCIA-CXC] Error mes ${month}:`, result.error);
      } else {
        console.log(`[TENDENCIA-CXC] Resultado mes ${month}: ${validData.length} registros`);
      }

      const totalPortfolio = validData.reduce((sum: number, item: any) => sum + (item.Saldo || 0), 0);
      const totalOverdue = validData.reduce((sum: number, item: any) => sum + (item.Vencido || 0), 0);
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

      // Detalles por cliente (solo meses con datos)
      validData.forEach((item: any) => {
        tableDetails.push({
          clientName: item.Nombre || 'Sin Nombre',
          rfc: item.RFC || 'Sin RFC',
          onTime: Math.round((item.Vigente || 0) * 100) / 100,
          overdue: Math.round((item.Vencido || 0) * 100) / 100,
          total: Math.round((item.Saldo || 0) * 100) / 100,
          branch: item.Sucursal || 'Sin Sucursal',
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
