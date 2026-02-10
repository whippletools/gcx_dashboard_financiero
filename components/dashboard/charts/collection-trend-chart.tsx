"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { CobranzaData } from "@/lib/types"

interface CollectionTrendChartProps {
  data: CobranzaData[]
  detailed?: boolean
}

export function CollectionTrendChart({ data, detailed = false }: CollectionTrendChartProps) {
  const processData = () => {
    const monthlyTotals: Record<string, { [year: number]: number }> = {}

    data.forEach((item) => {
      if (!item.Fecha || !item.Total) return

      const date = new Date(item.Fecha)
      const year = date.getFullYear()
      const month = date.getMonth() 

      if (year === 2024 || year === 2025) {
        if (!monthlyTotals[month]) {
          monthlyTotals[month] = {}
        }
        if (!monthlyTotals[month][year]) {
          monthlyTotals[month][year] = 0
        }
        monthlyTotals[month][year] += item.Total
      }
    })

    const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"]
    
    const chartData = monthNames.map((name, index) => ({
      month: name,
      "2025": monthlyTotals[index]?.[2025] || 0,
      "2024": monthlyTotals[index]?.[2024] || 0,
    }))

    return chartData
  }

  const chartData = processData()

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toLocaleString("es-MX")} mil`
    }
    return `$${value.toLocaleString("es-MX")}`
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
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="2025"
            stroke="#3b82f6" // light blue
            strokeWidth={2}
            name="Año Actual"
            dot={{ fill: "#3b82f6" }}
          />
          <Line
            type="monotone"
            dataKey="2024"
            stroke="#1e3a8a" // dark blue
            strokeWidth={2}
            name="Año Anterior"
            dot={{ fill: "#1e3a8a" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
