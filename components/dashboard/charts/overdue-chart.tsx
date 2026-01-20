"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { CobranzaData } from "@/lib/types"

interface OverdueChartProps {
  data: CobranzaData[]
}

export function OverdueChart({ data }: OverdueChartProps) {
  const processData = () => {
    const totalAmount = data.reduce((sum, item) => sum + (item.Total || 0), 0)
    const overdueAmount = data.reduce((sum, item) => sum + (item.Vencido || 0), 0)
    const currentAmount = totalAmount - overdueAmount

    return [
      {
        name: "Al Corriente",
        value: currentAmount,
        fill: "var(--current-color)", // Green for current amounts
      },
      {
        name: "Vencido",
        value: overdueAmount,
        fill: "var(--overdue-color)", // Red for overdue amounts
      },
    ]
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-primary">{formatCurrency(data.value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
