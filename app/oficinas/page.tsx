import { Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default function OficinasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Oficinas</h1>
        <p className="text-muted-foreground text-pretty">Resumen corporativo de cartera por oficina</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Building2 className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <CardTitle className="text-title-large">US-007 - En Desarrollo</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-on-surface-variant">
            <Building2 className="w-12 h-12 opacity-30" />
            <p className="text-body-large font-medium">Resumen Corporativo por Oficina</p>
            <p className="text-body-medium text-center max-w-md">
              Próximamente: Tabla con métricas por oficina — rangos de antigüedad (01-30, 31-45, 46-60, 61-90, 91+), Saldo DAC, Clientes, Cobrado y Vencido.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
