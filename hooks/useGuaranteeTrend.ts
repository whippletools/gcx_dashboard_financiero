// hooks/useGuaranteeTrend.ts
// React Query hook for US-008: Tendencia Cartera de Garantías

import { useQuery } from '@tanstack/react-query';
import { GuaranteeTrendData, GuaranteeTrendParams } from '@/types/dashboard';

const fetchGuaranteeTrend = async (params: GuaranteeTrendParams): Promise<GuaranteeTrendData> => {
  const response = await fetch(
    `/api/garantias/tendencia?year=${params.year}&idEmpresa=${params.idEmpresa}`
  );
  
  if (!response.ok) {
    throw new Error('Error al cargar tendencia de garantías');
  }
  
  return response.json();
};

export function useGuaranteeTrend(params: GuaranteeTrendParams, enabled = true) {
  return useQuery({
    queryKey: ['guaranteeTrend', params.year, params.idEmpresa],
    queryFn: () => fetchGuaranteeTrend(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
