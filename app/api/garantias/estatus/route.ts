// app/api/garantias/estatus/route.ts
// API Route para US-005: Estatus de Garantías
// GET /api/garantias/estatus?year=2024&idEmpresa=1

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/reco-api';
import { GuaranteeStatusData, MonthGuaranteeData, GuaranteeStatusDetail, GuaranteeStatus } from '@/types/dashboard';
import { formatMonthName } from '@/lib/utils/formatters';

// Mapeo de códigos de estatus a nombres
const STATUS_MAP: Record<number, GuaranteeStatus> = {
  1: 'Programadas',
  2: 'Naviera',
  3: 'Operacion',
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

    // Query mensual usando API RECO
    const months: MonthGuaranteeData[] = [];
    const tableDetails: GuaranteeStatusDetail[] = [];

    for (let month = 1; month <= 12; month++) {
      // Query usando sp_Estatus_Garantia
      const query = `
        SELECT 
          EstatusGarantia,
          ImporteMN,
          COUNT(*) as Cantidad
        FROM dbo.sp_Estatus_Garantia(${idEmpresa}, ${year}, ${month})
        WHERE EstatusGarantia IN (1, 2, 3)
        GROUP BY EstatusGarantia, ImporteMN
      `;

      const result = await executeQuery(query);

      if (!result.success) {
        console.warn(`Error fetching guarantee data for month ${month}:`, result.error);
      }

      const validData = result.data || [];

      // Calcular totales por estatus
      const scheduled = validData
        .filter((item) => item.EstatusGarantia === 1)
        .reduce((sum, item) => sum + (item.ImporteMN || 0), 0);
      
      const naviera = validData
        .filter((item) => item.EstatusGarantia === 2)
        .reduce((sum, item) => sum + (item.ImporteMN || 0), 0);
      
      const operation = validData
        .filter((item) => item.EstatusGarantia === 3)
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
      [1, 2, 3].forEach((statusCode) => {
        const statusAmount = validData
          .filter((item) => item.EstatusGarantia === statusCode)
          .reduce((sum, item) => sum + (item.ImporteMN || 0), 0);

        if (statusAmount > 0) {
          tableDetails.push({
            status: STATUS_MAP[statusCode],
            amount: Math.round(statusAmount * 100) / 100,
            month,
            monthName: formatMonthName(month),
          });
        }
      });
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
