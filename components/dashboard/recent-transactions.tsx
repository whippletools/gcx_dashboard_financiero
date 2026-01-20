"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { ExportButton } from "@/components/ui/export-button"
import type { CobranzaData } from "@/lib/types"

interface RecentTransactionsProps {
  data: CobranzaData[]
}

export function RecentTransactions({ data }: RecentTransactionsProps) {
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
    return <Badge variant="outline">Sin Datos</Badge>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transacciones Recientes</CardTitle>
          <CardDescription>Últimas operaciones registradas</CardDescription>
        </div>
        <ExportButton data={data} filename="transacciones_recientes" reportType="transactions" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={item.id || index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-foreground">{item.NOMBRE || item.Cliente || "Cliente Sin Nombre"}</p>
                  {getStatusBadge(item)}
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Pedido: {item.PEDIDO || "N/A"}</span>
                  <span>Fecha: {formatDate(item.Fecha)}</span>
                  <span>Días: {item.Dias || 0}</span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="font-semibold text-foreground">{formatCurrency(item.Total || 0)}</p>
                {(item.Vencido || 0) > 0 && (
                  <p className="text-sm text-destructive">Vencido: {formatCurrency(item.Vencido || 0)}</p>
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
  )
}
