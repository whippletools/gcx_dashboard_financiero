import { getCobranzaData } from "@/lib/data-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Eye } from "lucide-react"
import { ExportButton } from "@/components/ui/export-button"

export async function ClientsOverview() {
  const cobranzaData = await getCobranzaData()

  const clientsData = cobranzaData.reduce(
    (acc, item) => {
      const clientKey = item["NO CLIENTE"] || item.Cliente || "Sin ID"

      if (!acc[clientKey]) {
        acc[clientKey] = {
          id: clientKey,
          name: item.NOMBRE || item.Cliente || "Cliente Sin Nombre",
          rfc: item.rfc || "N/A",
          total: 0,
          overdue: 0,
          operations: 0,
          lastOperation: item.Fecha,
        }
      }

      acc[clientKey].total += item.Total || 0
      acc[clientKey].overdue += item.Vencido || 0
      acc[clientKey].operations += 1

      if (item.Fecha && (!acc[clientKey].lastOperation || item.Fecha > acc[clientKey].lastOperation)) {
        acc[clientKey].lastOperation = item.Fecha
      }

      return acc
    },
    {} as Record<string, any>,
  )

  const clients = Object.values(clientsData).sort((a: any, b: any) => b.total - a.total)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente por nombre o RFC..." className="pl-8" />
        </div>
        <Button>Buscar</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Clientes activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Clientes con Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.filter((c: any) => c.total > 0).length}</div>
            <p className="text-xs text-muted-foreground">Con operaciones pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Clientes Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.filter((c: any) => c.overdue > 0).length}</div>
            <p className="text-xs text-muted-foreground">Con saldo vencido</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Directorio de Clientes</CardTitle>
            <CardDescription>Lista completa de clientes y su estado</CardDescription>
          </div>
          <ExportButton data={cobranzaData} filename="directorio_clientes" reportType="clients" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.slice(0, 20).map((client: any, index) => (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{client.name}</p>
                    {client.overdue > 0 && <Badge variant="destructive">Vencido</Badge>}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>ID: {client.id}</span>
                    <span>RFC: {client.rfc}</span>
                    <span>Operaciones: {client.operations}</span>
                    <span>Última: {formatDate(client.lastOperation)}</span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold">{formatCurrency(client.total)}</p>
                  {client.overdue > 0 && (
                    <p className="text-sm text-destructive">Vencido: {formatCurrency(client.overdue)}</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="ml-4">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
