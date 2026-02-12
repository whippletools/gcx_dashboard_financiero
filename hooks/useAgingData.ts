// hooks/useAgingData.ts
// React Query hook for US-002: Antigüedad Cartera

import { useQuery } from '@tanstack/react-query';
import { AgingData, AgingParams } from '@/types/dashboard';

const fetchAgingData = async (params: AgingParams): Promise<AgingData> => {
  const response = await fetch(
    `/api/antiguedad-cartera?fechaCorte=${params.fechaCorte}&idEmpresa=${params.idEmpresa}`
  );
  
  if (!response.ok) {
    throw new Error('Error al cargar datos de antigüedad');
  }
  
  return response.json();
};

export function useAgingData(params: AgingParams, enabled = true) {
  return useQuery({
    queryKey: ['agingData', params.fechaCorte, params.idEmpresa],
    queryFn: () => fetchAgingData(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
