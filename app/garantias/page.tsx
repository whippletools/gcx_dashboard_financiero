import { Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default function GarantiasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Garantías</h1>
        <p className="text-muted-foreground text-pretty">Estatus y tendencia de cartera de garantías</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Shield className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <CardTitle className="text-title-large">US-005 / US-006 - En Desarrollo</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-on-surface-variant">
            <Shield className="w-12 h-12 opacity-30" />
            <p className="text-body-large font-medium">Módulo de Garantías</p>
            <p className="text-body-medium text-center max-w-md">
              Próximamente: Estatus de garantías (Programadas / Naviera / Operación) y tendencia de cartera de garantías vencida vs al día.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
