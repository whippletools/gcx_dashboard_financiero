// hooks/useGuaranteeAging.ts
// React Query hook para Antigüedad de Cartera Garantías

import { useQuery } from '@tanstack/react-query';

interface GuaranteeAgingParams {
  fechaCorte?: string;
  idEmpresa: number;
}

const fetchGuaranteeAging = async (params: GuaranteeAgingParams) => {
  const qs = new URLSearchParams({ idEmpresa: String(params.idEmpresa) });
  if (params.fechaCorte) qs.set('fechaCorte', params.fechaCorte);

  const response = await fetch(`/api/garantias/antiguedad?${qs.toString()}`);
  if (!response.ok) throw new Error('Error al cargar antigüedad de garantías');
  return response.json();
};

export function useGuaranteeAging(params: GuaranteeAgingParams, enabled = true) {
  return useQuery({
    queryKey: ['guaranteeAging', params.fechaCorte, params.idEmpresa],
    queryFn: () => fetchGuaranteeAging(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
