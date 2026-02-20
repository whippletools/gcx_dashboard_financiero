# Procesos del Dashboard Financiero GCX

## Arquitectura General

El dashboard consume datos de **SQL Server** a través de la **API RECO** (`http://rws.grucas.com:19287/api/reco/encoded`), que solo permite consultas `SELECT` o `WITH SELECT`.

```
┌──────────────┐    HTTP POST     ┌───────────┐    SQL Query    ┌────────────┐
│  Next.js App │ ───────────────► │ API RECO  │ ─────────────► │ SQL Server │
│  (Frontend)  │ ◄─────────────── │ (Gateway) │ ◄───────────── │  (BD GCX)  │
│  localhost   │    JSON resp     │ :19287    │    Results      │            │
└──────────────┘                  └───────────┘                 └────────────┘
```

### Restricciones API RECO
- **Permitido**: `SELECT`, `WITH SELECT`
- **Prohibido**: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `ALTER`, `EXEC`, `MERGE`, `CALL`, `CREATE`
- Las queries se envían **codificadas en Base64**
- Autenticación: **Bearer Token** (credenciales en Base64)

---

## Procesos por Módulo

### 1. Tendencia de Cobrado (US-001)

**Endpoint**: `GET /api/tendencia-cobrado?year=2026&idEmpresa=1`

**Función SQL**: `dbo.fn_CGA_Cobrados(@dFechaIni DATE, @dFechaFin DATE, @nIdEmp11 INT)`

**Proceso**:
1. Genera una CTE con los 12 meses del año seleccionado
2. Usa `CROSS APPLY` para llamar a `fn_CGA_Cobrados` por cada mes
3. Agrega `GastosME_Cob + IngresosME_Cob` como **TotalCobrado** por mes
4. Compara año actual vs año anterior en la misma respuesta

**Query equivalente (antes era `sp_Tendencia_Cobrado`)**:
```sql
WITH CTE_Meses AS (
  SELECT 1 AS NumeroMes,
    DATEFROMPARTS(@Year, 1, 1) AS FechaInicioMes,
    EOMONTH(DATEFROMPARTS(@Year, 1, 1)) AS FechaFinMes
  UNION ALL
  SELECT NumeroMes + 1,
    DATEFROMPARTS(@Year, NumeroMes + 1, 1),
    EOMONTH(DATEFROMPARTS(@Year, NumeroMes + 1, 1))
  FROM CTE_Meses WHERE NumeroMes < 12
)
SELECT
  m.NumeroMes AS Mes,
  SUM(c.GastosME_Cob + c.IngresosME_Cob) AS TotalCobrado,
  COUNT(*) AS CantidadFacturas
FROM CTE_Meses m
CROSS APPLY dbo.fn_CGA_Cobrados(m.FechaInicioMes, m.FechaFinMes, @IdEmpresa) c
GROUP BY m.NumeroMes
ORDER BY m.NumeroMes
OPTION (MAXRECURSION 12)
```

**Datos devueltos**: `{ Mes, TotalCobrado, CantidadFacturas }` por cada mes

---

### 2. Antigüedad de Cartera (US-002)

**Endpoint**: `GET /api/antiguedad-cartera?fechaCorte=2026-02-15&idEmpresa=1`

**Función SQL**: `dbo.fn_CuentasPorCobrar_Excel(@FechaCorte DATE, @IdEmpresa INT)`

**Proceso**:
1. Consulta todas las cuentas por cobrar a la fecha de corte
2. Filtra solo clientes **externos** (`TipoCliente = 'Externo'`)
3. Clasifica en rangos de antigüedad: 1-30, 31-60, 61-90, 91-120, 121+ días
4. Agrupa por cliente (RFC) y sucursal

**Query equivalente (antes era `sp_Antiguedad_cartera`)**:
```sql
SELECT
  Nombre AS Cliente, RFC, Saldo AS Total,
  DiasTranscurridos AS Dias, NombreSucursal AS Sucursal
FROM dbo.fn_CuentasPorCobrar_Excel(@FechaCorte, @IdEmpresa)
WHERE TipoCliente = 'Externo'
```

**Datos devueltos**: `{ Cliente, RFC, Total, Dias, Sucursal }` por cada documento

**Procesamiento JS**: Agrupa por RFC, calcula buckets de antigüedad y genera tabla + gráfica

---

### 3. Tendencia Cartera CXC — Vencido vs En Tiempo (US-003)

**Endpoint**: `GET /api/tendencia-cxc?year=2026&idEmpresa=1`

**Función SQL**: `dbo.fn_CuentasPorCobrar_Excel(@FechaCorte DATE, @IdEmpresa INT)`

**Proceso**:
1. Genera CTE con fin de cada mes del año
2. `CROSS APPLY` a `fn_CuentasPorCobrar_Excel` por cada mes
3. Clasifica por `DiasTranscurridos`: `< 1` = Vigente, `>= 1` = Vencido
4. Agrupa por cliente, RFC, sucursal y mes

**Query equivalente (antes era `sp_Tendencia_cartera_CxC`)**:
```sql
WITH CTE_Meses AS (
  SELECT 1 AS NumeroMes, EOMONTH(DATEFROMPARTS(@Year, 1, 1)) AS FechaFinMes
  UNION ALL
  SELECT NumeroMes + 1, EOMONTH(DATEFROMPARTS(@Year, NumeroMes + 1, 1))
  FROM CTE_Meses WHERE NumeroMes < 12
)
SELECT
  f.Nombre, f.RFC,
  SUM(CASE WHEN f.DiasTranscurridos < 1 THEN f.Saldo ELSE 0 END) AS Vigente,
  SUM(CASE WHEN f.DiasTranscurridos >= 1 THEN f.Saldo ELSE 0 END) AS Vencido,
  SUM(f.Saldo) AS Saldo,
  f.NombreSucursal AS Sucursal,
  m.NumeroMes AS Mes
FROM CTE_Meses m
CROSS APPLY dbo.fn_CuentasPorCobrar_Excel(m.FechaFinMes, @IdEmpresa) f
WHERE f.TipoCliente = 'Externo'
GROUP BY f.Nombre, f.RFC, f.NombreSucursal, m.NumeroMes
ORDER BY m.NumeroMes, f.Nombre
OPTION (MAXRECURSION 12)
```

**Datos devueltos**: `{ Nombre, RFC, Vigente, Vencido, Saldo, Sucursal, Mes }`

---

### 4. Tendencia Financiamiento CxC DAC (US-004)

**Endpoint**: `GET /api/financiamiento?year=2026&idEmpresa=1&officeId=DAC001`

**Función SQL**: `dbo.fn_Tendencia_Financiamiento(@FechaInicio DATE, @FechaCorte DATE, @IdEmpresa INT)`

**Proceso**:
1. Genera CTE con inicio y fin de cada mes
2. `CROSS APPLY` a `fn_Tendencia_Financiamiento` por cada mes
3. Obtiene **PagosFinanciadosPendiente** (por facturar) y **PagosFinanciadosFacturado** (facturado)
4. Agrupa por Unidad, Oficina y Mes
5. Filtro opcional por oficina DAC

**Query equivalente (antes era `sp_Tendencia_Financiamiento`)**:
```sql
WITH CTE_Meses AS (
  SELECT 1 AS NumeroMes,
    DATEFROMPARTS(@Year, 1, 1) AS FechaInicioMes,
    EOMONTH(DATEFROMPARTS(@Year, 1, 1)) AS FechaFinMes
  UNION ALL
  SELECT NumeroMes + 1,
    DATEFROMPARTS(@Year, NumeroMes + 1, 1),
    EOMONTH(DATEFROMPARTS(@Year, NumeroMes + 1, 1))
  FROM CTE_Meses WHERE NumeroMes < 12
)
SELECT
  f.Unidad, f.Oficina,
  SUM(f.PagosFinanciadosPendiente) AS FinanciadoPTE,
  SUM(f.PagosFinanciadosFacturado) AS FinanciadoFAC,
  m.NumeroMes AS MES
FROM CTE_Meses m
CROSS APPLY dbo.fn_Tendencia_Financiamiento(m.FechaInicioMes, m.FechaFinMes, @IdEmpresa) f
GROUP BY f.Unidad, f.Oficina, m.NumeroMes
ORDER BY m.NumeroMes
OPTION (MAXRECURSION 12)
```

**Datos devueltos**: `{ Unidad, Oficina, FinanciadoPTE, FinanciadoFAC, MES }`

---

### 5. Estatus de Garantías (US-005)

**Endpoint**: `GET /api/garantias/estatus?year=2026&idEmpresa=1`

**Función SQL**: `dbo.fn_Garantias_Estatus(@FechaIni DATE, @FechaFin DATE, @IdEmpresa INT)`

**Proceso**:
1. Genera CTE con inicio y fin de cada mes
2. `CROSS APPLY` a `fn_Garantias_Estatus` por cada mes
3. El campo `EstatusGarantia` mapea: `1=Programadas`, `2=Naviera`, `3=Operacion`
4. Agrega `nImporte` como **ImporteMN** por estatus y mes

**Query equivalente (antes era `sp_Estatus_Garantia`)**:
```sql
WITH CTE_Meses AS (
  SELECT 1 AS NumeroMes,
    DATEFROMPARTS(@Year, 1, 1) AS FechaInicioMes,
    EOMONTH(DATEFROMPARTS(@Year, 1, 1)) AS FechaFinMes
  UNION ALL
  SELECT NumeroMes + 1,
    DATEFROMPARTS(@Year, NumeroMes + 1, 1),
    EOMONTH(DATEFROMPARTS(@Year, NumeroMes + 1, 1))
  FROM CTE_Meses WHERE NumeroMes < 12
)
SELECT
  g.EstatusGarantia AS Estatus,
  SUM(g.nImporte) AS ImporteMN,
  m.NumeroMes AS MES
FROM CTE_Meses m
CROSS APPLY dbo.fn_Garantias_Estatus(m.FechaInicioMes, m.FechaFinMes, @IdEmpresa) g
GROUP BY g.EstatusGarantia, m.NumeroMes
ORDER BY m.NumeroMes, g.EstatusGarantia
OPTION (MAXRECURSION 12)
```

**Datos devueltos**: `{ Estatus, ImporteMN, MES }`

---

### 6. Resumen Corporativo por Oficina (US-006)

**Endpoint**: `GET /api/resumen-oficinas?fechaCorte=2026-02-15&idEmpresa=1`

**Función SQL**: `dbo.fn_CuentasPorCobrar_Excel(@FechaCorte DATE, @IdEmpresa INT)`

**Proceso**:
1. Consulta cuentas por cobrar al corte
2. Filtra clientes externos
3. Agrupa por **Oficina** (campo `Unidad`)
4. Calcula por oficina: rangos de antigüedad (1-30, 31-45, 46-60, 61-90, 91+), total, honorarios, complementarios, pagos netos, vencido

**Query equivalente (antes era `sp_ResumenDG`)**:
```sql
SELECT
  Unidad AS Oficina, Cobrador AS Agente,
  Saldo AS Total, Vencido,
  DiasTranscurridos AS Dias,
  PagosNetos, Honorarios, Complementarios,
  RFC, Nombre
FROM dbo.fn_CuentasPorCobrar_Excel(@FechaCorte, @IdEmpresa)
WHERE TipoCliente = 'Externo'
```

**Datos devueltos**: `{ Oficina, Agente, Total, Vencido, Dias, PagosNetos, Honorarios, Complementarios, RFC, Nombre }`

**Procesamiento JS**: Agrupa por oficina, calcula rangos de antigüedad y totales

---

### 7. Tendencia Cartera de Garantías (US-008)

**Endpoint**: `GET /api/garantias/tendencia?year=2026&idEmpresa=1`

**Función SQL**: `dbo.fn_GarantiasPorCobrar(@FechaCorte DATE, @IdEmpresa INT)`

**Proceso**:
1. Genera CTE con fin de cada mes
2. `CROSS APPLY` a `fn_GarantiasPorCobrar` por cada mes
3. Clasifica por `DiasTranscurridos`: `< 1` = Vigente, `>= 1` = Vencido
4. Agrupa por proveedor (`sProveedor`), sucursal y mes

**Query equivalente (antes era `sp_Tendencia_cartera_Garantias`)**:
```sql
WITH CTE_Meses AS (
  SELECT 1 AS NumeroMes, EOMONTH(DATEFROMPARTS(@Year, 1, 1)) AS FechaFinMes
  UNION ALL
  SELECT NumeroMes + 1, EOMONTH(DATEFROMPARTS(@Year, NumeroMes + 1, 1))
  FROM CTE_Meses WHERE NumeroMes < 12
)
SELECT
  g.sProveedor AS Nombre,
  SUM(CASE WHEN g.DiasTranscurridos < 1 THEN g.Saldo ELSE 0 END) AS Vigente,
  SUM(CASE WHEN g.DiasTranscurridos >= 1 THEN g.Saldo ELSE 0 END) AS Vencido,
  SUM(g.Saldo) AS Saldo,
  g.sNombreSucursal AS Sucursal,
  m.NumeroMes AS Mes
FROM CTE_Meses m
CROSS APPLY dbo.fn_GarantiasPorCobrar(m.FechaFinMes, @IdEmpresa) g
GROUP BY g.sProveedor, g.sNombreSucursal, m.NumeroMes
ORDER BY m.NumeroMes, g.sProveedor
OPTION (MAXRECURSION 12)
```

**Datos devueltos**: `{ Nombre, Vigente, Vencido, Saldo, Sucursal, Mes }`

---

## Mapeo de Stored Procedures a Queries SELECT

| SP Original | Función TVF Base | Parámetros | Patrón |
|---|---|---|---|
| `sp_Tendencia_Cobrado` | `fn_CGA_Cobrados` | `(FechaIni, FechaFin, IdEmpresa)` | CTE + CROSS APPLY |
| `sp_Antiguedad_cartera` | `fn_CuentasPorCobrar_Excel` | `(FechaCorte, IdEmpresa)` | SELECT directo |
| `sp_Tendencia_cartera_CxC` | `fn_CuentasPorCobrar_Excel` | `(FechaCorte, IdEmpresa)` | CTE + CROSS APPLY |
| `sp_Tendencia_Financiamiento` | `fn_Tendencia_Financiamiento` | `(FechaInicio, FechaCorte, IdEmpresa)` | CTE + CROSS APPLY |
| `sp_Estatus_Garantia` | `fn_Garantias_Estatus` | `(FechaIni, FechaFin, IdEmpresa)` | CTE + CROSS APPLY |
| `sp_ResumenDG` | `fn_CuentasPorCobrar_Excel` | `(FechaCorte, IdEmpresa)` | SELECT directo |
| `sp_Tendencia_cartera_Garantias` | `fn_GarantiasPorCobrar` | `(FechaCorte, IdEmpresa)` | CTE + CROSS APPLY |

---

## Flujo de Datos en la Aplicación

```
1. Usuario selecciona Año / Fecha de corte en el Dashboard
         │
         ▼
2. React Hook (useCollectionTrend, useAgingData, etc.)
   llama al endpoint Next.js API Route
         │
         ▼
3. API Route construye query SELECT con parámetros
   y la envía codificada en Base64 a API RECO
         │
         ▼
4. API RECO valida la query (sin palabras prohibidas),
   la ejecuta en SQL Server y devuelve JSON
         │
         ▼
5. API Route procesa el JSON:
   - Agrupa por mes / oficina / cliente
   - Calcula totales, porcentajes, rangos
   - Devuelve estructura tipada al frontend
         │
         ▼
6. React Hook recibe datos y actualiza componentes:
   - Gráficas (barras apiladas, áreas)
   - Tablas detalladas
   - Cards de resumen
```

---

## Menú Lateral (Sidebar)

| Opción | Estado | Motivo |
|---|---|---|
| Dashboard Principal | **Visible** | Vista principal con todos los KPIs |
| Cartera | **Oculto** | Vista individual pendiente de implementar |
| Garantías | **Oculto** | Vista individual pendiente de implementar |
| Financiamiento | **Oculto** | Vista individual pendiente de implementar |
| Reportes | **Oculto** | Pendiente de definición |

Las opciones ocultas se habilitarán cuando las vistas individuales estén completas y probadas.
