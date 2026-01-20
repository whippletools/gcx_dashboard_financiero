import { getCobranzaData, getKPIData } from "@/lib/data-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OverdueChart } from "@/components/dashboard/charts/overdue-chart"
import { ClientDistributionChart } from "@/components/dashboard/charts/client-distribution-chart"
import { AgingChart } from "@/components/dashboard/charts/aging-chart"
import { PortfolioKPIGrid } from "./portfolio-kpi-grid"

export async function PortfolioOverview() {
  const [cobranzaData, kpiData] = await Promise.all([getCobranzaData(), getKPIData()])

  if (!kpiData) {
    return <div>Error loading portfolio data</div>
  }

  return (
    <div className="space-y-6">
      <PortfolioKPIGrid data={kpiData} />

      {/* Section 1: Estado de Cartera */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Cartera</CardTitle>
          <CardDescription>Análisis de cartera al corriente vs vencida</CardDescription>
        </CardHeader>
        <CardContent>
          <OverdueChart data={cobranzaData} />
        </CardContent>
      </Card>

      {/* Section 2: Por Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Por Cliente</CardTitle>
          <CardDescription>Clientes con mayor exposición</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientDistributionChart data={cobranzaData} />
        </CardContent>
      </Card>

      {/* Section 3: Antigüedad */}
      <Card>
        <CardHeader>
          <CardTitle>Antigüedad</CardTitle>
          <CardDescription>Distribución por días de vencimiento</CardDescription>
        </CardHeader>
        <CardContent>
          <AgingChart data={cobranzaData} />
        </CardContent>
      </Card>
    </div>
  )
}
