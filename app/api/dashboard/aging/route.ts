import { NextResponse } from "next/server"
import { getDistribucionAntiguedad } from "@/lib/data-service"

export async function GET() {
  try {
    const distribucion = await getDistribucionAntiguedad()

    // Map the data to match the component's expected format
    const agingData = distribucion.map((item) => ({
      rango: item.rango,
      monto: item.total,
      porcentaje: item.porcentaje || 0,
      color: item.color,
    }))

    return NextResponse.json(agingData)
  } catch (error) {
    console.error("Error fetching aging data:", error)
    return NextResponse.json({ error: "Failed to fetch aging data" }, { status: 500 })
  }
}
