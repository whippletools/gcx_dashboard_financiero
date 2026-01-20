"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string
  onClick?: () => void
  className?: string
}

export function KPICard({ title, value, onClick, className }: KPICardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className,
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  )
}
