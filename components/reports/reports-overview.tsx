import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, BarChart3, PieChart, TrendingUp } from "lucide-react"

export async function ReportsOverview() {
  const reports = [
    {
      name: "Reporte de Cartera",
      description: "Estado completo de la cartera de clientes",
      icon: <FileText className="h-5 w-5" />,
      type: "PDF",
      lastGenerated: "2024-01-15",
    },
    {
      name: "Análisis de Morosidad",
      description: "Detalle de cuentas vencidas y en riesgo",
      icon: <BarChart3 className="h-5 w-5" />,
      type: "Excel",
      lastGenerated: "2024-01-14",
    },
    {
      name: "Indicadores Financieros",
      description: "KPIs y métricas de desempeño",
      icon: <TrendingUp className="h-5 w-5" />,
      type: "PDF",
      lastGenerated: "2024-01-13",
    },
    {
      name: "Distribución por Cliente",
      description: "Análisis de concentración de cartera",
      icon: <PieChart className="h-5 w-5" />,
      type: "Excel",
      lastGenerated: "2024-01-12",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Reportes Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">Tipos de reportes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Última Generación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hoy</div>
            <p className="text-xs text-muted-foreground">Reportes actualizados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reportes Disponibles</CardTitle>
          <CardDescription>Generar y descargar reportes personalizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-muted rounded-lg">{report.icon}</div>
                  <div className="space-y-1">
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{report.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Último: {new Date(report.lastGenerated).toLocaleDateString("es-MX")}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Generar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
