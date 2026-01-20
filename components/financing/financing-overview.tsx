import { getCobranzaData } from "@/lib/data-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FinancingChart } from "@/components/dashboard/charts/financing-chart"

export async function FinancingOverview() {
  const cobranzaData = await getCobranzaData()

  const totalFinancing = cobranzaData.reduce((sum, item) => sum + (item.FINANCIAMIENTO || 0), 0)
  const totalAdvance = cobranzaData.reduce((sum, item) => sum + (item.ANTICIPO || 0), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Financiamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFinancing)}</div>
            <p className="text-xs text-muted-foreground">Monto total financiado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Anticipos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAdvance)}</div>
            <p className="text-xs text-muted-foreground">Anticipos otorgados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolución del Financiamiento</CardTitle>
          <CardDescription>Tendencia mensual de financiamiento vs anticipos</CardDescription>
        </CardHeader>
        <CardContent>
          <FinancingChart data={cobranzaData} />
        </CardContent>
      </Card>
    </div>
  )
}
