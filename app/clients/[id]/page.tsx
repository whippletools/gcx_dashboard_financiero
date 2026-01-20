import { Suspense } from "react"
import { ClientDetailView } from "@/components/clients/client-detail-view"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { notFound } from "next/navigation"

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <ClientDetailView clientId={id} />
      </Suspense>
    </div>
  )
}
