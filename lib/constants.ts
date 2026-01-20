// Sucursales (Branch offices)
export const SUCURSALES = {
  TAM: "Tampico",
  MAT: "Matamoros",
  LAR: "Nuevo Laredo",
  MEX: "CDMX",
  MAN: "Manzanillo",
  VER: "Veracruz",
  LAZ: "Corresponsalía",
  HID: "Ciudad Hidalgo",
  GDL: "Guadalajara",
  QRO: "Querétaro",
} as const

export type SucursalKey = keyof typeof SUCURSALES
export type SucursalName = (typeof SUCURSALES)[SucursalKey]

// Clientes Internos RFC (Internal clients to filter out)
export const CLIENTES_INTERNOS_RFC = [
  "DAC911011F57",
  "GCA960517MYA",
  "GLE961217IC5",
  "KSI980219699",
  "UNI931215B65",
  "SPC911017BQ1",
] as const

// Rangos de Antigüedad de Cartera (Aging ranges)
export const RANGOS_ANTIGUEDAD = [
  { min: 0, max: 30, label: "1-30 días", color: "#3b82f6" }, // Bright blue
  { min: 31, max: 60, label: "31-60 días", color: "#f97316" }, // Bright orange
  { min: 61, max: 90, label: "61-90 días", color: "#22c55e" }, // Bright green
  { min: 91, max: 120, label: "91-120 días", color: "#6366f1" }, // Indigo
  { min: 121, max: Number.POSITIVE_INFINITY, label: "121-500+ días", color: "#ef4444" }, // Red
] as const

// Tipos de Conceptos (Document types)
export enum TipoConcepto {
  FINANCIAMIENTO = 1,
  HONORARIOS = 2,
  BOLETINADO = 3,
  COMPLEMENTARIOS = 4,
}

export const TIPO_CONCEPTO_LABELS = {
  [TipoConcepto.FINANCIAMIENTO]: "Financiamiento",
  [TipoConcepto.HONORARIOS]: "Honorarios",
  [TipoConcepto.BOLETINADO]: "Boletinado",
  [TipoConcepto.COMPLEMENTARIOS]: "Complementarios",
} as const
