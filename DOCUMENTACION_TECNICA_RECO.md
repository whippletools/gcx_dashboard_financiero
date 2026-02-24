# Documentación Técnica — Dashboard Financiero GCX
## Para equipo RECO: Consultas, Funciones y Arquitectura

**Fecha:** 2026-02-23  
**Proyecto:** Dashboard Financiero GCX (Next.js + API RECO)  
**Autor:** Equipo Whipple / GCX  

---

## 1. Contexto General

El Dashboard Financiero GCX consume datos de la base de datos RECO mediante su API REST. Esta API tiene **restricciones importantes** que impiden el uso de Stored Procedures y ciertos comandos SQL, lo cual requirió adaptar las consultas originales.

### 1.1 Restricciones de la API RECO

| Permitido | **NO Permitido** |
|-----------|-----------------|
| `SELECT` | `EXEC` / `EXECUTE` |
| `WITH ... SELECT` (CTEs) | `CREATE` / `ALTER` / `DROP` |
| `SELECT FROM dbo.fn_xxx()` (TVFs) | `DECLARE` / `SET` |
| `GROUP BY`, `ORDER BY`, `JOIN` | `INSERT` / `UPDATE` / `DELETE` |
| `SUM`, `AVG`, `COUNT`, `CASE` | `WHILE` / loops |
| `DATEPART`, `DATEDIFF`, `ISNULL` | Variables (`@var`) |

> **Consecuencia:** No se pueden ejecutar los Stored Procedures originales (`sp_Tendencia_Cobrado`, `sp_Antiguedad_cartera`, etc.) porque contienen `DECLARE`, `INSERT INTO @Table`, `WHILE`, `SET`, etc. Se requiere llamar directamente a las **Table-Valued Functions (TVFs)** subyacentes o a las **tablas base**.

---

## 2. Stored Procedures Originales vs. Consultas Actuales

### Resumen de cambios

| SP Original | TVF/Tabla Usada Ahora | Motivo del Cambio |
|-------------|----------------------|-------------------|
| `sp_Tendencia_Cobrado` | `dbo.fn_CGA_Cobrados` | SP usa DECLARE/WHILE — TVF directa funciona |
| `sp_Antiguedad_cartera` | Tablas base directas | `fn_CuentasPorCobrar_Excel` causa timeout (>30s) |
| `sp_Tendencia_cartera_CxC` | Tablas base directas | `fn_CuentasPorCobrar_Excel` causa timeout (>30s) |
| `sp_Tendencia_Financiamiento` | `dbo.fn_Tendencia_Financiamiento` | SP usa DECLARE/WHILE — TVF directa funciona |
| `sp_Estatus_Garantia` | `dbo.fn_Garantias_Estatus` | SP usa DECLARE/WHILE — TVF directa funciona |
| `sp_Tendencia_cartera_Garantias` | `dbo.fn_GarantiasPorCobrar` | SP usa DECLARE/WHILE — TVF directa funciona |
| `sp_Facturacion` | Tablas base directas | `fn_Facturacion` **NO EXISTE** en RECO |
| *(Resumen Oficinas)* | Tablas base directas | `fn_CuentasPorCobrar_Excel` causa timeout (>30s) |

---

## 3. Problema Principal: `fn_CuentasPorCobrar_Excel` (Timeout)

La función `dbo.fn_CuentasPorCobrar_Excel(@FechaCorte, @IdEmpresa)` es utilizada internamente por varios SPs, pero **causa timeout** (>30 segundos) porque internamente llama a funciones escalares lentas:

| Función Escalar Lenta | Problema | Solución Aplicada |
|-----------------------|----------|-------------------|
| `Admin.SaldoCGAFechaCorte` | Cálculo fila por fila | `LEFT JOIN admin.ADMIN_VT_SaldoCGA` directo |
| `dbo.EsClienteInterno` | Evaluación escalar por fila | Replicado en JavaScript (ver §3.1) |
| `dbo.Trae_Unidad` | Búsqueda escalar por fila | Uso directo de `cg.NombreSucursal` |

### 3.1 Filtro EsClienteInterno (replicado en JavaScript)

La función `dbo.EsClienteInterno(@RFC, @NomCte)` determina si un cliente es interno según:

```
RFCs Internos (excluidos del dashboard):
  - DAC911011F57
  - GCA960517MYA
  - GLE961217IC5
  - KSI980219699
  - UNI931215B65
  - SPC911017BQ1

Nombres que inician con (excluidos):
  - 'INTERCONTINENTAL FORWARDING...'
  - 'RED TOTAL...'
```

Este filtro se aplica en JavaScript después de obtener los datos, para evitar la función escalar lenta en SQL.

### 3.2 Consulta Directa a Tablas Base (reemplazo de fn_CuentasPorCobrar_Excel)

```sql
-- Usada por US-002 (Antigüedad), US-003 (Tendencia CXC), US-006 (Oficinas), US-007 (Facturación)
-- Tiempo de respuesta: ~5 segundos (vs >30s con fn_CuentasPorCobrar_Excel)

SELECT
  ISNULL(s.Saldo, 0) AS Total,
  DATEDIFF(DAY,
    DATEADD(DAY,
      CASE WHEN ISNULL(c.nDiasCred, 0) > 0 THEN c.nDiasCred ELSE 0 END,
      cg.Fecha
    ),
    '{fechaCorte}'
  ) AS DiasTranscurridos,
  CASE WHEN cg.FacturarAidCliente > 0 THEN cg.FacturarARfcCliente ELSE c.sRFC END AS RFC,
  CASE WHEN cg.FacturarAidCliente > 0 THEN cg.FacturarARazonSocialCliente ELSE c.sRazonSocial END AS RazonSocial,
  cg.NombreSucursal AS Oficina
FROM admin.ADMIN_VT_CGastosCabecera cg
LEFT JOIN admin.ADMIN_VT_SaldoCGA s ON cg.IdCuentaGastos = s.nIdCtaGastos15
INNER JOIN Admin.ADMINC_07_CLIENTES c ON c.nIdClie07 = ISNULL(cg.FacturarAidCliente, cg.IdCliente)
WHERE cg.idEmpresa = {idEmpresa}
  AND cg.Estatus <> 1
  AND ABS(ISNULL(s.Saldo, 0)) > 1
  AND cg.Fecha < DATEADD(DD, 1, '{fechaCorte}')
```

**Tablas involucradas:**

| Tabla | Alias | Propósito |
|-------|-------|-----------|
| `admin.ADMIN_VT_CGastosCabecera` | `cg` | Cabecera de cuentas de gastos (facturas) |
| `admin.ADMIN_VT_SaldoCGA` | `s` | Saldos actuales por cuenta de gasto |
| `Admin.ADMINC_07_CLIENTES` | `c` | Catálogo de clientes (RFC, razón social, días crédito) |

---

## 4. Detalle por Módulo del Dashboard

---

### 4.1 US-001: Tendencia de Cobrado (Comparativo Anual)

**Endpoint:** `GET /api/tendencia-cobrado?year=2026&idEmpresa=1`  
**Gráfica:** Línea dual — año actual vs año anterior  
**Periodicidad:** Mensual (6 meses)

**SP Original:** `sp_Tendencia_Cobrado` (no ejecutable por RECO — usa DECLARE, WHILE, INSERT)  
**TVF Usada:** `dbo.fn_CGA_Cobrados(@FechaIni, @FechaFin, @IdEmpresa)` ✅

**Consulta:**
```sql
-- Se ejecuta UNA vez por mes (secuencial, 6 meses por año, 2 años = 12 queries)
SELECT
  SUM(GastosME_Cob + IngresosME_Cob) AS TotalCobrado,
  COUNT(*) AS CantidadFacturas
FROM dbo.fn_CGA_Cobrados('{startDate}', '{endDate}', {idEmpresa})
```

**Parámetros por mes:**
- `startDate` = primer día del mes (ej: `2026-01-01`)
- `endDate` = último día del mes (ej: `2026-01-31`)

**Columnas retornadas por la TVF:**
- `GastosME_Cob` — Gastos cobrados en moneda empresa
- `IngresosME_Cob` — Ingresos cobrados en moneda empresa

**Visualización:**
- Eje X: Meses (Ene–Jun)
- Eje Y: Monto cobrado ($)
- Serie 1: Año actual (azul)
- Serie 2: Año anterior (gris)

---

### 4.2 US-002: Antigüedad de Cartera

**Endpoint:** `GET /api/antiguedad-cartera?fechaCorte=2026-02-24&idEmpresa=1`  
**Gráfica:** Pastel (pie chart) con 5 rangos de antigüedad + tabla por cliente  
**Periodicidad:** Snapshot a fecha de corte

**SP Original:** `sp_Antiguedad_cartera` (no ejecutable por RECO)  
**TVF Original:** `fn_CuentasPorCobrar_Excel` ❌ (timeout >30s)  
**Consulta Actual:** Tablas base directas (~5s) ✅

**Consulta:** *(ver §3.2 — consulta base directa)*

**Rangos de antigüedad (calculados en JavaScript):**

| Rango | Días | Color | Riesgo |
|-------|------|-------|--------|
| 1-30 | 1 a 30 | Verde | Bajo |
| 31-60 | 31 a 60 | Amarillo | Atención |
| 61-90 | 61 a 90 | Naranja | Alerta |
| 91-120 | 91 a 120 | Rojo | Riesgo |
| 121+ | 121 a 5000 | Rojo oscuro | Crítico |

**Cálculo de días vencidos:**
```
DiasTranscurridos = DATEDIFF(DAY, Fecha + DiasCrédito, FechaCorte)
  - Si DiasTranscurridos > 0 → Vencido
  - Si DiasTranscurridos ≤ 0 → Vigente
```

**Visualización:**
- Gráfica pastel: % por rango
- Tabla: Cliente, RFC, Rango 1-30, 31-60, 61-90, 91-120, 121+, Total

---

### 4.3 US-003: Tendencia Cartera CXC (Vencido vs En Tiempo)

**Endpoint:** `GET /api/tendencia-cxc?year=2026&idEmpresa=1`  
**Gráfica:** Barras apiladas mensuales — Vencido (azul) + En Tiempo (naranja)  
**Periodicidad:** Mensual

**SP Original:** `sp_Tendencia_cartera_CxC` (no ejecutable por RECO)  
**TVF Original:** `fn_CuentasPorCobrar_Excel` ❌ (timeout >30s)  
**Consulta Actual:** Tablas base directas (~5s, 1 sola query para todo el año) ✅

**Consulta:**
```sql
SELECT
  ISNULL(s.Saldo, 0) AS Saldo,
  DATEDIFF(DAY,
    DATEADD(DAY,
      CASE WHEN ISNULL(c.nDiasCred, 0) > 0 THEN c.nDiasCred ELSE 0 END,
      cg.Fecha
    ),
    '{fechaCorte}'
  ) AS DiasTranscurridos,
  ISNULL(c.nDiasCred, 0) AS DiasCredito,
  MONTH(cg.Fecha) AS Mes,
  CASE WHEN cg.FacturarAidCliente > 0 THEN cg.FacturarARfcCliente ELSE c.sRFC END AS RFC,
  CASE WHEN cg.FacturarAidCliente > 0 THEN cg.FacturarARazonSocialCliente ELSE c.sRazonSocial END AS RazonSocial,
  cg.NombreSucursal AS Sucursal
FROM admin.ADMIN_VT_CGastosCabecera cg
LEFT JOIN admin.ADMIN_VT_SaldoCGA s ON cg.IdCuentaGastos = s.nIdCtaGastos15
INNER JOIN Admin.ADMINC_07_CLIENTES c ON c.nIdClie07 = ISNULL(cg.FacturarAidCliente, cg.IdCliente)
WHERE cg.idEmpresa = {idEmpresa}
  AND cg.Estatus <> 1
  AND ABS(ISNULL(s.Saldo, 0)) > 1
  AND cg.Fecha < DATEADD(DD, 1, '{fechaCorte}')
  AND YEAR(cg.Fecha) = {year}
```

**Cálculo Vencido/En Tiempo (en JavaScript):**
```
Si DiasTranscurridos > DiasCredito → Vencido
Si DiasTranscurridos ≤ DiasCredito → En Tiempo
```

**Visualización:**
- Tabla izquierda: Mes, Vencido, En Tiempo, Total, % Vencido
- Gráfica derecha: Barras apiladas (Azul = Vencido, Naranja = En Tiempo)

---

### 4.4 US-004: Tendencia Financiamiento CxC DAC

**Endpoint:** `GET /api/financiamiento?year=2026&idEmpresa=1`  
**Gráfica:** Barras apiladas — Por Facturar (azul) + Facturado (naranja)  
**Periodicidad:** Mensual (6 meses)

**SP Original:** `sp_Tendencia_Financiamiento` (no ejecutable por RECO)  
**TVF Usada:** `dbo.fn_Tendencia_Financiamiento(@FechaIni, @FechaFin, @IdEmpresa)` ✅

**Consulta:**
```sql
-- Se ejecuta UNA vez por mes (6 queries secuenciales)
-- AVG + GROUP BY elimina duplicados causados por FULL OUTER JOIN interno de la función
SELECT
  Unidad,
  Oficina,
  AVG(PagosFinanciadosPendiente) AS PagosFinanciadosPendiente,
  AVG(PagosFinanciadosFacturado) AS PagosFinanciadosFacturado
FROM dbo.fn_Tendencia_Financiamiento('{startDate}', '{endDate}', {idEmpresa})
GROUP BY Unidad, Oficina
```

**Parámetros por mes:**
- `startDate` = primer día del mes (ej: `2026-01-01`)
- `endDate` = último día del mes (ej: `2026-01-31`)

**Nota técnica — Valores negativos:**
La función calcula `Pagos - Anticipos`, lo cual puede resultar negativo cuando los anticipos superan a los pagos. Se aplica `Math.abs()` en JavaScript para mostrar valores positivos.

**Nota técnica — Duplicados:**
La función internamente usa `FULL OUTER JOIN ON Unidad` (sin incluir Oficina), lo que crea un producto cartesiano. Se resuelve con `AVG + GROUP BY Unidad, Oficina` que reduce las filas de ~62 a ~11 por mes.

**Columnas retornadas por la TVF:**
- `Unidad` — Unidad operativa (ej: Aer, Mar, Ter)
- `Oficina` — Nombre de sucursal (ej: CDMX, MONTERREY)
- `PagosFinanciadosPendiente` — Pagos financiados pendientes de facturar
- `PagosFinanciadosFacturado` — Pagos financiados ya facturados

**Visualización:**
- KPI cards: Total Financiamiento, Por Facturar, Facturado
- Tabla izquierda: Mes, Por Facturar, Facturado, Total
- Gráfica derecha: Barras apiladas (Azul = Por Facturar, Naranja = Facturado)
- Detalle: Tabla agrupada por Unidad + Oficina

---

### 4.5 US-005: Estatus de Garantías

**Endpoint:** `GET /api/garantias/estatus?year=2026&idEmpresa=1`  
**Gráfica:** Barras apiladas semanales — Programadas + Naviera + Operación  
**Periodicidad:** Semanal (agrupado por semana del año)

**SP Original:** `sp_Estatus_Garantia` (no ejecutable por RECO)  
**TVF Usada:** `dbo.fn_Garantias_Estatus(@FechaInicio, @FechaCorte, @IdEmpresa)` ✅

**Consulta:**
```sql
SELECT
  EstatusGarantia AS Estatus,
  DATEPART(WEEK, dDeposito) AS Semana,
  SUM(Saldo) AS ImporteMN
FROM dbo.fn_Garantias_Estatus('{year}-01-01', '{year}-12-31', {idEmpresa})
WHERE Saldo > 0
GROUP BY EstatusGarantia, DATEPART(WEEK, dDeposito)
ORDER BY Semana, EstatusGarantia
```

**Valores de EstatusGarantia:**

| Valor | Significado | Color UI |
|-------|------------|----------|
| `Programadas` | Garantías programadas | Azul |
| `Naviera` | Desviaciones naviera | Rojo |
| `Operacion` | En operación | Verde |

**Columnas retornadas por la TVF:**
- `EstatusGarantia` — Tipo de estatus (Programadas/Naviera/Operacion)
- `Saldo` — Monto de la garantía
- `dDeposito` — Fecha de depósito

**Visualización:**
- Resumen: Total por estatus con porcentaje
- Tabla: Semana, Programadas, Naviera, Operación, Total
- Gráfica: Barras apiladas por semana

---

### 4.6 US-006: Resumen Corporativo por Oficina

**Endpoint:** `GET /api/resumen-oficinas?fechaCorte=2026-02-24&idEmpresa=1`  
**Gráfica:** Tabla sorteable con métricas por oficina  
**Periodicidad:** Snapshot a fecha de corte

**SP Original:** Usaba `fn_CuentasPorCobrar_Excel` ❌ (timeout >30s)  
**Consulta Actual:** Tablas base directas (~5s) ✅

**Consulta:** *(ver §3.2 — consulta base directa, con NombreSucursal AS Oficina)*

**Agrupación por oficina (en JavaScript):**
- Se agrupan las filas por `NombreSucursal`
- Se calculan rangos de antigüedad por oficina: 01-30, 31-45, 46-60, 61-90, 91+ días

**Visualización:**
- KPI cards: Cartera Total, Vencido (%), Cobrado
- Tabla: Oficina, Facturas, 01-30, 31-45, 46-60, 61-90, 91+, Total, Vencido
- Fila de totales
- Sorteable por cualquier columna

---

### 4.7 US-007: Facturación DAC

**Endpoint:** `GET /api/facturacion?year=2026&idEmpresa=1`  
**Gráfica:** Barras apiladas semanales — Honorarios (azul) + Resto (naranja)  
**Periodicidad:** Semanal

**SP Original:** `sp_Facturacion` (no ejecutable por RECO)  
**TVF del SP:** `dbo.fn_Facturacion(@FechaIni, @FechaFin, @IdEmpresa)` ❌ **NO EXISTE EN RECO**  
**Consulta Actual:** Tablas base directas (~5s) ✅

> ⚠️ **SOLICITUD A RECO:** La función `dbo.fn_Facturacion` no está disponible en la base de datos accesible vía API RECO. Se requiere que sea creada o habilitada para obtener el desglose real de **Honorarios** vs **Complementarios** por factura. Actualmente se usa un ratio estimado.

**Consulta actual (sin desglose honorarios/complementarios):**
```sql
SELECT
  DATEPART(WEEK, cg.Fecha) AS Semana,
  cg.NombreSucursal AS Oficina,
  ISNULL(s.Saldo, 0) AS Saldo,
  CASE WHEN cg.FacturarAidCliente > 0 THEN cg.FacturarARfcCliente ELSE c.sRFC END AS RFC,
  CASE WHEN cg.FacturarAidCliente > 0 THEN cg.FacturarARazonSocialCliente ELSE c.sRazonSocial END AS RazonSocial
FROM admin.ADMIN_VT_CGastosCabecera cg
LEFT JOIN admin.ADMIN_VT_SaldoCGA s ON cg.IdCuentaGastos = s.nIdCtaGastos15
INNER JOIN Admin.ADMINC_07_CLIENTES c ON c.nIdClie07 = ISNULL(cg.FacturarAidCliente, cg.IdCliente)
WHERE cg.idEmpresa = {idEmpresa}
  AND cg.Estatus <> 1
  AND ABS(ISNULL(s.Saldo, 0)) > 1
  AND YEAR(cg.Fecha) = {year}
```

**Consulta ideal (si fn_Facturacion estuviera disponible):**
```sql
SELECT
  Unidad,
  Oficina,
  SUM(Honorarios_ImpMB) AS Honorarios,
  SUM(Complementarios_ImpMB) AS OtrosIngresos,
  SUM(TotalMB) AS Total
FROM dbo.fn_Facturacion('{startDate}', '{endDate}', {idEmpresa})
GROUP BY Unidad, Oficina
```

**Visualización:**
- Selector de aduana/oficina
- Tabla: Semana, Honorarios, Resto, Total, Promedio
- Gráfica: Barras apiladas (Azul = Honorarios, Naranja = Resto)
- Resumen: Total Honorarios, Resto Facturación, Promedio Mensual

---

### 4.8 US-008: Tendencia Cartera de Garantías + Antigüedad

**Endpoints:**
- Tendencia: `GET /api/garantias/tendencia?year=2026&idEmpresa=1`
- Antigüedad: `GET /api/garantias/antiguedad?idEmpresa=1`

**SP Original:** `sp_Tendencia_cartera_Garantias` (no ejecutable por RECO)  
**TVF Usada:** `dbo.fn_GarantiasPorCobrar(@FechaCorte, @IdEmpresa)` ✅

#### Tendencia (semanal, últimas 20 semanas):
```sql
-- Se ejecuta UNA vez por semana (viernes), en batches de 5
SELECT
  sProveedor AS Nombre,
  DiasTranscurridos,
  CASE WHEN DiasTranscurridos > 45 THEN Saldo ELSE 0 END AS Vencido,
  CASE WHEN DiasTranscurridos <= 45 THEN Saldo ELSE 0 END AS EnProceso,
  Saldo,
  sNombreSucursal AS Sucursal
FROM dbo.fn_GarantiasPorCobrar('{fechaCorteViernes}', {idEmpresa})
WHERE Saldo > 0
```

**Umbral de vencimiento:** 45 días (si DiasTranscurridos > 45 → Vencido)

#### Antigüedad (snapshot):
```sql
SELECT
  DiasTranscurridos,
  Saldo,
  sProveedor AS Proveedor,
  sNombreSucursal AS Sucursal
FROM dbo.fn_GarantiasPorCobrar('{fechaCorteHoy}', {idEmpresa})
WHERE Saldo > 0
```

**Columnas retornadas por la TVF:**
- `sProveedor` — Nombre del proveedor
- `DiasTranscurridos` — Días desde depósito
- `Saldo` — Monto pendiente de la garantía
- `sNombreSucursal` — Sucursal/oficina

**Visualización:**
- Tendencia: Barras apiladas semanales (Azul = Vencido, Naranja = En Proceso)
- Antigüedad: Pie chart con rangos 1-30, 31-60, 61-90, 91-120, 121+

---

## 5. Resumen de TVFs Disponibles y Funcionales en RECO

| TVF | Parámetros | Status | Usada en |
|-----|-----------|--------|----------|
| `dbo.fn_CGA_Cobrados` | `(@FechaIni, @FechaFin, @IdEmpresa)` | ✅ Funcional | US-001 |
| `dbo.fn_CuentasPorCobrar_Excel` | `(@FechaCorte, @IdEmpresa)` | ⚠️ Timeout (>30s) | *Reemplazada* |
| `dbo.fn_Tendencia_Financiamiento` | `(@FechaIni, @FechaFin, @IdEmpresa)` | ✅ Funcional | US-004 |
| `dbo.fn_Garantias_Estatus` | `(@FechaInicio, @FechaCorte, @IdEmpresa)` | ✅ Funcional | US-005 |
| `dbo.fn_GarantiasPorCobrar` | `(@FechaCorte, @IdEmpresa)` | ✅ Funcional | US-008 |
| `dbo.fn_Facturacion` | `(@FechaIni, @FechaFin, @IdEmpresa)` | ❌ **No existe** | US-007 (pendiente) |

---

## 6. Solicitudes al Equipo RECO

### 6.1 ALTA PRIORIDAD — Crear/habilitar `fn_Facturacion`

La función `dbo.fn_Facturacion(@FechaIni DATE, @FechaFin DATE, @IdEmpresa INT)` es necesaria para el módulo de Facturación (US-007).

**Columnas esperadas del retorno:**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `Unidad` | VARCHAR | Unidad operativa (ej: Aer, Mar, Ter) |
| `Oficina` | VARCHAR | Nombre de sucursal |
| `Honorarios_ImpMB` | DECIMAL | Monto de honorarios en moneda base |
| `Complementarios_ImpMB` | DECIMAL | Monto de complementarios en moneda base |
| `TotalMB` | DECIMAL | Total facturado en moneda base |
| `PagosHechosMB` | DECIMAL | Pagos realizados en moneda base |
| `AnticipoMB` | DECIMAL | Anticipos en moneda base |
| `TotalFacturaME` | DECIMAL | Total factura en moneda empresa |

**Referencia:** La definición del SP `sp_Facturacion` utiliza esta función con los parámetros indicados.

### 6.2 MEDIA PRIORIDAD — Optimizar `fn_CuentasPorCobrar_Excel`

La función actual tarda >30 segundos por las funciones escalares internas:
- `Admin.SaldoCGAFechaCorte` (podría ser reemplazada por JOIN directo a `ADMIN_VT_SaldoCGA`)
- `dbo.EsClienteInterno` (podría ser un filtro directo por RFC)
- `dbo.Trae_Unidad` (podría usar directamente `NombreSucursal`)

Si se optimizara a <10 segundos, se podría usar directamente en vez de la consulta a tablas base.

### 6.3 BAJA PRIORIDAD — Habilitar ejecución de SPs

Si la API RECO pudiera ejecutar Stored Procedures (`EXEC sp_xxx @param1, @param2`), todas las consultas se simplificarían significativamente, ya que los SPs originales ya contienen toda la lógica de negocio.

---

## 7. Diagrama de Arquitectura

```
┌──────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                  │
│                                                       │
│  /cobranza     → CollectionTrendChart (líneas)       │
│  /cartera      → AgingChart (pastel) + CXC (barras)  │
│  /financiamiento → FinancingTrendChart (barras)      │
│  /oficinas     → OfficeSummaryTable (tabla)           │
│  /garantias    → StatusChart + TrendChart + AgingChart│
│  /facturacion  → BillingChart (barras apiladas)       │
│                                                       │
│  Hooks: useCollectionTrend, useAgingData,             │
│         usePortfolioTrend, useFinancingTrend,         │
│         useOfficeSummary, useGuaranteeStatus,         │
│         useGuaranteeTrend, useGuaranteeAging,         │
│         useBilling                                     │
├──────────────────────────────────────────────────────┤
│                    API ROUTES (Next.js)               │
│                                                       │
│  /api/tendencia-cobrado    → fn_CGA_Cobrados         │
│  /api/antiguedad-cartera   → Tablas base directas    │
│  /api/tendencia-cxc        → Tablas base directas    │
│  /api/financiamiento       → fn_Tendencia_Financiam. │
│  /api/resumen-oficinas     → Tablas base directas    │
│  /api/garantias/estatus    → fn_Garantias_Estatus    │
│  /api/garantias/tendencia  → fn_GarantiasPorCobrar   │
│  /api/garantias/antiguedad → fn_GarantiasPorCobrar   │
│  /api/facturacion          → Tablas base directas *  │
│                                                       │
│  * = fn_Facturacion no disponible en RECO             │
├──────────────────────────────────────────────────────┤
│                    API RECO (REST)                     │
│  - Solo SELECT permitido                              │
│  - Timeout: 9 segundos                                │
│  - Retry automático: 1-2 reintentos                   │
│  - Cache: 5 min staleTime                             │
├──────────────────────────────────────────────────────┤
│               BASE DE DATOS SQL SERVER                │
│                                                       │
│  Tablas:                                              │
│  - admin.ADMIN_VT_CGastosCabecera                    │
│  - admin.ADMIN_VT_SaldoCGA                           │
│  - Admin.ADMINC_07_CLIENTES                          │
│                                                       │
│  TVFs funcionales:                                    │
│  - dbo.fn_CGA_Cobrados                               │
│  - dbo.fn_Tendencia_Financiamiento                   │
│  - dbo.fn_Garantias_Estatus                          │
│  - dbo.fn_GarantiasPorCobrar                         │
│                                                       │
│  TVF no disponible:                                   │
│  - dbo.fn_Facturacion ❌                              │
└──────────────────────────────────────────────────────┘
```

---

## 8. Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Frontend | Next.js 14 + React 19 + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Gráficas | Recharts |
| State | React Query (TanStack Query) |
| API | Next.js API Routes |
| Base de datos | SQL Server (vía API RECO REST) |
| Deploy | Netlify |

---

*Documento generado el 2026-02-23 — Dashboard Financiero GCX v1.0*
