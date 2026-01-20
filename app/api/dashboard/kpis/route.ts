import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("cobranza_raw").select("Total, Vencido, FINANCIAMIENTO, ANTICIPO, Dias")

    if (error) {
      console.error("Error fetching KPI data:", error)
      return NextResponse.json({ error: "Failed to fetch KPI data" }, { status: 500 })
    }

    const totalAmount = data?.reduce((sum, item) => sum + (item.Total || 0), 0) || 0
    const totalOverdue = data?.reduce((sum, item) => sum + (item.Vencido || 0), 0) || 0
    const totalFinancing = data?.reduce((sum, item) => sum + (item.FINANCIAMIENTO || 0), 0) || 0
    const totalAdvance = data?.reduce((sum, item) => sum + (item.ANTICIPO || 0), 0) || 0
    const avgDays = data?.reduce((sum, item) => sum + (item.Dias || 0), 0) / (data?.length || 1) || 0

    const kpiData = {
      totalAmount,
      totalOverdue,
      totalFinancing,
      totalAdvance,
      avgDays,
      overduePercentage: totalAmount > 0 ? (totalOverdue / totalAmount) * 100 : 0,
    }

    return NextResponse.json(kpiData)
  } catch (error) {
    console.error("Error in KPI API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
