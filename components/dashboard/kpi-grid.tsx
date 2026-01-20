"use client"

import { KPICard } from "./kpi-card"
import { exportKPIReport } from "@/lib/export-utils"

interface KPIData {
  totalAmount: number
  totalOverdue: number
  totalFinancing: number
  totalAdvance: number
  avgDays: number
  overduePercentage: number
}

interface KPIGridProps {
  data: KPIData
  onKPIClick?: (kpi: string) => void
}

export function KPIGrid({ data, onKPIClick }: KPIGridProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const handleExportKPIs = () => {
    console.log("[v0] Exporting KPI report")
    exportKPIReport(data, "indicadores_financieros")
  }

  const kpis = [
    {
      title: "Monto total de la cartera",
      value: formatCurrency(data.totalAmount),
      key: "total",
    },
    {
      title: "Monto vencido",
      value: formatCurrency(data.totalOverdue),
      key: "overdue",
    },
    {
      title: "Total financiado",
      value: formatCurrency(data.totalFinancing),
      key: "financing",
    },
    {
      title: "Anticipos otorgados",
      value: formatCurrency(data.totalAdvance),
      key: "advance",
    },
    {
      title: "Tiempo promedio de cobranza",
      value: Math.round(data.avgDays).toString(),
      key: "avgDays",
    },
    {
      title: "Tasa de recuperación",
      value: formatPercentage(100 - data.overduePercentage),
      key: "efficiency",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Indicadores Clave</h2>
        <button
          onClick={handleExportKPIs}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Exportar KPIs
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <KPICard key={kpi.key} title={kpi.title} value={kpi.value} onClick={() => onKPIClick?.(kpi.key)} />
        ))}
      </div>
    </div>
  )
}
