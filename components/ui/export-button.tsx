"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet, FileJson } from "lucide-react"
import { exportToCSV, exportToJSON, generatePDFReport } from "@/lib/export-utils"
import type { CobranzaData } from "@/lib/types"

interface ExportButtonProps {
  data: CobranzaData[]
  filename?: string
  reportType?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function ExportButton({
  data,
  filename = "export",
  reportType = "general",
  variant = "outline",
  size = "sm",
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    setIsExporting(true)
    console.log(`[v0] Exporting ${data.length} records as ${format}`)

    try {
      switch (format) {
        case "csv":
          exportToCSV(data, filename)
          break
        case "json":
          exportToJSON(data, filename)
          break
        case "pdf":
          generatePDFReport(data, reportType)
          break
      }
    } catch (error) {
      console.error("[v0] Export error:", error)
      alert("Error al exportar los datos")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting || !data.length}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exportando..." : "Exportar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Formato de Exportación</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="h-4 w-4 mr-2" />
          Exportar JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileText className="h-4 w-4 mr-2" />
          Generar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
