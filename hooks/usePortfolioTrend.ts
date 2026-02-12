// hooks/usePortfolioTrend.ts
// React Query hook for US-003: Tendencia Cartera CXC

import { useQuery } from '@tanstack/react-query';
import { PortfolioTrendData, PortfolioTrendParams } from '@/types/dashboard';

const fetchPortfolioTrend = async (params: PortfolioTrendParams): Promise<PortfolioTrendData> => {
  const response = await fetch(
    `/api/tendencia-cxc?year=${params.year}&idEmpresa=${params.idEmpresa}`
  );
  
  if (!response.ok) {
    throw new Error('Error al cargar tendencia de cartera');
  }
  
  return response.json();
};

export function usePortfolioTrend(params: PortfolioTrendParams, enabled = true) {
  return useQuery({
    queryKey: ['portfolioTrend', params.year, params.idEmpresa],
    queryFn: () => fetchPortfolioTrend(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
