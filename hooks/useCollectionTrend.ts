// hooks/useCollectionTrend.ts
// React Query hook for US-001: Tendencia Cobrado

import { useQuery } from '@tanstack/react-query';
import { CollectionTrendData, CollectionTrendParams, MonthlyCollectionData } from '@/types/dashboard';

const fetchCollectionTrend = async (params: CollectionTrendParams): Promise<CollectionTrendData> => {
  // En Netlify tenemos un límite de 10s por request. Las TVF de SQL tardan ~2.7s por mes.
  // Hacer los 12 meses en 1 solo request causa timeout.
  // Solución: El frontend hace peticiones individuales por cada mes usando "chunks" (lotes).
  // Hacemos lotes de 3 en 3 paralelos para balancear: carga rápida vs no saturar SQL Server.
  
  const MAX_MONTHS = 12; // Ahora pedimos el año completo
  const BATCH_SIZE = 3;  // Peticiones simultáneas a la BD
  
  const currentYear: MonthlyCollectionData[] = [];
  const previousYear: MonthlyCollectionData[] = [];
  
  // Array de 1 a 12
  const months = Array.from({ length: MAX_MONTHS }, (_, i) => i + 1);
  
  // Procesar en lotes de 3
  for (let i = 0; i < months.length; i += BATCH_SIZE) {
    const batch = months.slice(i, i + BATCH_SIZE);
    
    // Ejecutar el lote actual en paralelo
    const batchPromises = batch.map(async (month) => {
      try {
        const response = await fetch(
          `/api/tendencia-cobrado?year=${params.year}&idEmpresa=${params.idEmpresa}&month=${month}&_t=${Date.now()}`
        );
        
        if (!response.ok) throw new Error(`Error mes ${month}`);
        return await response.json();
      } catch (err) {
        console.error(`Fallo mes ${month}:`, err);
        // Helper to format month name
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthName = monthNames[month - 1];
        
        return {
          currentYearMonth: { month, monthName, totalCollected: 0, invoiceCount: 0, year: params.year },
          previousYearMonth: { month, monthName, totalCollected: 0, invoiceCount: 0, year: params.year - 1 }
        };
      }
    });

    // Esperar a que los 3 meses terminen antes de lanzar los siguientes 3
    const batchResults = await Promise.all(batchPromises);
    
    // Guardar resultados del lote
    batchResults.forEach(data => {
      if (data.currentYearMonth) currentYear.push(data.currentYearMonth);
      if (data.previousYearMonth) previousYear.push(data.previousYearMonth);
    });
  }
  
  // Asegurar orden por mes (1 al 12)
  currentYear.sort((a, b) => a.month - b.month);
  previousYear.sort((a, b) => a.month - b.month);

  return {
    currentYear,
    previousYear
  };
};

export function useCollectionTrend(params: CollectionTrendParams, enabled = true) {
  return useQuery({
    queryKey: ['collectionTrend', params.year, params.idEmpresa],
    queryFn: () => fetchCollectionTrend(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}
