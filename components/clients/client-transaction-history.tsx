import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import type { CobranzaData } from "@/lib/types"

interface ClientTransactionHistoryProps {
  data: CobranzaData[]
}

export function ClientTransactionHistory({ data }: ClientTransactionHistoryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("es-MX")
  }

  const getStatusBadge = (item: CobranzaData) => {
    const overdueAmount = item.Vencido || 0
    const total = item.Total || 0

    if (overdueAmount > 0) {
      return <Badge variant="destructive">Vencido</Badge>
    } else if (total > 0) {
      return <Badge variant="secondary">Al Corriente</Badge>
    }
    return <Badge variant="outline">Completado</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Transacciones</CardTitle>
        <CardDescription>Todas las operaciones del cliente</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={item.id || index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <p className="font-medium">Pedido: {item.PEDIDO || "N/A"}</p>
                  {getStatusBadge(item)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Fecha:</span> {formatDate(item.Fecha)}
                  </div>
                  <div>
                    <span className="font-medium">Días:</span> {item.Dias || 0}
                  </div>
                  <div>
                    <span className="font-medium">Producto:</span> {item["Pdto."] || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Referencia:</span> {item.Referen || "N/A"}
                  </div>
                </div>
                {item.OBS && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Observaciones:</span> {item.OBS}
                  </div>
                )}
              </div>
              <div className="text-right space-y-1 mr-4">
                <p className="font-semibold text-lg">{formatCurrency(item.Total || 0)}</p>
                {(item.Vencido || 0) > 0 && (
                  <p className="text-sm text-destructive">Vencido: {formatCurrency(item.Vencido || 0)}</p>
                )}
                {(item.FINANCIAMIENTO || 0) > 0 && (
                  <p className="text-sm text-primary">Financ: {formatCurrency(item.FINANCIAMIENTO || 0)}</p>
                )}
                {(item.ANTICIPO || 0) > 0 && (
                  <p className="text-sm text-secondary-foreground">Anticipo: {formatCurrency(item.ANTICIPO || 0)}</p>
                )}
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
