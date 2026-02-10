"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CollectionTrendChart } from "./charts/collection-trend-chart"
import type { CobranzaData } from "@/lib/types"

interface ChartSectionProps {
  data: CobranzaData[]
}

export function ChartSection({ data }: ChartSectionProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Facturación Mensual 2025 vs 2024</CardTitle>
          <CardDescription>Comparativa de facturación mensual entre el año actual y el anterior</CardDescription>
        </CardHeader>
        <CardContent>
          <CollectionTrendChart data={data} detailed />
        </CardContent>
      </Card>
    </div>
  )
}
