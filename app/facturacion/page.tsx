import { FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default function FacturacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Facturación</h1>
        <p className="text-muted-foreground text-pretty">Facturación mensual por aduanas DAC — honorarios vs resto</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <FileText className="w-6 h-6 text-orange-700" />
            </div>
            <div>
              <CardTitle className="text-title-large">US-008 - En Desarrollo</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-on-surface-variant">
            <FileText className="w-12 h-12 opacity-30" />
            <p className="text-body-large font-medium">Módulo de Facturación DAC</p>
            <p className="text-body-medium text-center max-w-md">
              Próximamente: Barras apiladas por aduana con honorarios (azul) vs otros cargos (gris), línea de promedio mensual y detalle histórico por aduana.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
