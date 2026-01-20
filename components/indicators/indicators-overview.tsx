import { getCobranzaData, getKPIData } from "@/lib/data-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export async function IndicatorsOverview() {
  const [cobranzaData, kpiData] = await Promise.all([getCobranzaData(), getKPIData()])

  if (!kpiData) {
    return <div>Error loading indicators data</div>
  }

  const indicators = [
    {
      name: "Índice de Morosidad",
      value: kpiData.overduePercentage,
      target: 10,
      unit: "%",
      description: "Porcentaje de cartera vencida",
    },
    {
      name: "Rotación de Cartera",
      value: 365 / kpiData.avgDays,
      target: 12,
      unit: "veces/año",
      description: "Veces que rota la cartera al año",
    },
    {
      name: "Días Promedio de Cobranza",
      value: kpiData.avgDays,
      target: 30,
      unit: "días",
      description: "Tiempo promedio de recuperación",
    },
    {
      name: "Eficiencia de Cobranza",
      value: 100 - kpiData.overduePercentage,
      target: 90,
      unit: "%",
      description: "Porcentaje de cartera al corriente",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {indicators.map((indicator, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{indicator.name}</CardTitle>
              <CardDescription>{indicator.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {indicator.value.toFixed(1)}
                    {indicator.unit}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Meta: {indicator.target}
                    {indicator.unit}
                  </span>
                </div>
                <Progress value={Math.min((indicator.value / indicator.target) * 100, 100)} className="w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Indicadores</CardTitle>
          <CardDescription>Estado general de los indicadores financieros</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Dashboard de indicadores detallado en desarrollo</div>
        </CardContent>
      </Card>
    </div>
  )
}
