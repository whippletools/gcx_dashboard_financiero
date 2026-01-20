import { Suspense } from "react"
import { IndicatorsOverview } from "@/components/indicators/indicators-overview"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function IndicatorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Indicadores Financieros</h1>
        <p className="text-muted-foreground text-pretty">Métricas clave de desempeño financiero y operativo</p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <IndicatorsOverview />
      </Suspense>
    </div>
  )
}
