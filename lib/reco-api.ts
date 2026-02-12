// lib/reco-api.ts
// Cliente para API RECO - SQL Query Service
// http://rws.grucas.com:19287/api/reco/encoded

import { Buffer } from 'buffer';

const RECO_API_URL = 'http://rws.grucas.com:19287/api/reco/encoded';

// Obtener credenciales de variables de entorno
const GCX_USER = process.env.GCX_USER || '';
const GCX_PASSWORD = process.env.GCX_PASSWORD || '';

// Cache del token para evitar recalcular
let cachedToken: string | null = null;

/**
 * Codifica credenciales en Base64 (username:password)
 */
function getAuthToken(): string {
  if (cachedToken) return cachedToken;
  
  const credentials = `${GCX_USER}:${GCX_PASSWORD}`;
  cachedToken = Buffer.from(credentials).toString('base64');
  return cachedToken;
}

/**
 * Codifica una query SQL en Base64
 */
function encodeQuery(query: string): string {
  return Buffer.from(query).toString('base64');
}

/**
 * Verifica si la query es segura (solo SELECT o WITH SELECT)
 */
function isSafeQuery(query: string): boolean {
  const upperQuery = query.toUpperCase();
  const forbiddenWords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER', 'EXEC', 'MERGE', 'CALL', 'CREATE'];
  
  // Debe comenzar con SELECT o WITH
  const hasSelect = upperQuery.trim().startsWith('SELECT') || upperQuery.trim().startsWith('WITH');
  if (!hasSelect) return false;
  
  // No debe contener palabras prohibidas
  return !forbiddenWords.some(word => upperQuery.includes(word));
}

export interface RecoQueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  rowCount?: number;
}

/**
 * Ejecuta una query SQL contra la API RECO
 */
export async function executeQuery(query: string): Promise<RecoQueryResult> {
  try {
    // Debug: Verificar credenciales
    console.log('[RECO API] GCX_USER:', GCX_USER ? 'Configurado' : 'NO CONFIGURADO');
    console.log('[RECO API] GCX_PASSWORD:', GCX_PASSWORD ? 'Configurado' : 'NO CONFIGURADO');
    
    // Validar query
    if (!isSafeQuery(query)) {
      console.error('[RECO API] Query no permitida:', query.substring(0, 100));
      return {
        success: false,
        error: 'Query no permitida. Solo se permiten consultas SELECT o WITH SELECT.'
      };
    }

    const token = getAuthToken();
    const encodedQuery = encodeQuery(query);
    
    console.log('[RECO API] URL:', RECO_API_URL);
    console.log('[RECO API] Token (primeros 20 chars):', token.substring(0, 20) + '...');
    console.log('[RECO API] Query (primeros 100 chars):', query.substring(0, 100));

    const response = await fetch(RECO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: encodedQuery })
    });

    console.log('[RECO API] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RECO API] Error response:', errorText);
      return {
        success: false,
        error: `Error ${response.status}: ${errorText || response.statusText}`
      };
    }

    const data = await response.json();
    console.log('[RECO API] Response data keys:', Object.keys(data));
    
    return {
      success: true,
      data: data.results || data,
      rowCount: data.rowCount || (data.results ? data.results.length : 0)
    };

  } catch (error) {
    console.error('[RECO API] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Helper para queries con parámetros (sanitización básica)
 */
export async function executeQueryWithParams(
  queryTemplate: string, 
  params: Record<string, string | number>
): Promise<RecoQueryResult> {
  // Reemplazar parámetros en el template
  let finalQuery = queryTemplate;
  
  for (const [key, value] of Object.entries(params)) {
    // Escapar valores para prevenir SQL injection básico
    const escapedValue = typeof value === 'string' 
      ? value.replace(/'/g, "''")  // Escapar comillas simples
      : String(value);
    
    finalQuery = finalQuery.replace(new RegExp(`@${key}`, 'g'), `'${escapedValue}'`);
  }
  
  return executeQuery(finalQuery);
}

// Queries predefinidas para el dashboard
export const DASHBOARD_QUERIES = {
  // Tendencia de cobrado por mes
  tendenciaCobrado: (year: number, idEmpresa: number) => `
    SELECT 
      MONTH(FechaPago) as Mes,
      SUM(TotalCobrado) as TotalCobrado,
      YEAR(FechaPago) as Anio
    FROM dbo.fn_CGA_Cobrados(${idEmpresa}, ${year})
    GROUP BY MONTH(FechaPago), YEAR(FechaPago)
    ORDER BY Mes
  `,
  
  // Antigüedad de cartera
  antiguedadCartera: (fechaCorte: string, idEmpresa: number) => `
    SELECT 
      Cliente,
      RFC,
      CASE 
        WHEN Dias BETWEEN 1 AND 30 THEN '01-30'
        WHEN Dias BETWEEN 31 AND 60 THEN '31-60'
        WHEN Dias BETWEEN 61 AND 90 THEN '61-90'
        WHEN Dias BETWEEN 91 AND 120 THEN '91-120'
        ELSE '121+'
      END as Rango,
      SUM(Saldo) as Monto,
      Dias
    FROM dbo.fn_CuentasPorCobrar_Excel('${fechaCorte}', ${idEmpresa})
    WHERE RFC NOT LIKE 'INTERNO%'
    GROUP BY Cliente, RFC, Dias
    ORDER BY Dias DESC
  `,
  
  // Tendencia cartera CXC
  tendenciaCarteraCXC: (year: number, idEmpresa: number) => `
    SELECT 
      MONTH(Fecha) as Mes,
      SUM(CASE WHEN Dias > 0 THEN Saldo ELSE 0 END) as Vencido,
      SUM(CASE WHEN Dias <= 0 THEN Saldo ELSE 0 END) as EnTiempo,
      SUM(Saldo) as Total
    FROM dbo.fn_CuentasPorCobrar_Excel('${year}-12-31', ${idEmpresa})
    WHERE YEAR(Fecha) = ${year}
    GROUP BY MONTH(Fecha)
    ORDER BY Mes
  `,
  
  // Resumen por oficinas
  resumenOficinas: (fechaCorte: string, idEmpresa: number) => `
    SELECT 
      UD as Oficina,
      COUNT(*) as CantidadFacturas,
      SUM(CASE WHEN Dias BETWEEN 1 AND 30 THEN Total ELSE 0 END) as [01-30],
      SUM(CASE WHEN Dias BETWEEN 31 AND 45 THEN Total ELSE 0 END) as [31-45],
      SUM(CASE WHEN Dias BETWEEN 46 AND 60 THEN Total ELSE 0 END) as [46-60],
      SUM(CASE WHEN Dias BETWEEN 61 AND 90 THEN Total ELSE 0 END) as [61-90],
      SUM(CASE WHEN Dias > 90 THEN Total ELSE 0 END) as [91+],
      SUM(Total) as Total,
      SUM([TOTAL HON]) as SaldoDAC,
      SUM([TOTAL COMPL]) as SaldoClientes,
      SUM(Cobrado) as Cobrado,
      SUM(Vencido) as Vencido
    FROM dbo.fn_CuentasPorCobrar_Excel('${fechaCorte}', ${idEmpresa})
    WHERE RFC NOT LIKE 'INTERNO%'
    GROUP BY UD
    ORDER BY SUM(Total) DESC
  `
};
