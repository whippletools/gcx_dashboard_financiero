"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface AgingData {
  rango: string
  monto: number
  porcentaje: number
  color: string
}

interface PortfolioAgingProps {
  data: AgingData[]
}

export function PortfolioAging({ data }: PortfolioAgingProps) {
  const totalAmount = data.reduce((sum, item) => sum + item.monto, 0)

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
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(payload[0].value)}</p>
          <p className="text-sm text-muted-foreground">{payload[0].payload.porcentaje.toFixed(1)}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Antigüedad de Cartera</CardTitle>
        <CardDescription>Distribución de la cartera por rangos de antigüedad</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Data Table */}
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Rango</th>
                    <th className="text-right p-3 text-sm font-semibold">Monto</th>
                    <th className="text-right p-3 text-sm font-semibold">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-medium">{item.rango}</span>
                        </div>
                      </td>
                      <td className="text-right p-3 text-sm font-mono">{formatCurrency(item.monto)}</td>
                      <td className="text-right p-3 text-sm font-semibold">{item.porcentaje.toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-semibold">
                    <td className="p-3 text-sm">Total</td>
                    <td className="text-right p-3 text-sm font-mono">{formatCurrency(totalAmount)}</td>
                    <td className="text-right p-3 text-sm">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ porcentaje }) => `${porcentaje.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="monto"
                  nameKey="rango"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => <span className="text-sm text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
