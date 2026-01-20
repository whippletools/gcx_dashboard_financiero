import { Suspense } from "react"
import { ClientsOverview } from "@/components/clients/clients-overview"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Clientes</h1>
        <p className="text-muted-foreground text-pretty">Directorio de clientes y análisis de comportamiento</p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <ClientsOverview />
      </Suspense>
    </div>
  )
}
