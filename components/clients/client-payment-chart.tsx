"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { CobranzaData } from "@/lib/types"

interface ClientPaymentChartProps {
  data: CobranzaData[]
}

export function ClientPaymentChart({ data }: ClientPaymentChartProps) {
  const processData = () => {
    return data
      .filter((item) => item.Fecha)
      .sort((a, b) => new Date(a.Fecha!).getTime() - new Date(b.Fecha!).getTime())
      .map((item) => ({
        date: new Date(item.Fecha!).toLocaleDateString("es-MX", {
          month: "short",
          day: "numeric",
        }),
        total: item.Total || 0,
        overdue: item.Vencido || 0,
        financing: item.FINANCIAMIENTO || 0,
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
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" className="text-muted-foreground" fontSize={12} />
          <YAxis
            className="text-muted-foreground"
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            name="Total"
            dot={{ fill: "hsl(var(--chart-1))" }}
          />
          <Line
            type="monotone"
            dataKey="overdue"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            name="Vencido"
            dot={{ fill: "hsl(var(--chart-2))" }}
          />
          <Line
            type="monotone"
            dataKey="financing"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            name="Financiamiento"
            dot={{ fill: "hsl(var(--chart-3))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
