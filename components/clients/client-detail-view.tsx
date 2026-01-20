import { getClientData } from "@/lib/data-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, Mail } from "lucide-react"
import Link from "next/link"
import { ClientTransactionHistory } from "./client-transaction-history"
import { ClientKPIs } from "./client-kpis"
import { ClientPaymentChart } from "./client-payment-chart"

interface ClientDetailViewProps {
  clientId: string
}

export async function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const clientData = await getClientData(clientId)

  if (!clientData.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron datos para este cliente</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const clientInfo = clientData[0]
  const totalAmount = clientData.reduce((sum, item) => sum + (item.Total || 0), 0)
  const overdueAmount = clientData.reduce((sum, item) => sum + (item.Vencido || 0), 0)
  const financingAmount = clientData.reduce((sum, item) => sum + (item.FINANCIAMIENTO || 0), 0)

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground text-balance">
              {clientInfo.NOMBRE || clientInfo.Cliente || "Cliente Sin Nombre"}
            </h1>
            <p className="text-muted-foreground">ID: {clientId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Contactar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">RFC</p>
              <p className="text-lg font-semibold">{clientInfo.rfc || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Operaciones</p>
              <p className="text-lg font-semibold">{clientData.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
              <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <div className="flex items-center space-x-2">
                {overdueAmount > 0 ? (
                  <Badge variant="destructive">Vencido</Badge>
                ) : (
                  <Badge variant="secondary">Al Corriente</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <ClientKPIs
        totalAmount={totalAmount}
        overdueAmount={overdueAmount}
        financingAmount={financingAmount}
        operationsCount={clientData.length}
      />

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="payments">Historial de Pagos</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <ClientTransactionHistory data={clientData} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Pagos</CardTitle>
              <CardDescription>Historial de pagos y tendencias</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientPaymentChart data={clientData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Comportamiento</CardTitle>
              <CardDescription>Patrones de pago y riesgo crediticio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">Análisis de comportamiento en desarrollo</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
