import { createClient } from "@/lib/supabase/server"
import type { CobranzaData, CobranzaConAntiguedad, AgrupacionPorSucursal } from "@/lib/types"
import {
  calcularDiasAntiguedad,
  calcularRangoAntiguedad,
  getColorRangoAntiguedad,
  esClienteInterno,
  filtrarClientesInternos,
  agruparPorAntiguedad,
} from "@/lib/business-utils"

export async function getCobranzaData(): Promise<CobranzaData[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("cobranza_raw").select("*").order("Fecha", { ascending: false })

  if (error) {
    console.error("Error fetching cobranza data:", error)
    return []
  }

  return data || []
}

export async function getKPIData(): Promise<any> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("cobranza_raw").select("Total, Vencido, FINANCIAMIENTO, ANTICIPO, Dias")

  if (error) {
    console.error("Error fetching KPI data:", error)
    return null
  }

  const totalAmount = data?.reduce((sum, item) => sum + (item.Total || 0), 0) || 0
  const totalOverdue = data?.reduce((sum, item) => sum + (item.Vencido || 0), 0) || 0
  const totalFinancing = data?.reduce((sum, item) => sum + (item.FINANCIAMIENTO || 0), 0) || 0
  const totalAdvance = data?.reduce((sum, item) => sum + (item.ANTICIPO || 0), 0) || 0
  const avgDays = data?.reduce((sum, item) => sum + (item.Dias || 0), 0) / (data?.length || 1) || 0

  return {
    totalAmount,
    totalOverdue,
    totalFinancing,
    totalAdvance,
    avgDays,
    overduePercentage: totalAmount > 0 ? (totalOverdue / totalAmount) * 100 : 0,
  }
}

export async function getClientData(clientId?: string): Promise<CobranzaData[]> {
  const supabase = await createClient()

  let query = supabase.from("cobranza_raw").select("*")

  if (clientId) {
    query = query.eq("NO CLIENTE", clientId)
  }

  const { data, error } = await query.order("Fecha", { ascending: false })

  if (error) {
    console.error("Error fetching client data:", error)
    return []
  }

  return data || []
}

/**
 * Obtiene datos de cobranza con cálculo de antigüedad
 */
export async function getCobranzaConAntiguedad(): Promise<CobranzaConAntiguedad[]> {
  const data = await getCobranzaData()

  return data.map((item) => {
    const diasCalculados = calcularDiasAntiguedad(item.FecRecep, item.Fecha)
    const rangoAntiguedad = calcularRangoAntiguedad(diasCalculados)
    const colorRango = getColorRangoAntiguedad(diasCalculados)

    return {
      ...item,
      diasCalculados,
      rangoAntiguedad,
      colorRango,
      esClienteInterno: esClienteInterno(item.rfc),
    }
  })
}

/**
 * Obtiene datos agrupados por sucursal (basado en campo UD)
 */
export async function getCobranzaPorSucursal(): Promise<AgrupacionPorSucursal[]> {
  const data = await getCobranzaData()
  const dataFiltrada = filtrarClientesInternos(data)

  // Agrupar por sucursal (campo UD)
  const agrupado = new Map<string, CobranzaData[]>()

  dataFiltrada.forEach((item) => {
    const sucursal = item.UD || "Sin Sucursal"
    if (!agrupado.has(sucursal)) {
      agrupado.set(sucursal, [])
    }
    agrupado.get(sucursal)!.push(item)
  })

  // Calcular métricas por sucursal
  return Array.from(agrupado.entries())
    .map(([sucursal, registros]) => {
      const totalCartera = registros.reduce((sum, r) => sum + (r.Total || 0), 0)
      const totalVencido = registros.reduce((sum, r) => sum + (r.Vencido || 0), 0)
      const totalFinanciamiento = registros.reduce((sum, r) => sum + (r.FINANCIAMIENTO || 0), 0)
      const promedioAntiguedad = registros.reduce((sum, r) => sum + (r.Dias || 0), 0) / registros.length

      return {
        sucursal,
        totalCartera,
        totalVencido,
        totalFinanciamiento,
        porcentajeVencido: totalCartera > 0 ? (totalVencido / totalCartera) * 100 : 0,
        promedioAntiguedad: Math.round(promedioAntiguedad),
        registros: registros.length,
      }
    })
    .sort((a, b) => b.totalCartera - a.totalCartera)
}

/**
 * Obtiene distribución de cartera por antigüedad
 */
export async function getDistribucionAntiguedad() {
  const data = await getCobranzaData()
  const dataFiltrada = filtrarClientesInternos(data)

  const grupos = agruparPorAntiguedad(dataFiltrada)
  const totalGeneral = grupos.reduce((sum, g) => sum + g.total, 0)

  return grupos.map((grupo) => ({
    rango: grupo.rango,
    total: grupo.total,
    count: grupo.count,
    color: grupo.color,
    porcentaje: totalGeneral > 0 ? (grupo.total / totalGeneral) * 100 : 0,
  }))
}
