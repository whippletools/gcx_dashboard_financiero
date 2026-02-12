// hooks/useCollectionTrend.ts
// React Query hook for US-001: Tendencia Cobrado

import { useQuery } from '@tanstack/react-query';
import { CollectionTrendData, CollectionTrendParams } from '@/types/dashboard';

const fetchCollectionTrend = async (params: CollectionTrendParams): Promise<CollectionTrendData> => {
  const response = await fetch(
    `/api/tendencia-cobrado?year=${params.year}&idEmpresa=${params.idEmpresa}`
  );
  
  if (!response.ok) {
    throw new Error('Error al cargar tendencia de cobrado');
  }
  
  return response.json();
};

export function useCollectionTrend(params: CollectionTrendParams, enabled = true) {
  return useQuery({
    queryKey: ['collectionTrend', params.year, params.idEmpresa],
    queryFn: () => fetchCollectionTrend(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (reemplaza cacheTime en v5)
  });
}
