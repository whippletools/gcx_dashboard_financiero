import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/reco-api"

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date()
    const fechaCorte = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const query = `
      SELECT
        SUM(Saldo) AS TotalSaldo,
        SUM(Vencido) AS TotalVencido,
        SUM(Tiempo) AS TotalTiempo,
        AVG(DiasTranscurridos) AS PromDias,
        COUNT(*) AS TotalRegistros
      FROM dbo.fn_CuentasPorCobrar_Excel('${fechaCorte}', 1)
      WHERE TipoCliente = 'Externo'
    `

    const result = await executeQuery(query)

    if (!result.success || !result.data || result.data.length === 0) {
      console.error("Error fetching KPI data via RECO:", result.error)
      return NextResponse.json({ error: "Failed to fetch KPI data" }, { status: 500 })
    }

    const row = result.data[0]
    const totalAmount = row.TotalSaldo || 0
    const totalOverdue = row.TotalVencido || 0

    const kpiData = {
      totalAmount,
      totalOverdue,
      totalFinancing: 0,
      totalAdvance: 0,
      avgDays: Math.round(row.PromDias || 0),
      overduePercentage: totalAmount > 0 ? (totalOverdue / totalAmount) * 100 : 0,
    }

    return NextResponse.json(kpiData)
  } catch (error) {
    console.error("Error in KPI API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
