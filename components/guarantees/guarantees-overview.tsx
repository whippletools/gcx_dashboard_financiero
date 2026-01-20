import { getCobranzaData } from "@/lib/data-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export async function GuaranteesOverview() {
  const cobranzaData = await getCobranzaData()

  const guaranteeData = cobranzaData.filter((item) => (item.FINANCIAMIENTO || 0) > 0)

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Garantías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guaranteeData.length}</div>
            <p className="text-xs text-muted-foreground">Garantías activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monto Garantizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(guaranteeData.reduce((sum, item) => sum + (item.FINANCIAMIENTO || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Total garantizado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Riesgo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Medio</div>
            <p className="text-xs text-muted-foreground">Nivel de riesgo</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Garantías Activas</CardTitle>
          <CardDescription>Lista de garantías otorgadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {guaranteeData.slice(0, 10).map((item, index) => (
              <div key={item.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{item.NOMBRE || item.Cliente || "Cliente Sin Nombre"}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Pedido: {item.PEDIDO || "N/A"}</Badge>
                    <Badge variant="secondary">RFC: {item.rfc || "N/A"}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(item.FINANCIAMIENTO || 0)}</p>
                  <p className="text-sm text-muted-foreground">Garantía</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
