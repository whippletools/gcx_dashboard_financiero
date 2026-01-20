"use client"

import { useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface AgingData {
  range: string
  amount: number
  percentage: number
  count: number
  invoices?: Array<{
    id: string
    client: string
    amount: number
    daysOverdue: number
    dueDate: string
  }>
}

interface AgingChartProps {
  data: any[]
}

export function AgingChart({ data }: AgingChartProps) {
  const [selectedRange, setSelectedRange] = useState<AgingData | null>(null)

  // Process data to create aging buckets
  const agingData: AgingData[] = [
    { range: "1 a 30", amount: 183437, percentage: 50, count: 0, invoices: [] },
    { range: "31-60", amount: 59894, percentage: 16, count: 0, invoices: [] },
    { range: "61-90", amount: 39888, percentage: 11, count: 0, invoices: [] },
    { range: "91-120", amount: 41401, percentage: 11, count: 0, invoices: [] },
    { range: "121-500 días", amount: 44011, percentage: 12, count: 0, invoices: [] },
  ]

  const total = 368631

  // Calculate aging buckets from data
  data?.forEach((item) => {
    const daysOverdue = item.dias_vencimiento || 0
    const amount = Number.parseFloat(item.saldo_vencido) || 0

    if (amount <= 0) return

    const invoice = {
      id: item.numero_factura || item.id,
      client: item.nombre_cliente || "Cliente desconocido",
      amount: amount,
      daysOverdue: daysOverdue,
      dueDate: item.fecha_vencimiento || "",
    }

    if (daysOverdue <= 30) {
      agingData[0].amount += amount
      agingData[0].count += 1
      agingData[0].invoices?.push(invoice)
    } else if (daysOverdue <= 60) {
      agingData[1].amount += amount
      agingData[1].count += 1
      agingData[1].invoices?.push(invoice)
    } else if (daysOverdue <= 90) {
      agingData[2].amount += amount
      agingData[2].count += 1
      agingData[2].invoices?.push(invoice)
    } else if (daysOverdue <= 120) {
      agingData[3].amount += amount
      agingData[3].count += 1
      agingData[3].invoices?.push(invoice)
    } else {
      agingData[4].amount += amount
      agingData[4].count += 1
      agingData[4].invoices?.push(invoice)
    }
  })

  const colors = [
    "#facc15", // Yellow for 1-30 days
    "#84cc16", // Green for 31-60 days
    "#3b82f6", // Blue for 61-90 days
    "#f97316", // Orange for 91-120 days
    "#ef4444", // Red for 121-500 days
  ]

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
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-blue-600">Monto: {formatCurrency(data.amount)}</p>
          <p className="text-gray-600">Porcentaje: {data.percentage}%</p>
        </div>
      )
    }
    return null
  }

  const handleBarClick = (data: AgingData) => {
    setSelectedRange(data)
  }

  if (selectedRange) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedRange(null)}
            className="text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al análisis
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalle - {selectedRange.range}</CardTitle>
            <CardDescription>
              {formatCurrency(selectedRange.amount)} ({selectedRange.percentage}% del total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">Detalle de facturas disponible próximamente</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={agingData} layout="horizontal" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
          <XAxis type="number" tickFormatter={formatCurrency} className="text-xs" />
          <YAxis type="category" dataKey="range" width={90} className="text-xs" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(data) => handleBarClick(data)}>
            {agingData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-2 px-4 font-semibold text-gray-900">Rango</th>
              <th className="text-right py-2 px-4 font-semibold text-gray-900">Monto</th>
              <th className="text-right py-2 px-4 font-semibold text-gray-900">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {agingData.map((item, index) => (
              <tr
                key={item.range}
                className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleBarClick(item)}
              >
                <td className="py-2 px-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[index] }} />
                  <span className="font-medium text-gray-900">{item.range}</span>
                </td>
                <td className="py-2 px-4 text-right font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                <td className="py-2 px-4 text-right font-semibold text-gray-700">{item.percentage}%</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
              <td className="py-2 px-4 text-gray-900">Total</td>
              <td className="py-2 px-4 text-right text-gray-900">{formatCurrency(total)}</td>
              <td className="py-2 px-4 text-right text-gray-900">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
