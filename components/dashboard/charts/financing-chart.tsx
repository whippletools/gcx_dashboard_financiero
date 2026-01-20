"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { CobranzaData } from "@/lib/types"

interface FinancingChartProps {
  data: CobranzaData[]
}

export function FinancingChart({ data }: FinancingChartProps) {
  const processData = () => {
    const monthlyData = data.reduce(
      (acc, item) => {
        if (!item.Fecha) return acc

        const date = new Date(item.Fecha)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            financing: 0,
            advance: 0,
          }
        }

        acc[monthKey].financing += item.FINANCIAMIENTO || 0
        acc[monthKey].advance += item.ANTICIPO || 0

        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(monthlyData)
      .sort((a: any, b: any) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
      .map((item: any) => ({
        ...item,
        month: new Date(item.month + "-01").toLocaleDateString("es-MX", {
          month: "short",
          year: "2-digit",
        }),
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
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-muted-foreground" fontSize={12} />
          <YAxis
            className="text-muted-foreground"
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="financing" fill="var(--chart-4)" name="Financiamiento" radius={[4, 4, 0, 0]} /> // Amber for
          financing
          <Bar dataKey="advance" fill="var(--chart-1)" name="Anticipos" radius={[4, 4, 0, 0]} /> // Blue for advances
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
