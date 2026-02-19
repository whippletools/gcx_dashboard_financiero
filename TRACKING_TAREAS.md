# Tracking Dashboard GCX - Tareas por User Story

> **Enfoque actual**: US-001 - Tendencia de Cobrado
> **Estrategia**: Trabajar una tabla a la vez hasta obtener datos correctos antes de pasar a la siguiente

---

## 🎯 User Stories - Estado General

| ID | User Story | Estado | Prioridad | Blockers |
|----|-----------|--------|-----------|----------|
| US-001 | **Tendencia de Cobrado** (comparativo año pasado) | 🔴 **EN PROCESO** | Alta | Timeout en consultas meses 3-12 |
| US-002 | Antigüedad Cartera General + tabla | ⚪ Pendiente | Alta | - |
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

## 🚀 Próximos Pasos Inmediatos

1. **Verificar datos reales**: Ejecutar query manual para marzo 2026 en BD
2. **Si hay datos**: El problema es timeout → necesitamos optimización SQL o Plan Pro Netlify
3. **Si no hay datos**: El problema es período fiscal → ajustar año a 2025 o 2024
4. **Decidir**: ¿Continuar con hotfix temporal o requerir optimización SQL del DBA?

---

*Última actualización: 2025-02-19 11:55am*
