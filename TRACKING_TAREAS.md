# Tracking Dashboard GCX - Tareas por User Story

> **Enfoque actual**: US-006 Oficinas — siguiente a implementar
> **Estrategia**: Consultas directas a TVFs + filtro JS. fn_CuentasPorCobrar_Excel reemplazada con JOINs directos para US-002/003.

---

## 🎯 User Stories - Estado General

| ID | User Story | Estado | Prioridad | Blockers |
|----|-----------|--------|-----------|----------|
| US-001 | **Tendencia de Cobrado** (comparativo año pasado) | ✅ **TERMINADO** | Alta | - |
| US-002 | Antigüedad Cartera General + tabla | ✅ **TERMINADO** | Alta | Resuelto: consulta directa a tablas base (~5s) |
| US-003 | Tendencia Cartera CXC (Vencido vs En tiempo) | ✅ **TERMINADO** | Alta | Resuelto: consulta directa a tablas base (~5s) |
| US-004 | Tendencia Financiamiento CxC DAC | ✅ **TERMINADO** | Alta | Resuelto: AVG+GROUP BY elimina duplicados del FULL OUTER JOIN |
| US-005 | Estatus Garantías | ✅ **TERMINADO** | Alta | fn_Garantias_Estatus funcionando |
| US-006 | Resumen Corporativo por Oficina | ✅ **TERMINADO** | Alta | Resuelto: consulta directa tablas base (~5s) |
| US-007 | Módulo Facturación DAC | 🔴 **EN PROCESO** | Media | TOP 300 funciona (~29s) |
| US-008 | Tendencia Cartera Garantías + Antigüedad | ✅ **TERMINADO** | Media | fn_GarantiasPorCobrar funcionando |

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
- **Fuente de datos**: Consulta directa a `ADMIN_VT_CGastosCabecera` + `ADMIN_VT_SaldoCGA` + `ADMINC_07_CLIENTES` (~5s)
- **Rangos**: 1-30, 31-60, 61-90, 91-120, 121+ días
- **Componentes**: PieChart (5 segmentos con colores por riesgo, más grande) + DataTable filtrable por rango
- **Colores**: Verde (bajo riesgo) → Rojo oscuro (crítico)
- **Filtro clientes internos**: Réplica de `dbo.EsClienteInterno` en JavaScript (6 RFCs + 2 nombres)

### Arquitectura Implementada

```
GET /api/antiguedad-cartera?fechaCorte=YYYY-MM-DD&idEmpresa=1
  └── Consulta directa a tablas base (~5s vs 30s+ con TVF)
      ├── ADMIN_VT_CGastosCabecera cg
      ├── LEFT JOIN ADMIN_VT_SaldoCGA s (saldo actual)
      └── INNER JOIN ADMINC_07_CLIENTES c (datos cliente)
      └── Filtro JS: EsClienteInterno (6 RFCs + 2 nombres)
          └── Agrupa por RFC/Cliente → buckets por DiasTranscurridos
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

#### Fase 5: Verificación de Datos (Completado)
- [x] Verificar que la API devuelve datos reales (consulta directa ~5s, 5000+ filas)
- [x] Confirmar que `DiasTranscurridos` mapea correctamente a los rangos
- [x] Validar que los totales del PieChart coinciden con la tabla
- [x] Probar filtro por rango (clic en segmento del pie)
- [x] Tabla detalle por cliente poblada con datos reales

### Criterios de Aceptación US-002
- [x] PieChart muestra 5 segmentos con datos reales (gráfica más grande: 55% radio)
- [x] Clic en segmento filtra la tabla debajo
- [x] Tabla muestra: Cliente, RFC, montos por rango, Total, Sucursal
- [x] Totales de tabla coinciden con totales del PieChart
- [x] Tiempo de carga ~5s (vs 30s+ timeout anterior)
- [x] Badge con tooltip explicativo

### Notas Técnicas
```
Consulta directa: ADMIN_VT_CGastosCabecera + ADMIN_VT_SaldoCGA + ADMINC_07_CLIENTES
Columnas: s.Saldo (→Total), DATEDIFF calculado (→Dias), c.sRFC, c.sRazonSocial
Filtro: ABS(Saldo) > 1 + EsClienteInterno en JS
Agrupación: Por RFC (un cliente puede tener múltiples facturas en diferentes rangos)
Optimización clave: Eliminó Admin.SaldoCGAFechaCorte y dbo.EsClienteInterno (funciones escalares lentas)
```

---

---

## � US-003: Tendencia Cartera CXC - Tareas Detalladas

### Especificación (del SDD)
- **Fuente de datos**: Consulta directa a tablas base (~5s, una sola llamada)
- **Métrica derivada**: `Vencido = DiasTranscurridos > DiasCredito`, `En tiempo = lo contrario`
- **Componentes**: Tabla mensual + Stacked Bar Chart lado a lado (Vencido=Azul / En tiempo=Naranja) + DataTable colapsable
- **Columnas tabla mensual**: Mes, Vencido, En Tiempo, Total, % Vencido
- **Layout**: Tabla izquierda + Gráfica derecha (como imagen de referencia)

### Arquitectura Implementada

```
GET /api/tendencia-cxc?year=2026&idEmpresa=1
  └── Consulta directa ÚNICA a tablas base (~5s vs 6×30s)
      ├── ADMIN_VT_CGastosCabecera + ADMIN_VT_SaldoCGA + ADMINC_07_CLIENTES
      └── WHERE YEAR(cg.Fecha) = year
      └── JS: Filtro EsClienteInterno + cálculo Vencido/EnTiempo + GROUP BY mes
```

### Tareas de Implementación

#### Fase 1: Backend API (Completado)
- [x] Crear `/api/tendencia-cxc/route.ts`
- [x] Loop secuencial mes a mes (mismo patrón que US-001)
- [x] Calcular `onTime = totalPortfolio - totalOverdue`
- [x] Calcular `overduePercentage` por mes
- [x] Usar `executeQueryWithRetry` con cache

#### Fase 2: Frontend Hook (Completado)
- [x] Crear `hooks/usePortfolioTrend.ts` con React Query
- [x] `staleTime: 5min`, `gcTime: 10min`
- [x] Parámetros: `year` + `idEmpresa`

#### Fase 3: Componente UI (Completado)
- [x] `PortfolioTrendChart.tsx` — Stacked Bar Chart (Vencido/En tiempo)
- [x] Tooltip con monto y % vencido por mes
- [x] DataTable colapsable con detalle por cliente
- [x] Summary cards: Total Vencido, Total En Tiempo, Cartera Actual, % Vencido Actual

#### Fase 4: Integración en /cartera (Completado)
- [x] Activar `usePortfolioTrend` en `cartera-overview.tsx`
- [x] Selector de año para US-003
- [x] US-002 y US-003 en la misma página `/cartera` con loading independiente

#### Fase 5: Verificación de Datos (Completado)
- [x] API devuelve datos reales (~5s, una sola consulta)
- [x] Vencido/EnTiempo calculados con lógica DiasTranscurridos vs DiasCredito
- [x] Layout tabla + gráfica lado a lado (como imagen de referencia)
- [x] Badge con tooltip explicativo (% Vencido con contexto)
- [x] Todos los meses del año actual se cargan sin timeout

### Criterios de Aceptación US-003
- [x] Tabla mensual + barras apiladas lado a lado
- [x] Azul = Vencido (inferior), Naranja = En tiempo (superior)
- [x] Hover muestra monto y % vencido por mes
- [x] Tabla colapsable muestra detalle por cliente
- [x] Tiempo de carga ~5s (1 query vs 6×30s anterior)

### Notas Técnicas
```
Consulta directa: ADMIN_VT_CGastosCabecera + ADMIN_VT_SaldoCGA + ADMINC_07_CLIENTES
Columnas: s.Saldo, DiasTranscurridos (calculado), c.nDiasCred, MONTH(cg.Fecha)
Filtro: ABS(Saldo) > 1 + YEAR(cg.Fecha) = year + EsClienteInterno en JS
Lógica: Vencido = DiasTranscurridos > DiasCredito, EnTiempo = lo contrario
Optimización: 1 query (~5s) reemplaza 6 llamadas secuenciales a TVF (~180s total)
```

---

## �� Historial de Cambios

| Fecha | US | Cambio | Resultado |
|-------|-----|--------|-----------|
| 2026-02-19 | US-001 | Timeout 5s → 9s | Reduce aborts |
| 2026-02-19 | US-001 | Batch_SIZE 2 → 1 | Consultas secuenciales |
| 2026-02-19 | US-001 | 12 meses → 6 meses | Evita timeout Netlify |
| 2026-02-19 | US-001 | Agregado executeQueryWithRetry | Retry automático |
| 2026-02-19 | US-001 | Frontend-driven fetch por mes | Evita timeout de 10s |
| 2026-02-19 | US-002 | Activar useAgingData en dashboard | Hook conectado a API real |
| 2026-02-19 | US-002 | Query simplificado: solo Saldo + DiasTranscurridos | Sin Nombre/RFC en query principal |
| 2026-02-19 | US-002 | Tabla principal: Rango / Monto / % (sin clientes) | Igual que imagen de referencia |
| 2026-02-19 | US-002 | Detalle por cliente movido a sección colapsable | Disponible bajo demanda |
| 2026-02-19 | US-003 | Activar usePortfolioTrend en cartera-overview | Hook conectado a API real |
| 2026-02-19 | US-003 | PortfolioTrendChart integrado en /cartera | Stacked Bar Chart activo |
| 2026-02-23 | US-002 | Eliminada fn_CuentasPorCobrar_Excel → consulta directa tablas base | ~5s vs 30s+ timeout |
| 2026-02-23 | US-002 | Filtro EsClienteInterno replicado en JS (6 RFCs + 2 nombres) | Sin funciones escalares |
| 2026-02-23 | US-002 | Tabla detalle por cliente poblada (calculateClientDetails) | Datos reales por RFC |
| 2026-02-23 | US-002 | Gráfica pastel más grande (55% radio, 380px altura) | Mejor visualización |
| 2026-02-23 | US-003 | Eliminada fn_CuentasPorCobrar_Excel → consulta directa tablas base | 1 query ~5s vs 6×30s |
| 2026-02-23 | US-003 | Layout tabla+gráfica lado a lado (como referencia) | Tabla mensual + barras apiladas |
| 2026-02-23 | US-003 | Cálculo Vencido/EnTiempo en JS (DiasTranscurridos vs DiasCredito) | Sin funciones escalares |
| 2026-02-23 | General | Badges con tooltips explicativos en Cobranza, Cartera CXC, Garantías | UX mejorado |

---

## ✅ US-004: Tendencia Financiamiento CxC DAC - TERMINADO

### Arquitectura Implementada
```
GET /api/financiamiento?year=2026&idEmpresa=1
  └── fn_Tendencia_Financiamiento (AVG + GROUP BY Unidad, Oficina)
      ├── Elimina duplicados del FULL OUTER JOIN interno
      ├── Math.abs() por fila (Pagos - Anticipos puede ser negativo)
      └── Agregación JS: tableDetails agrupados por Unidad+Oficina (sin mes)
```

### Componentes
- [x] API: `/api/financiamiento/route.ts` — AVG+GROUP BY, Math.abs(), trim()
- [x] Hook: `hooks/useFinancingTrend.ts`
- [x] Componente: `FinancingTrendChart.tsx` — KPI cards + tabla mensual + gráfica apilada
- [x] Layout: tabla izquierda + gráfica derecha (como referencia visual)
- [x] Colores: Azul (#1565C0) = Por Facturar, Naranja (#FF9800) = Facturado
- [x] Encabezado tabla: bg-blue-700 (consistente con demás tablas)
- [x] Botón "Ver Detalle por Oficina" (azul, con icono)
- [x] Selector de oficina eliminado (no aplica por estructura de datos)

### Problemas Resueltos
- fn_Tendencia_Financiamiento devuelve `Pagos - Anticipos` (negativo cuando anticipos > pagos) → `Math.abs()`
- FULL OUTER JOIN ON Unidad (sin Oficina) crea producto cartesiano → `AVG + GROUP BY Unidad, Oficina`
- Duplicados en tabla detalle por espacios en nombres → `trim()` en key de agrupación

---

## ✅ US-005: Estatus de Garantías - TERMINADO

### Arquitectura Implementada
```
GET /api/garantias/estatus?year=2026&idEmpresa=1
  └── fn_Garantias_Estatus con GROUP BY EstatusGarantia, DATEPART(WEEK, dDeposito)
      ├── 3 estatus: Programadas, Naviera, Operacion
      └── Resumen por semana + summary totales
```

### Componentes
- [x] API: `/api/garantias/estatus/route.ts`
- [x] Hook: `hooks/useGuaranteeStatus.ts`
- [x] Componente: `GuaranteeStatusChart.tsx` — tabla semanal + gráfica
- [x] Integrado en: `garantias-overview.tsx`

---

## ✅ US-008: Tendencia Cartera Garantías + Antigüedad - TERMINADO

### Arquitectura Implementada
```
Tendencia: GET /api/garantias/tendencia?year=2026&idEmpresa=1
  └── fn_GarantiasPorCobrar por semana (últimas 20 semanas, batches de 5)
      ├── Umbral vencido: 45 días
      └── Vencido vs En Proceso + detalle por proveedor

Antigüedad: GET /api/garantias/antiguedad?idEmpresa=1
  └── fn_GarantiasPorCobrar (fecha hoy)
      └── Pie chart con rangos 1-30, 31-60, 61-90, 91-120, 121+
```

### Componentes
- [x] API Tendencia: `/api/garantias/tendencia/route.ts`
- [x] API Antigüedad: `/api/garantias/antiguedad/route.ts`
- [x] Hooks: `useGuaranteeTrend.ts`, `useGuaranteeAging.ts`
- [x] Componentes: `GuaranteeTrendChart.tsx`, `GuaranteeAgingChart.tsx`
- [x] Integrado en: `garantias-overview.tsx` (selector de año, 3 secciones)

---

## ✅ US-006: Resumen Corporativo por Oficina - TERMINADO

### Arquitectura Implementada
```
GET /api/resumen-oficinas?fechaCorte=2026-02-24&idEmpresa=1
  └── Consulta directa a tablas base (~5s)
      ├── ADMIN_VT_CGastosCabecera + ADMIN_VT_SaldoCGA + ADMINC_07_CLIENTES
      ├── NombreSucursal como Oficina
      ├── Filtro EsClienteInterno en JS
      └── Agrupación por oficina con rangos 01-30, 31-45, 46-60, 61-90, 91+
```

### Componentes
- [x] API: `/api/resumen-oficinas/route.ts` — consulta directa (eliminada fn_CuentasPorCobrar_Excel)
- [x] Hook: `hooks/useOfficeSummary.ts`
- [x] Componente: `components/oficinas/OfficeSummaryTable.tsx`
- [x] Página: `/oficinas/page.tsx` — conectada con hook + componente
- [x] KPI cards: Cartera Total, Vencido (%), Cobrado
- [x] Tabla sorteable: Oficina, Facturas, rangos antigüedad, Total, Vencido
- [x] Fila totales, encabezado blue-700, columna Oficina sticky
- [x] Highlight rojo en oficinas con >30% vencido

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
| 2026-02-19 | US-003 | Activar usePortfolioTrend en cartera-overview | Hook conectado a API real |
| 2026-02-23 | US-002 | Eliminada fn_CuentasPorCobrar_Excel → consulta directa tablas base | ~5s vs 30s+ timeout |
| 2026-02-23 | US-002 | Filtro EsClienteInterno replicado en JS (6 RFCs + 2 nombres) | Sin funciones escalares |
| 2026-02-23 | US-002 | Gráfica pastel más grande (55% radio, 380px altura) | Mejor visualización |
| 2026-02-23 | US-003 | Eliminada fn_CuentasPorCobrar_Excel → consulta directa tablas base | 1 query ~5s vs 6×30s |
| 2026-02-23 | US-003 | Layout tabla+gráfica lado a lado (como referencia) | Tabla mensual + barras apiladas |
| 2026-02-23 | General | Badges con tooltips explicativos en Cobranza, Cartera CXC, Garantías | UX mejorado |
| 2026-02-23 | US-004 | KPI cards + tabla mensual + gráfica apilada (rediseño completo) | Layout como referencia visual |
| 2026-02-23 | US-004 | AVG+GROUP BY elimina duplicados FULL OUTER JOIN | 62→11 filas/mes |
| 2026-02-23 | US-004 | Math.abs() por fila (Pagos-Anticipos negativo) | Valores positivos |
| 2026-02-23 | US-004 | Colores azul/naranja, encabezado blue-700 | Consistencia visual |
| 2026-02-23 | US-004 | Detalle agrupado por Unidad+Oficina con trim() | Sin duplicados |
| 2026-02-23 | US-004 | Selector oficina eliminado, botón detalle estilizado | UX simplificado |
| 2026-02-23 | US-006 | Eliminada fn_CuentasPorCobrar_Excel → consulta directa tablas base | ~5s vs timeout 9s+ |
| 2026-02-23 | US-006 | OfficeSummaryTable con KPI cards, tabla sorteable, totales | Página /oficinas funcional |
| 2026-02-23 | US-006 | Filtro EsClienteInterno en JS, agrupación por NombreSucursal | Datos correctos por oficina |

---

## 🚀 Próximos Pasos

1. **US-007**: Facturación DAC — único pendiente
2. **Optimización general**: Considerar vista materializada para consultas CXC recurrentes

---

*Última actualización: 2026-02-23*
