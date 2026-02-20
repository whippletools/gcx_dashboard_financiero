import { NextResponse } from "next/server"
import { executeQueryWithRetry } from "@/lib/reco-api"

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date()
    const fechaCorte = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const query = `
      SELECT
        Nombre, RFC, Saldo, Vencido, Tiempo,
        DiasTranscurridos, DiasCredito,
        NombreSucursal AS Sucursal,
        Honorarios, Complementarios
      FROM dbo.fn_CuentasPorCobrar_Excel('${fechaCorte}', 1)
      WHERE TipoCliente = 'Externo'
    `

    const result = await executeQueryWithRetry(query, { useCache: true, retries: 1 })

    if (!result.success || !result.data) {
      console.error("Error fetching cobranza data via RECO:", result.error)
      return NextResponse.json({ error: "Failed to fetch cobranza data" }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("Error in cobranza API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
