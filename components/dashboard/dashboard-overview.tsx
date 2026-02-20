"use client"

import Link from "next/link"
import { TrendingUp, PieChart, DollarSign, Building2, Shield, FileText, ArrowRight, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const modules = [
  {
    name: "Cobranza",
    description: "Tendencia mensual de cobrado con comparativo año anterior",
    href: "/cobranza",
    icon: TrendingUp,
    color: "bg-purple-100",
    iconColor: "text-purple-700",
    status: "active",
    us: "US-001",
  },
  {
    name: "Cartera",
    description: "Antigüedad de cartera con rangos exactos y detalle por cliente",
    href: "/cartera",
    icon: PieChart,
    color: "bg-green-100",
    iconColor: "text-green-700",
    status: "active",
    us: "US-002",
  },
  {
    name: "Financiamiento",
    description: "Tendencia de financiamiento CxC DAC por facturar vs facturado",
    href: "/financiamiento",
    icon: DollarSign,
    color: "bg-purple-100",
    iconColor: "text-purple-700",
    status: "pending",
    us: "US-004",
  },
  {
    name: "Oficinas",
    description: "Resumen corporativo de cartera por oficina con métricas clave",
    href: "/oficinas",
    icon: Building2,
    color: "bg-blue-100",
    iconColor: "text-blue-700",
    status: "pending",
    us: "US-007",
  },
  {
    name: "Garantías",
    description: "Estatus y tendencia de cartera de garantías",
    href: "/garantias",
    icon: Shield,
    color: "bg-green-100",
    iconColor: "text-green-700",
    status: "pending",
    us: "US-005/006",
  },
  {
    name: "Facturación",
    description: "Facturación mensual por aduanas DAC — honorarios vs resto",
    href: "/facturacion",
    icon: FileText,
    color: "bg-orange-100",
    iconColor: "text-orange-700",
    status: "pending",
    us: "US-008",
  },
]

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => {
          const Icon = mod.icon
          const isActive = mod.status === "active"
          return (
            <Link key={mod.href} href={mod.href}>
              <Card className={`h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer border ${isActive ? "border-primary/30 hover:border-primary/60" : "border-border hover:border-border/80"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${mod.color}`}>
                      <Icon className={`w-5 h-5 ${mod.iconColor}`} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isActive ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Próximo
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <CardTitle className="text-base font-semibold">{mod.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{mod.us}</p>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm leading-relaxed">{mod.description}</CardDescription>
                  <div className="flex items-center gap-1 mt-4 text-xs font-medium text-primary">
                    {isActive ? "Ver módulo" : "Ver avance"}
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
