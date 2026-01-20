"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { CobranzaData } from "@/lib/types"

interface ClientDistributionChartProps {
  data: CobranzaData[]
}

export function ClientDistributionChart({ data }: ClientDistributionChartProps) {
  const processData = () => {
    const clientData = data.reduce(
      (acc, item) => {
        const clientName = item.NOMBRE || item.Cliente || "Sin Nombre"

        if (!acc[clientName]) {
          acc[clientName] = {
            name: clientName,
            total: 0,
            overdue: 0,
            count: 0,
          }
        }

        acc[clientName].total += item.Total || 0
        acc[clientName].overdue += item.Vencido || 0
        acc[clientName].count += 1

        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(clientData)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10) // Top 10 clients
      .map((item: any) => ({
        ...item,
        name: item.name.length > 20 ? item.name.substring(0, 20) + "..." : item.name,
      }))
  }

  const chartData = processData()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <p className="text-primary">Total: {formatCurrency(data.total)}</p>
          <p className="text-destructive">Vencido: {formatCurrency(data.overdue)}</p>
          <p className="text-muted-foreground">Operaciones: {data.count}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            className="text-muted-foreground"
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <YAxis type="category" dataKey="name" className="text-muted-foreground" fontSize={12} width={120} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" fill="var(--chart-1)" radius={[0, 4, 4, 0]} /> // Blue for client totals
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
