# Tracking Dashboard GCX - Tareas por User Story

> **Enfoque actual**: US-002 - Antigüedad de Cartera
> **Estrategia**: Trabajar una tabla a la vez hasta obtener datos correctos antes de pasar a la siguiente

---

## 🎯 User Stories - Estado General

| ID | User Story | Estado | Prioridad | Blockers |
|----|-----------|--------|-----------|----------|
| US-001 | **Tendencia de Cobrado** (comparativo año pasado) | ✅ **TERMINADO** | Alta | - |
| US-002 | Antigüedad Cartera General + tabla | 🔴 **EN PROCESO** | Alta | Verificar datos reales de API RECO |
| US-003 | Tendencia Cartera CXC (Vencido vs En tiempo) | ⚪ Pendiente | Alta | - |
| US-004 | Tendencia Financiamiento CxC DAC | ⚪ Pendiente | Media | - |
| US-005 | Estatus Garantías | ⚪ Pendiente | Alta | - |
| US-006 | Antigüedad/Tendencia Cartera Garantías | ⚪ Pendiente | Media | - |
| US-007 | Resumen Corporativo por Oficina | ⚪ Pendiente | Alta | - |
| US-008 | Módulo Facturación DAC | ⚪ Pendiente | Media | - |

---

## 🔴 US-001: Tendencia de Cobrado - Tareas Detalladas

### Problema Actual
La gráfica solo muestra datos para Enero y Febrero. Los meses Mar-Jun (y posiblemente más) aparecen en $0.0M.

### Diagnóstico
- ✅ API route funciona y devuelve datos
- ✅ Primeros meses (Ene/Feb) traen datos correctos (~$340M y ~$150M)
- 🔴 Meses posteriores fallan por timeout o no devuelven datos
- 🔴 Funciones TVF de SQL Server son lentas (>5-9 segundos por consulta)

### Tareas de Implementación

#### Fase 1: Diagnóstico y Hotfix (Completado)
- [x] Revisar logs de errores en terminal
- [x] Identificar que las funciones TVF no soportan paralelismo masivo
- [x] Implementar batch processing con BATCH_SIZE=1
- [x] Aumentar timeout a 9s (límite de Netlify)
- [x] Reducir consultas de 12 a 6 meses para evitar timeouts
- [x] Agregar executeQueryWithRetry en todas las rutas
- [x] ~~Cambiar año por defecto a 2025~~ (Revertido a dinámico: año actual vs anterior)

#### Fase 2: Verificación de Datos (Completado)
- [x] Investigar por qué el año anterior (2025) devuelve $0.00
- [x] Ejecutar consultas SQL manuales para verificar si hay datos de 2025 en BD
- [x] Verificar si el error de $0 es por falta de datos o por timeout silencioso
  - **Resultado**: La BD SÍ tiene datos, pero la función es extremadamente lenta.
  - **Diagnóstico Final**: La función TVF `fn_CGA_Cobrados` no soporta consultas de 6 meses de golpe (da Timeout directo en SQL Server). Consultar mes por mes de forma secuencial en el backend toma ~16s, excediendo los 10s de Netlify.

#### Fase 3: Nuevo Enfoque Arquitectónico (Frontend-driven fetch) (Completado)
- [x] Modificar la API `/api/tendencia-cobrado` para que acepte un parámetro `month` y devuelva solo 1 mes (2.7s por request, seguro para Netlify).
- [x] Modificar el hook `useCollectionTrend` en el frontend para que haga peticiones por cada mes de forma secuencial.
  - Esto evita el timeout de Netlify.
  - Esto evita saturar los recursos (CPU/RAM) del servidor de base de datos RECO al no enviar 6 queries simultáneos.
- [ ] Crear vista materializada o tabla resumen mensual
- [ ] Agregar índices a tablas subyacentes de fn_CGA_Cobrados
- [ ] Simplificar lógica de la función TVF si es posible
- [ ] Considerar pre-cálculo nocturno de datos mensuales

#### Fase 4: Frontend (Si datos están correctos)
- [ ] Verificar que el componente CollectionTrendChart maneje arrays de 6 meses
- [ ] Validar colores: año actual (Primary-500), año anterior (Secondary-400)
- [ ] Probar hover para mostrar montos exactos
- [ ] Responsive: móvil vs desktop

### Criterios de Aceptación US-001
- [ ] Gráfica muestra 6 meses con datos reales (no ceros)
- [ ] Línea de año actual y año anterior visibles
- [ ] Hover muestra monto exacto por mes
- [ ] KPIs superiores reflejan totales correctos
- [ ] Tiempo de carga < 10 segundos (límite Netlify)

### Notas Técnicas
```
Función actual: fn_CGA_Cobrados(@dFechaIni DATE, @dFechaFin DATE, @nIdEmp11 INT)
Problema: Usa tablas temporales variables (@TABLE) que no soportan paralelismo
Query actual: SELECT SUM(GastosME_Cob + IngresosME_Cob) FROM fn_CGA_Cobrados(...)
```

---

## 📋 Historial de Cambios

| Fecha | Cambio | Resultado |
|-------|--------|-----------|
| 2025-02-19 | Timeout 5s → 9s | Reduce aborts, da más tiempo a consultas pesadas |
| 2025-02-19 | Batch_SIZE 2 → 1 | Consultas secuenciales, evita bloqueos TVF |
| 2025-02-19 | 12 meses → 6 meses | Reduce tiempo total, evita timeout Netlify |
| 2025-02-19 | Agregado executeQueryWithRetry | Retry automático con cache de 5min |
| 2025-02-19 | **Año default 2026 → 2025** | 2026 solo tenía datos hasta febrero |

---

## ✅ Estado Actual US-001

**Fase 1 completada** - Todos los hotfixes aplicados:
- ✅ Timeout 9s (límite Netlify)
- ✅ Consultas secuenciales (BATCH_SIZE=1)
- ✅ 6 meses en lugar de 12
- ✅ Retry con cache
- ✅ Año 2025 (datos completos)

**Próximo paso**: Recargar dashboard y verificar que la gráfica de Tendencia de Cobrado muestre datos para los 6 meses (Ene-Jun 2025) sin ceros.

Si la gráfica se ve correcta con datos de 2025, marcaremos US-001 como completado y pasaremos a **US-002: Antigüedad de Cartera**.

---

## � US-002: Antigüedad de Cartera - Tareas Detalladas

### Especificación (del SDD)
- **Fuente de datos**: `fn_CuentasPorCobrar_Excel(@FechaCorte DATE, @IdEmpresa INT)`
- **Rangos**: 1-30, 31-60, 61-90, 91-120, 121+ días
- **Componentes**: PieChart (5 segmentos con colores por riesgo) + DataTable filtrable por rango
- **Colores**: Verde (bajo riesgo) → Rojo oscuro (crítico)

### Arquitectura Implementada

```
GET /api/antiguedad-cartera?fechaCorte=YYYY-MM-DD&idEmpresa=1
  └── fn_CuentasPorCobrar_Excel (API RECO)
      └── Filtra TipoCliente = 'Externo'
          └── Agrupa por RFC/Cliente
              └── Calcula buckets por DiasTranscurridos
```

### Tareas de Implementación

#### Fase 1: Backend API (Completado)
- [x] Crear `/api/antiguedad-cartera/route.ts`
- [x] Query a `fn_CuentasPorCobrar_Excel` con filtro `TipoCliente = 'Externo'`
- [x] Calcular `AgingBuckets` (5 rangos) en el servidor
- [x] Calcular `AgingDetails` agrupados por RFC/Cliente
- [x] Calcular `AgingSummary` (totalAmount, totalClients, averageDays)
- [x] Usar `executeQueryWithRetry` con cache

#### Fase 2: Frontend Hook (Completado)
- [x] Crear `hooks/useAgingData.ts` con React Query
- [x] `staleTime: 5min`, `gcTime: 10min`
- [x] Parámetros: `fechaCorte` (hoy por defecto) + `idEmpresa`

#### Fase 3: Componente UI (Completado)
- [x] Crear `components/charts/AgingAnalysis.tsx`
- [x] PieChart con 5 segmentos clicables
- [x] Botones de filtro por rango (Todos / 1-30 / 31-60 / 61-90 / 91-120 / 121+)
- [x] DataTable con columnas: Cliente, RFC, 1-30, 31-60, 61-90, 91-120, 121+, **Total**, Sucursal
- [x] Summary cards al pie con totales por rango
- [x] Tooltip personalizado con monto, % y nivel de riesgo

#### Fase 4: Integración en Dashboard (Completado)
- [x] Activar `useAgingData` en `dashboard-overview.tsx` (descomentado)
- [x] Reemplazar mock data por datos reales en Tab "Cartera"
- [x] Agregar estado de carga (loading) y estado vacío

#### Fase 5: Verificación de Datos (Pendiente)
- [ ] Verificar que la API devuelve datos reales de `fn_CuentasPorCobrar_Excel`
- [ ] Confirmar que `DiasTranscurridos` mapea correctamente a los rangos
- [ ] Validar que los totales del PieChart coinciden con la tabla
- [ ] Probar filtro por rango (clic en segmento del pie)
- [ ] Verificar responsive en móvil

### Criterios de Aceptación US-002
- [ ] PieChart muestra 5 segmentos con datos reales (no ceros)
- [ ] Clic en segmento filtra la tabla debajo
- [ ] Tabla muestra: Cliente, RFC, montos por rango, Total, Sucursal
- [ ] Totales de tabla coinciden con totales del PieChart
- [ ] Tiempo de carga < 10 segundos (límite Netlify)
- [ ] Funciona con filtro de sucursal (si aplica)

### Notas Técnicas
```
Función: fn_CuentasPorCobrar_Excel(@FechaCorte DATE, @IdEmpresa INT)
Columnas usadas: Nombre, RFC, Saldo (→Total), DiasTranscurridos (→Dias), NombreSucursal
Filtro: TipoCliente = 'Externo'
Agrupación: Por RFC (un cliente puede tener múltiples facturas en diferentes rangos)
```

---

## 📋 Historial de Cambios

| Fecha | US | Cambio | Resultado |
|-------|-----|--------|-----------|
| 2026-02-19 | US-001 | Timeout 5s → 9s | Reduce aborts |
| 2026-02-19 | US-001 | Batch_SIZE 2 → 1 | Consultas secuenciales |
| 2026-02-19 | US-001 | 12 meses → 6 meses | Evita timeout Netlify |
| 2026-02-19 | US-001 | Agregado executeQueryWithRetry | Retry automático |
| 2026-02-19 | US-001 | Frontend-driven fetch por mes | Evita timeout de 10s |
| 2026-02-19 | US-002 | Activar useAgingData en dashboard | Hook conectado a API real |
| 2026-02-19 | US-002 | Agregar columnas Total + Sucursal en AgingAnalysis | Tabla más completa |

---

## 🚀 Próximos Pasos

1. **Verificar US-002**: Abrir tab "Cartera" y confirmar que el PieChart muestra datos reales
2. **Si hay datos**: Marcar US-002 como terminado y pasar a US-003
3. **Si hay timeout**: Aplicar mismo patrón que US-001 (fetch por mes/período)
4. **US-003 siguiente**: Tendencia Cartera CXC (Vencido vs En tiempo)

---

*Última actualización: 2026-02-19*
