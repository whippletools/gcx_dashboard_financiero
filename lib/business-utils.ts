import { RANGOS_ANTIGUEDAD, CLIENTES_INTERNOS_RFC } from "./constants"

/**
 * Calcula el rango de antigüedad basado en días
 * @param dias - Días de antigüedad
 * @returns Label del rango de antigüedad
 */
export function calcularRangoAntiguedad(dias: number): string {
  const rango = RANGOS_ANTIGUEDAD.find((r) => dias >= r.min && dias <= r.max)
  return rango?.label || "Más de 90 días"
}

/**
 * Calcula el color del rango de antigüedad
 * @param dias - Días de antigüedad
 * @returns Color CSS del rango
 */
export function getColorRangoAntiguedad(dias: number): string {
  const rango = RANGOS_ANTIGUEDAD.find((r) => dias >= r.min && dias <= r.max)
  return rango?.color || "var(--aging-90-plus)"
}

/**
 * Calcula días de antigüedad entre dos fechas
 * @param fechaRecepcion - Fecha de recepción (opcional)
 * @param fechaAlta - Fecha de alta (opcional)
 * @returns Días transcurridos desde la fecha base hasta hoy
 */
export function calcularDiasAntiguedad(
  fechaRecepcion?: string | Date | null,
  fechaAlta?: string | Date | null,
): number {
  const fechaBase = fechaRecepcion ? new Date(fechaRecepcion) : fechaAlta ? new Date(fechaAlta) : new Date()

  const hoy = new Date()
  const diferencia = hoy.getTime() - fechaBase.getTime()
  return Math.floor(diferencia / (1000 * 60 * 60 * 24))
}

/**
 * Verifica si un RFC pertenece a un cliente interno
 * @param rfc - RFC del cliente
 * @returns true si es cliente interno
 */
export function esClienteInterno(rfc?: string | null): boolean {
  if (!rfc) return false
  return CLIENTES_INTERNOS_RFC.includes(rfc as any)
}

/**
 * Filtra registros excluyendo clientes internos
 * @param registros - Array de registros con RFC
 * @returns Registros filtrados sin clientes internos
 */
export function filtrarClientesInternos<T extends { rfc?: string | null }>(registros: T[]): T[] {
  return registros.filter((r) => !esClienteInterno(r.rfc))
}

/**
 * Formatea un monto en pesos mexicanos
 * @param monto - Cantidad numérica
 * @returns String formateado como moneda MXN
 */
export function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto)
}

/**
 * Agrupa datos por rango de antigüedad
 * @param datos - Array de objetos con días de antigüedad
 * @returns Datos agrupados por rango con totales
 */
export function agruparPorAntiguedad<T extends { Dias?: number | null; Total?: number | null }>(
  datos: T[],
): Array<{ rango: string; total: number; count: number; color: string }> {
  console.log("[v0] Total records:", datos.length)
  console.log(
    "[v0] Sample Dias values:",
    datos.slice(0, 5).map((d) => d.Dias),
  )

  const grupos = RANGOS_ANTIGUEDAD.map((rango) => ({
    rango: rango.label,
    total: 0,
    count: 0,
    color: rango.color,
  }))

  datos.forEach((item) => {
    const dias = item.Dias || 0

    let rangoIndex = -1

    if (dias >= 1 && dias <= 30) {
      rangoIndex = 0 // 1-30 días
    } else if (dias >= 31 && dias <= 60) {
      rangoIndex = 1 // 31-60 días
    } else if (dias >= 61 && dias <= 90) {
      rangoIndex = 2 // 61-90 días
    } else if (dias >= 91 && dias <= 120) {
      rangoIndex = 3 // 91-120 días
    } else if (dias > 120) {
      rangoIndex = 4 // 121-500+ días
    }

    if (rangoIndex !== -1) {
      grupos[rangoIndex].total += item.Total || 0
      grupos[rangoIndex].count++
    }
  })

  console.log("[v0] Aging groups distribution:", grupos)

  return grupos
}

/**
 * Calcula el porcentaje de un valor respecto al total
 * @param valor - Valor parcial
 * @param total - Valor total
 * @returns Porcentaje como número
 */
export function calcularPorcentajeNumero(valor: number, total: number): number {
  if (total === 0) return 0
  return (valor / total) * 100
}

/**
 * Calcula el porcentaje de un valor respecto al total
 * @param valor - Valor parcial
 * @param total - Valor total
 * @returns Porcentaje formateado
 */
export function calcularPorcentaje(valor: number, total: number): string {
  if (total === 0) return "0.0%"
  return `${((valor / total) * 100).toFixed(1)}%`
}
