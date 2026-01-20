"use client"

import { KPICard } from "../dashboard/kpi-card"
import { exportKPIReport } from "@/lib/export-utils"
import { DollarSign, AlertTriangle } from "lucide-react"

interface KPIData {
  totalAmount: number
  totalOverdue: number
  overduePercentage: number
}

interface PortfolioKPIGridProps {
  data: KPIData
  onKPIClick?: (kpi: string) => void
}

export function PortfolioKPIGrid({ data, onKPIClick }: PortfolioKPIGridProps) {
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
    console.log("[v0] Exporting Portfolio KPI report")
    exportKPIReport(data, "indicadores_cartera")
  }

  const kpis = [
    {
      title: "Monto Total",
      value: formatCurrency(data.totalAmount),
      change: "+12.5%",
      trend: "up" as const,
      icon: <DollarSign className="h-4 w-4" />,
      description: "Total de la cartera",
      key: "total",
    },
    {
      title: "Vencido",
      value: formatCurrency(data.totalOverdue),
      change: formatPercentage(data.overduePercentage),
      trend: data.overduePercentage > 15 ? ("down" as const) : ("neutral" as const),
      icon: <AlertTriangle className="h-4 w-4" />,
      description: "Monto vencido",
      key: "overdue",
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
      <div className="grid gap-4 md:grid-cols-2">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.key}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            trend={kpi.trend}
            icon={kpi.icon}
            description={kpi.description}
            onClick={() => onKPIClick?.(kpi.key)}
          />
        ))}
      </div>
    </div>
  )
}
