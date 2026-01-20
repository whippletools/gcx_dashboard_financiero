export interface CobranzaData {
  id: number
  FecEnv: string | null
  "TOTAL HON": number | null
  FecRecep: string | null
  Fecha: string | null
  Dias: number | null
  Total: number | null
  ANTICIPO: number | null
  "DIAS CR": number | null
  Tiempo: number | null
  Vencido: number | null
  FINANCIAMIENTO: number | null
  total_compl: number | null
  Atencion: string | null
  RECIBIO: string | null
  PEDIDO: string | null
  "NO CLIENTE": string | null
  NOMBRE: string | null
  rfc: string | null
  numero: string | null
  UD: string | null
  AA: string | null
  Cta: string | null
  TD: string | null
  "Pdto.": string | null
  Referen: string | null
  Cliente: string | null
  TO: string | null
  CRED: string | null
  OBS: string | null
  "Bolet.": string | null
  Guia: string | null
}

export interface KPIData {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: string
}

export interface ChartData {
  name: string
  value: number
  fill?: string
}

export interface CobranzaConAntiguedad extends CobranzaData {
  diasCalculados: number
  rangoAntiguedad: string
  colorRango: string
  esClienteInterno: boolean
}

export interface AgrupacionPorSucursal {
  sucursal: string
  totalCartera: number
  totalVencido: number
  totalFinanciamiento: number
  porcentajeVencido: number
  promedioAntiguedad: number
  registros: number
}

export interface DatosAntiguedad {
  rango: string
  total: number
  count: number
  color: string
  porcentaje: string
}
