// lib/utils/formatters.ts
// Currency, number and date formatters for GCX Dashboard

/**
 * Format number as Mexican Peso currency
 */
export const formatCurrency = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format number as compact Mexican Peso currency (for tables)
 * Example: $1.5M, $250K
 */
export const formatCurrencyCompact = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0';
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * Format number as percentage
 */
export const formatPercentage = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat('es-MX').format(value);
};

/**
 * Format date to Mexican locale string
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
};

/**
 * Format date to short Mexican locale (DD/MM/YYYY)
 */
export const formatDateShort = (date: Date | string): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

/**
 * Format month number to Spanish month name
 */
export const formatMonthName = (month: number): string => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return months[month - 1] || '';
};

/**
 * Format month number to short Spanish month name
 */
export const formatMonthNameShort = (month: number): string => {
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  
  return months[month - 1] || '';
};

/**
 * Format large numbers to compact notation (e.g., 1.2M, 450K)
 */
export const formatCompactNumber = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  return Intl.NumberFormat('es-MX', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * Format currency with custom precision
 */
export const formatCurrencyPrecise = (value: number, fractionDigits: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
};
