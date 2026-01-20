import type { CobranzaData } from "@/lib/types"

export function exportToCSV(data: CobranzaData[], filename = "cobranza_data") {
  if (!data.length) return

  const headers = [
    "ID",
    "Fecha",
    "Cliente",
    "RFC",
    "Pedido",
    "Total",
    "Vencido",
    "Financiamiento",
    "Anticipo",
    "Días",
    "Producto",
    "Observaciones",
  ]

  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      [
        row.id || "",
        row.Fecha || "",
        `"${row.NOMBRE || row.Cliente || ""}"`,
        row.rfc || "",
        row.PEDIDO || "",
        row.Total || 0,
        row.Vencido || 0,
        row.FINANCIAMIENTO || 0,
        row.ANTICIPO || 0,
        row.Dias || 0,
        `"${row["Pdto."] || ""}"`,
        `"${row.OBS || ""}"`,
      ].join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToJSON(data: any, filename = "data") {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.json`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generatePDFReport(data: CobranzaData[], reportType = "general") {
  // This would integrate with a PDF generation library like jsPDF or Puppeteer
  // For now, we'll show a placeholder implementation
  console.log(`[v0] Generating PDF report: ${reportType}`)
  console.log(`[v0] Data records: ${data.length}`)

  // Placeholder: In a real implementation, you would:
  // 1. Use jsPDF or similar library to create PDF
  // 2. Format the data into tables and charts
  // 3. Add company branding and headers
  // 4. Generate and download the PDF

  alert(`Generación de PDF en desarrollo. Tipo: ${reportType}, Registros: ${data.length}`)
}

export function exportKPIReport(kpiData: any, filename = "kpi_report") {
  const reportData = {
    generatedAt: new Date().toISOString(),
    reportType: "KPI Report",
    data: {
      totalAmount: kpiData.totalAmount,
      totalOverdue: kpiData.totalOverdue,
      overduePercentage: kpiData.overduePercentage,
      totalFinancing: kpiData.totalFinancing,
      totalAdvance: kpiData.totalAdvance,
      avgDays: kpiData.avgDays,
    },
    summary: {
      status: kpiData.overduePercentage > 15 ? "Atención Requerida" : "Saludable",
      recommendation:
        kpiData.overduePercentage > 15
          ? "Revisar cuentas vencidas y implementar estrategias de cobranza"
          : "Mantener estrategias actuales de cobranza",
    },
  }

  exportToJSON(reportData, filename)
}
