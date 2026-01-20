"use client"

import { useEffect, useState } from "react"
import { KPIGrid } from "./kpi-grid"
import { ChartSection } from "./chart-section"
import { PortfolioAging } from "./portfolio-aging"
import { DashboardSkeleton } from "./dashboard-skeleton"

interface KPIData {
  totalAmount: number
  totalOverdue: number
  totalFinancing: number
  totalAdvance: number
  avgDays: number
  overduePercentage: number
}

interface CobranzaRecord {
  id: string
  cliente: string
  monto: number
  fecha_vencimiento: string
  estado: string
  dias_vencido: number
  tipo_operacion: string
  garantia: string
  [key: string]: any
}

interface AgingData {
  rango: string
  monto: number
  porcentaje: number
  color: string
}

export function DashboardOverview() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [cobranzaData, setCobranzaData] = useState<CobranzaRecord[]>([])
  const [agingData, setAgingData] = useState<AgingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [kpiResponse, cobranzaResponse, agingResponse] = await Promise.all([
          fetch("/api/dashboard/kpis"),
          fetch("/api/dashboard/cobranza"),
          fetch("/api/dashboard/aging"),
        ])

        if (!kpiResponse.ok || !cobranzaResponse.ok || !agingResponse.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const kpiResult = await kpiResponse.json()
        const cobranzaResult = await cobranzaResponse.json()
        const agingResult = await agingResponse.json()

        if (kpiResult.error || cobranzaResult.error || agingResult.error) {
          throw new Error(kpiResult.error || cobranzaResult.error || agingResult.error)
        }

        setKpiData(kpiResult)
        setCobranzaData(cobranzaResult)
        setAgingData(agingResult)
      } catch (err) {
        console.error("[v0] Error loading dashboard data:", err)
        setError("Error loading dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleKPIClick = (kpi: string) => {
    console.log(`[v0] KPI clicked: ${kpi}`)
    // TODO: Implement drill-down functionality
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error || !kpiData) {
    return <div className="text-center text-red-500 p-4">{error || "Error loading dashboard data"}</div>
  }

  return (
    <div className="space-y-6">
      <KPIGrid data={kpiData} onKPIClick={handleKPIClick} />
      <ChartSection data={cobranzaData} />
      <PortfolioAging data={agingData} />
    </div>
  )
}
