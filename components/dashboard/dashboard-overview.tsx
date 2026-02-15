"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KPIGrid } from "./kpi-grid"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { CollectionTrendChart } from "@/components/charts/CollectionTrendChart"
import { AgingAnalysis } from "@/components/charts/AgingAnalysis"
import { PortfolioTrendChart } from "@/components/charts/PortfolioTrendChart"
import { FinancingTrendChart } from "@/components/charts/FinancingTrendChart"
import { OfficeSummaryTable } from "@/components/tables/OfficeSummaryTable"
import { GuaranteeStatusTable } from "@/components/tables/GuaranteeStatusTable"
import { GuaranteeTrendChart } from "@/components/charts/GuaranteeTrendChart"
import { BillingChart } from "@/components/charts/BillingChart"
import { useCollectionTrend, useAgingData, usePortfolioTrend, useFinancingTrend, useOfficeSummary, useGuaranteeStatus, useGuaranteeTrend } from "@/hooks"

export function DashboardOverview() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedOffice, setSelectedOffice] = useState<string | undefined>(undefined)

  // Hooks para datos
  const { data: collectionData, isLoading: isLoadingCollection } = useCollectionTrend({ year: selectedYear, idEmpresa: 1 })
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: agingData, isLoading: isLoadingAging } = useAgingData({ fechaCorte: todayStr, idEmpresa: 1 })
  const { data: portfolioData, isLoading: isLoadingPortfolio } = usePortfolioTrend({ year: selectedYear, idEmpresa: 1 })
  const { data: financingData, isLoading: isLoadingFinancing } = useFinancingTrend({ year: selectedYear, idEmpresa: 1, officeId: selectedOffice })
  const { data: officeSummaryData, isLoading: isLoadingOffices } = useOfficeSummary({ fechaCorte: todayStr, idEmpresa: 1 })
  const { data: guaranteeStatusData, isLoading: isLoadingGuaranteeStatus } = useGuaranteeStatus({ year: selectedYear, idEmpresa: 1 })
  const { data: guaranteeTrendData, isLoading: isLoadingGuaranteeTrend } = useGuaranteeTrend({ year: selectedYear, idEmpresa: 1 })

  const isLoading = isLoadingCollection || isLoadingAging || isLoadingPortfolio || isLoadingFinancing || 
                    isLoadingOffices || isLoadingGuaranteeStatus || isLoadingGuaranteeTrend

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-body-medium text-on-surface-variant">Año:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-surface-container rounded-lg border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      <Tabs defaultValue="cobranza" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="cobranza">Cobranza</TabsTrigger>
          <TabsTrigger value="cartera">Cartera</TabsTrigger>
          <TabsTrigger value="financiamiento">Financiamiento</TabsTrigger>
          <TabsTrigger value="oficinas">Oficinas</TabsTrigger>
          <TabsTrigger value="garantias">Garantías</TabsTrigger>
          <TabsTrigger value="facturacion">Facturación</TabsTrigger>
        </TabsList>

        {/* Tab: Cobranza */}
        <TabsContent value="cobranza" className="space-y-6">
          <div className="grid gap-6">
            {collectionData && (
              <CollectionTrendChart data={collectionData} />
            )}
          </div>
        </TabsContent>

        {/* Tab: Cartera */}
        <TabsContent value="cartera" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-1">
            {agingData && (
              <AgingAnalysis data={agingData} />
            )}
            {portfolioData && (
              <PortfolioTrendChart data={portfolioData} />
            )}
          </div>
        </TabsContent>

        {/* Tab: Financiamiento */}
        <TabsContent value="financiamiento" className="space-y-6">
          <div className="grid gap-6">
            {financingData && (
              <FinancingTrendChart 
                data={financingData} 
                onOfficeChange={setSelectedOffice}
              />
            )}
          </div>
        </TabsContent>

        {/* Tab: Oficinas */}
        <TabsContent value="oficinas" className="space-y-6">
          <div className="grid gap-6">
            {officeSummaryData && (
              <OfficeSummaryTable data={officeSummaryData} />
            )}
          </div>
        </TabsContent>

        {/* Tab: Garantías */}
        <TabsContent value="garantias" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-1">
            {guaranteeStatusData && (
              <GuaranteeStatusTable data={guaranteeStatusData} />
            )}
            {guaranteeTrendData && (
              <GuaranteeTrendChart data={guaranteeTrendData} />
            )}
          </div>
        </TabsContent>

        {/* Tab: Facturación */}
        <TabsContent value="facturacion" className="space-y-6">
          <div className="grid gap-6">
            <BillingChart 
              data={{ 
                aduanas: [], 
                months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] 
              }} 
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
