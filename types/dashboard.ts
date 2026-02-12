// types/dashboard.ts
// TypeScript definitions for GCX Financial Dashboard
// Based on User Stories US-001 through US-008

// ============================================
// US-001: Tendencia Cobrado
// ============================================
export interface CollectionTrendData {
  currentYear: MonthlyCollectionData[];
  previousYear: MonthlyCollectionData[];
}

export interface MonthlyCollectionData {
  month: number;
  monthName: string;
  totalCollected: number;
  invoiceCount: number;
  year: number;
}

// ============================================
// US-002: Antigüedad Cartera
// ============================================
export type AgingRange = '1-30' | '31-60' | '61-90' | '91-120' | '121-5000';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AgingData {
  chartData: AgingBucket[];
  tableData: AgingDetail[];
  summary: AgingSummary;
}

export interface AgingBucket {
  range: AgingRange;
  amount: number;
  percentage: number;
  color: string;
  riskLevel: RiskLevel;
}

export interface AgingDetail {
  clientName: string;
  rfc: string;
  range1to30: number;
  range31to60: number;
  range61to90: number;
  range91to120: number;
  range121plus: number;
  total: number;
  branch: string;
}

export interface AgingSummary {
  totalAmount: number;
  totalClients: number;
  averageDays: number;
}

// ============================================
// US-003: Tendencia Cartera CXC
// ============================================
export interface PortfolioTrendData {
  months: MonthPortfolioData[];
  tableData: PortfolioDetail[];
}

export interface MonthPortfolioData {
  month: number;
  monthName: string;
  overdue: number;
  onTime: number;
  total: number;
  overduePercentage: number;
}

export interface PortfolioDetail {
  clientName: string;
  rfc: string;
  onTime: number;
  overdue: number;
  total: number;
  branch: string;
  month: number;
}

// ============================================
// US-004: Financiamiento
// ============================================
export interface FinancingTrendData {
  months: MonthFinancingData[];
  tableData: FinancingDetail[];
  filters: {
    offices: Office[];
    units: Unit[];
  };
}

export interface MonthFinancingData {
  month: number;
  monthName: string;
  pendingInvoice: number; // FinanciadoPTE - Por facturar
  invoiced: number;       // FinanciadoFAC - Facturado
  total: number;
}

export interface FinancingDetail {
  unit: string;
  office: string;
  pendingInvoice: number;
  invoiced: number;
  month: number;
}

export interface Office {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
}

// ============================================
// US-005: Estatus Garantías
// ============================================
export type GuaranteeStatus = 'Programadas' | 'Naviera' | 'Operacion';

export interface GuaranteeStatusData {
  months: MonthGuaranteeData[];
  tableData: GuaranteeStatusDetail[];
}

export interface MonthGuaranteeData {
  month: number;
  monthName: string;
  scheduled: number;  // Programadas
  naviera: number;    // Naviera
  operation: number;  // Operacion
  total: number;
}

export interface GuaranteeStatusDetail {
  status: GuaranteeStatus;
  amount: number;      // ImporteMN
  month: number;
  monthName: string;
}

// ============================================
// US-006: Resumen Corporativo por Oficina
// ============================================
export interface OfficeSummaryData {
  offices: OfficeSummary[];
  totals: OfficeSummary;
}

export interface OfficeSummary {
  id: string;
  name: string;
  invoiceCount: number;
  range01to30: number;
  range31to45: number;
  range46to60: number;
  range61to90: number;
  range91plus: number;
  total: number;
  dacBalance: number;
  clientBalance: number;
  collected: number;
  overdue: number;
}

// ============================================
// US-007: Facturación DAC
// ============================================
export interface BillingData {
  aduanas: AduanaBilling[];
  months: string[];
}

export interface AduanaBilling {
  id: string;
  name: string;
  monthlyData: MonthBillingData[];
  average: number;
  totalHonorarios: number;
  totalOtros: number;
}

export interface MonthBillingData {
  month: number;
  monthName: string;
  honorarios: number; // Parte inferior - Azul
  otros: number;      // Parte superior - Negro
  total: number;
}

// ============================================
// US-008: Tendencia Cartera Garantías
// ============================================
export interface GuaranteeTrendData {
  months: MonthGuaranteeTrend[];
  tableData: GuaranteeTrendDetail[];
}

export interface MonthGuaranteeTrend {
  month: number;
  monthName: string;
  overdue: number;
  onTime: number;
  total: number;
  overduePercentage: number;
}

export interface GuaranteeTrendDetail {
  providerName: string;
  onTime: number;
  overdue: number;
  total: number;
  branch: string;
  month: number;
}

// ============================================
// API Request/Response Types
// ============================================
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface CollectionTrendParams {
  year: number;
  idEmpresa: number;
}

export interface AgingParams {
  fechaCorte: string;
  idEmpresa: number;
}

export interface PortfolioTrendParams {
  year: number;
  idEmpresa: number;
}

export interface FinancingTrendParams {
  year: number;
  idEmpresa: number;
  officeId?: string;
}

export interface GuaranteeStatusParams {
  year: number;
  idEmpresa: number;
}

export interface OfficeSummaryParams {
  fechaCorte: string;
  idEmpresa?: number;
}

export interface BillingParams {
  year: number;
  aduanaId?: string;
}

export interface GuaranteeTrendParams {
  year: number;
  idEmpresa: number;
}

// ============================================
// Chart & UI Types
// ============================================
export interface ChartConfig {
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'percentage' | 'number' | 'date' | 'none';
  width?: string;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}
