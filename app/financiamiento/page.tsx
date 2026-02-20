import { DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default function FinanciamientoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Financiamiento</h1>
        <p className="text-muted-foreground text-pretty">Tendencia de financiamiento CxC DAC por facturar vs facturado</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <DollarSign className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <CardTitle className="text-title-large">US-004 - En Desarrollo</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-on-surface-variant">
            <DollarSign className="w-12 h-12 opacity-30" />
            <p className="text-body-large font-medium">Módulo de Financiamiento</p>
            <p className="text-body-medium text-center max-w-md">
              Próximamente: Tendencia de financiamiento CxC DAC con filtro por oficina y desglose por tipo (FinanciadoPTE / FinanciadoFAC).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
