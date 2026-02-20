import { executeQuery } from "@/lib/reco-api"
import type { CobranzaData, CobranzaConAntiguedad, AgrupacionPorSucursal } from "@/lib/types"
import {
  calcularDiasAntiguedad,
  calcularRangoAntiguedad,
  getColorRangoAntiguedad,
  esClienteInterno,
  filtrarClientesInternos,
  agruparPorAntiguedad,
} from "@/lib/business-utils"

function getTodayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function mapRowToCobranzaData(row: any, index: number): CobranzaData {
  return {
    id: index + 1,
    FecEnv: null,
    "TOTAL HON": row.Honorarios || 0,
    FecRecep: null,
    Fecha: null,
    Dias: row.Dias ?? row.DiasTranscurridos ?? 0,
    Total: row.Saldo || 0,
    ANTICIPO: 0,
    "DIAS CR": row.DiasCredito || 0,
    Tiempo: row.Tiempo || 0,
    Vencido: row.Vencido || 0,
    FINANCIAMIENTO: 0,
    total_compl: row.Complementarios || 0,
    Atencion: null,
    RECIBIO: null,
    PEDIDO: null,
    "NO CLIENTE": null,
    NOMBRE: row.Nombre || null,
    rfc: row.RFC || null,
    numero: null,
    UD: row.Sucursal ?? row.NombreSucursal ?? null,
    AA: null,
    Cta: null,
    TD: null,
    "Pdto.": null,
    Referen: null,
    Cliente: row.Nombre || null,
    TO: null,
    CRED: null,
    OBS: null,
    "Bolet.": null,
    Guia: null,
  }
}

export async function getCobranzaData(): Promise<CobranzaData[]> {
  const fechaCorte = getTodayString()
  const query = `
    SELECT
      Nombre, RFC, Saldo, Vencido, Tiempo,
      DiasTranscurridos, DiasCredito,
      NombreSucursal AS Sucursal,
      Honorarios, Complementarios
    FROM dbo.fn_CuentasPorCobrar_Excel('${fechaCorte}', 1)
    WHERE TipoCliente = 'Externo'
  `

  const result = await executeQuery(query)

  if (!result.success || !result.data) {
    console.error("Error fetching cobranza data via RECO:", result.error)
    return []
  }

  return result.data.map((row: any, i: number) => mapRowToCobranzaData(row, i))
}

export async function getKPIData(): Promise<any> {
  const fechaCorte = getTodayString()
  const query = `
    SELECT
      SUM(Saldo) AS TotalSaldo,
      SUM(Vencido) AS TotalVencido,
      SUM(Tiempo) AS TotalTiempo,
      AVG(DiasTranscurridos) AS PromDias,
      COUNT(*) AS Total
    FROM dbo.fn_CuentasPorCobrar_Excel('${fechaCorte}', 1)
    WHERE TipoCliente = 'Externo'
  `

  const result = await executeQuery(query)

  if (!result.success || !result.data || result.data.length === 0) {
    console.error("Error fetching KPI data via RECO:", result.error)
    return null
  }

  const row = result.data[0]
  const totalAmount = row.TotalSaldo || 0
  const totalOverdue = row.TotalVencido || 0

  return {
    totalAmount,
    totalOverdue,
    totalFinancing: 0,
    totalAdvance: 0,
    avgDays: Math.round(row.PromDias || 0),
    overduePercentage: totalAmount > 0 ? (totalOverdue / totalAmount) * 100 : 0,
  }
}

export async function getClientData(clientId?: string): Promise<CobranzaData[]> {
  const fechaCorte = getTodayString()
  const whereClause = clientId
    ? `WHERE TipoCliente = 'Externo' AND RFC = '${clientId.replace(/'/g, "''")}'`
    : `WHERE TipoCliente = 'Externo'`

  const query = `
    SELECT
      Nombre, RFC, Saldo, Vencido, Tiempo,
      DiasTranscurridos, DiasCredito,
      NombreSucursal AS Sucursal,
      Honorarios, Complementarios
    FROM dbo.fn_CuentasPorCobrar_Excel('${fechaCorte}', 1)
    ${whereClause}
  `

  const result = await executeQuery(query)

  if (!result.success || !result.data) {
    console.error("Error fetching client data via RECO:", result.error)
    return []
  }

  return result.data.map((row: any, i: number) => mapRowToCobranzaData(row, i))
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
