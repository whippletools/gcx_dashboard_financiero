// hooks/useGuaranteeStatus.ts
// React Query hook for US-005: Estatus de Garantías

import { useQuery } from '@tanstack/react-query';
import { GuaranteeStatusData, GuaranteeStatusParams } from '@/types/dashboard';

const fetchGuaranteeStatus = async (params: GuaranteeStatusParams): Promise<GuaranteeStatusData> => {
  const response = await fetch(
    `/api/garantias/estatus?year=${params.year}&idEmpresa=${params.idEmpresa}`
  );
  
  if (!response.ok) {
    throw new Error('Error al cargar estatus de garantías');
  }
  
  return response.json();
};

export function useGuaranteeStatus(params: GuaranteeStatusParams, enabled = true) {
  return useQuery({
    queryKey: ['guaranteeStatus', params.year, params.idEmpresa],
    queryFn: () => fetchGuaranteeStatus(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
