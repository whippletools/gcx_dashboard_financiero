"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { CobranzaData } from "@/lib/types"

interface CollectionTrendChartProps {
  data: CobranzaData[]
  detailed?: boolean
}

export function CollectionTrendChart({ data, detailed = false }: CollectionTrendChartProps) {
  const processData = () => {
    const monthlyData = data.reduce(
      (acc, item) => {
        if (!item.Fecha) return acc

        const date = new Date(item.Fecha)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            total: 0,
            overdue: 0,
            financing: 0,
            advance: 0,
            count: 0,
          }
        }

        acc[monthKey].total += item.Total || 0
        acc[monthKey].overdue += item.Vencido || 0
        acc[monthKey].financing += item.FINANCIAMIENTO || 0
        acc[monthKey].advance += item.ANTICIPO || 0
        acc[monthKey].count += 1

        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(monthlyData)
      .sort((a: any, b: any) => a.month.localeCompare(b.month))
      .slice(-12) // Last 12 months
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
    <div className={detailed ? "h-96" : "h-64"}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-muted-foreground" fontSize={12} />
          <YAxis
            className="text-muted-foreground"
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="total"
            stroke="var(--trend-line)" // Green color for trend line
            strokeWidth={2}
            name="Total"
            dot={{ fill: "var(--trend-points)" }} // Blue points
          />
          <Line
            type="monotone"
            dataKey="overdue"
            stroke="var(--overdue-color)" // Red for overdue amounts
            strokeWidth={2}
            name="Vencido"
            dot={{ fill: "var(--overdue-color)" }}
          />
          {detailed && (
            <>
              <Line
                type="monotone"
                dataKey="financing"
                stroke="var(--chart-4)" // Amber for financing
                strokeWidth={2}
                name="Financiamiento"
                dot={{ fill: "var(--chart-4)" }}
              />
              <Line
                type="monotone"
                dataKey="advance"
                stroke="var(--chart-1)" // Blue for advances
                strokeWidth={2}
                name="Anticipos"
                dot={{ fill: "var(--chart-1)" }}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
