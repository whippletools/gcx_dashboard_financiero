// app/api/garantias/tendencia/route.ts
// API Route para US-008: Tendencia Cartera de Garantías
// GET /api/garantias/tendencia?year=2024&idEmpresa=1

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

    // Query mensual usando API RECO
    const months: MonthGuaranteeTrend[] = [];
    const tableDetails: GuaranteeTrendDetail[] = [];

    for (let month = 1; month <= 12; month++) {
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Query usando fn_GarantiasPorCobrar
      const query = `
        SELECT 
          Nombre,
          Saldo,
          Vencido,
          Dias,
          UD
        FROM dbo.fn_GarantiasPorCobrar('${endDate}', ${idEmpresa})
      `;

      const result = await executeQuery(query);

      if (!result.success) {
        console.warn(`Error fetching guarantee trend data for month ${month}:`, result.error);
      }

      const validData = result.data || [];

      // Calcular métricas del mes
      const totalPortfolio = validData.reduce((sum, item) => sum + (item.Saldo || 0), 0);
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

      // Agregar detalles por proveedor para este mes
      const providerGroups = new Map<string, any[]>();
      validData.forEach((item) => {
        const key = item.Nombre || 'Sin Proveedor';
        if (!providerGroups.has(key)) {
          providerGroups.set(key, []);
        }
        providerGroups.get(key)!.push(item);
      });

      Array.from(providerGroups.entries()).forEach(([providerName, items]) => {
        const branch = items[0]?.UD || 'Sin Sucursal';
        const providerTotal = items.reduce((sum, item) => sum + (item.Saldo || 0), 0);
        const providerOverdue = items.reduce((sum, item) => sum + (item.Vencido || 0), 0);
        const providerOnTime = providerTotal - providerOverdue;

        tableDetails.push({
          providerName,
          onTime: Math.round(providerOnTime * 100) / 100,
          overdue: Math.round(providerOverdue * 100) / 100,
          total: Math.round(providerTotal * 100) / 100,
          branch,
          month,
        });
      });
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
