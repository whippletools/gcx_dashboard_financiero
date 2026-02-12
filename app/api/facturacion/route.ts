// app/api/facturacion/route.ts
// API Route para US-007: Facturación DAC (Honorarios vs Resto)
// GET /api/facturacion?year=2024&aduanaId=ADU001

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/reco-api';
import { BillingData, MonthBillingData, AduanaBilling } from '@/types/dashboard';
import { formatMonthName } from '@/lib/utils/formatters';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const aduanaId = searchParams.get('aduanaId');

    if (isNaN(year)) {
      return NextResponse.json(
        { error: 'Parámetro year inválido.' },
        { status: 400 }
      );
    }

    // Obtener lista de aduanas usando API RECO
    const aduanasQuery = `
      SELECT DISTINCT UD as aduana
      FROM dbo.fn_CuentasPorCobrar_Excel('${year}-12-31', 1)
      WHERE UD IS NOT NULL AND RFC NOT LIKE '%INTERNO%'
    `;
    
    const aduanasResult = await executeQuery(aduanasQuery);
    const uniqueAduanas = (aduanasResult.data || []).map((row: any) => row.aduana || row.UD).filter(Boolean);

    // Obtener datos mensuales de facturación
    const aduanas: AduanaBilling[] = [];
    const months: string[] = [];

    // Generar nombres de meses
    for (let month = 1; month <= 12; month++) {
      months.push(formatMonthName(month));
    }

    // Si se especifica una aduana, obtener datos solo de esa
    // Si no, agregar datos de todas las aduanas
    const aduanasToProcess = aduanaId && aduanaId !== 'all' 
      ? [aduanaId] 
      : uniqueAduanas.slice(0, 10); // Limitar a primeras 10 aduanas para rendimiento

    for (const aduana of aduanasToProcess) {
      const monthlyData: MonthBillingData[] = [];
      let totalHonorarios = 0;
      let totalOtros = 0;

      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        // Query usando API RECO
        const query = `
          SELECT 
            [TOTAL HON] as TotalHonorarios,
            [TOTAL COMPL] as TotalComplementos
          FROM dbo.fn_CuentasPorCobrar_Excel('${endDate}', 1)
          WHERE Fecha >= '${startDate}' AND Fecha <= '${endDate}'
          ${aduanaId && aduanaId !== 'all' ? `AND (UD = '${aduana}' OR AA = '${aduana}')` : ''}
        `;

        const result = await executeQuery(query);

        if (!result.success) {
          console.warn(`Error fetching billing data for aduana ${aduana} month ${month}:`, result.error);
        }

        const validData = result.data || [];

        // Calcular totales
        // TOTAL HON = Honorarios (parte inferior - azul)
        // TOTAL COMPL = Otros (parte superior - negro)
        const honorarios = validData.reduce((sum, item) => sum + (item.TotalHonorarios || item['TOTAL HON'] || 0), 0);
        const otros = validData.reduce((sum, item) => sum + (item.TotalComplementos || item['TOTAL COMPL'] || 0), 0);

        monthlyData.push({
          month,
          monthName: formatMonthName(month),
          honorarios: Math.round(honorarios * 100) / 100,
          otros: Math.round(otros * 100) / 100,
          total: Math.round((honorarios + otros) * 100) / 100,
        });

        totalHonorarios += honorarios;
        totalOtros += otros;
      }

      const totalGeneral = totalHonorarios + totalOtros;

      aduanas.push({
        id: aduana,
        name: aduana,
        monthlyData,
        average: totalGeneral > 0 ? totalGeneral / 12 : 0,
        totalHonorarios: Math.round(totalHonorarios * 100) / 100,
        totalOtros: Math.round(totalOtros * 100) / 100,
      });
    }

    const response: BillingData = {
      aduanas,
      months,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/facturacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
