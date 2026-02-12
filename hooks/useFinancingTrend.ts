// hooks/useFinancingTrend.ts
// React Query hook for US-004: Tendencia Financiamiento

import { useQuery } from '@tanstack/react-query';
import { FinancingTrendData, FinancingTrendParams } from '@/types/dashboard';

const fetchFinancingTrend = async (params: FinancingTrendParams): Promise<FinancingTrendData> => {
  const url = new URL('/api/financiamiento', window.location.origin);
  url.searchParams.set('year', params.year.toString());
  url.searchParams.set('idEmpresa', params.idEmpresa.toString());
  if (params.officeId) {
    url.searchParams.set('officeId', params.officeId);
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error('Error al cargar tendencia de financiamiento');
  }
  
  return response.json();
};

export function useFinancingTrend(params: FinancingTrendParams, enabled = true) {
  return useQuery({
    queryKey: ['financingTrend', params.year, params.idEmpresa, params.officeId],
    queryFn: () => fetchFinancingTrend(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
