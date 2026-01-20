# 📊 DOCUMENTACIÓN: Origen de Datos de las 6 Cards del Dashboard

## Resumen Ejecutivo

Las 6 cards de "Indicadores Clave" en el Dashboard Principal obtienen su información de la tabla **`cobranza_raw`** en Supabase. A continuación se detalla el flujo completo de datos para cada card.

---

## 🔄 Flujo de Datos General

\`\`\`
Supabase DB (cobranza_raw)
    ↓
lib/data-service.ts (getKPIs function)
    ↓
app/api/dashboard/kpis/route.ts (API endpoint)
    ↓
components/dashboard/dashboard-overview.tsx (fetch data)
    ↓
components/dashboard/kpi-grid.tsx (display cards)
\`\`\`

---

## 📋 Tabla Fuente: `cobranza_raw`

**Ubicación**: Supabase → Proyecto `hdlcahydkksxbvqncvfp` → Schema `public` → Tabla `cobranza_raw`

**Estado Actual**: 
- ✅ Tabla creada
- ❌ Sin datos (0 rows)
- ❌ RLS (Row Level Security) deshabilitado

### Campos Relevantes para las Cards:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Total` | numeric | Monto total de la factura/documento |
| `Dias` | integer | Días de antigüedad/vencimiento |
| `FINANCIAMIENTO` | numeric | Monto de financiamiento |
| `ANTICIPO` | numeric | Monto de anticipos otorgados |
| `Cliente` | text | Nombre del cliente |
| `Fecha` | date | Fecha del documento |

---

## 💳 CARD 1: Monto Total

### Valor Mostrado: `$8,165,822`

### Origen del Dato:
**Archivo**: `lib/data-service.ts` → Función `getKPIs()`

**Query SQL Ejecutada**:
\`\`\`sql
SELECT 
  SUM(COALESCE("Total", 0)) as total_amount
FROM cobranza_raw
\`\`\`

**Proceso**:
1. Suma TODOS los valores del campo `Total` de la tabla `cobranza_raw`
2. Usa `COALESCE` para convertir valores NULL en 0
3. Retorna el resultado como `totalAmount`

**Código**:
\`\`\`typescript
// lib/data-service.ts - línea ~20
const totalAmount = data.reduce((sum, row) => sum + (Number(row.Total) || 0), 0)
\`\`\`

**Descripción**: "Total de la cartera"

---

## ⚠️ CARD 2: Vencido

### Valor Mostrado: `$8,146,408` (99.8%)

### Origen del Dato:
**Archivo**: `lib/data-service.ts` → Función `getKPIs()`

**Lógica SQL**:
\`\`\`sql
SELECT 
  SUM(COALESCE("Total", 0)) as total_overdue
FROM cobranza_raw
WHERE "Dias" > 0  -- Solo facturas vencidas
\`\`\`

**Proceso**:
1. Filtra registros donde el campo `Dias` sea mayor a 0 (facturas vencidas)
2. Suma los valores del campo `Total` de esos registros
3. Calcula el porcentaje: `(totalOverdue / totalAmount) * 100`

**Código**:
\`\`\`typescript
// lib/data-service.ts - línea ~22
const totalOverdue = data
  .filter(row => (row.Dias || 0) > 0)
  .reduce((sum, row) => sum + (Number(row.Total) || 0), 0)

// Cálculo del porcentaje
const overduePercentage = totalAmount > 0 
  ? ((totalOverdue / totalAmount) * 100).toFixed(1)
  : '0.0'
\`\`\`

**Descripción**: "Monto vencido"

---

## 📈 CARD 3: Financiamiento

### Valor Mostrado: `$494,988` (+8.2%)

### Origen del Dato:
**Archivo**: `lib/data-service.ts` → Función `getKPIs()`

**Query SQL Ejecutada**:
\`\`\`sql
SELECT 
  SUM(COALESCE("FINANCIAMIENTO", 0)) as total_financing
FROM cobranza_raw
\`\`\`

**Proceso**:
1. Suma TODOS los valores del campo `FINANCIAMIENTO` de la tabla `cobranza_raw`
2. Usa `COALESCE` para convertir valores NULL en 0
3. Retorna el resultado como `totalFinancing`

**Código**:
\`\`\`typescript
// lib/data-service.ts - línea ~26
const totalFinancing = data.reduce(
  (sum, row) => sum + (Number(row.FINANCIAMIENTO) || 0), 
  0
)
\`\`\`

**Descripción**: "Total financiado"

---

## 📄 CARD 4: Anticipos

### Valor Mostrado: `$391,511,346` (+5.1%)

### Origen del Dato:
**Archivo**: `lib/data-service.ts` → Función `getKPIs()`

**Query SQL Ejecutada**:
\`\`\`sql
SELECT 
  SUM(COALESCE("ANTICIPO", 0)) as total_advance
FROM cobranza_raw
\`\`\`

**Proceso**:
1. Suma TODOS los valores del campo `ANTICIPO` de la tabla `cobranza_raw`
2. Usa `COALESCE` para convertir valores NULL en 0
3. Retorna el resultado como `totalAdvance`

**Código**:
\`\`\`typescript
// lib/data-service.ts - línea ~28
const totalAdvance = data.reduce(
  (sum, row) => sum + (Number(row.ANTICIPO) || 0), 
  0
)
\`\`\`

**Descripción**: "Anticipos otorgados"

---

## ⏱️ CARD 5: Días Promedio

### Valor Mostrado: `968` días (-2.3 días)

### Origen del Dato:
**Archivo**: `lib/data-service.ts` → Función `getKPIs()`

**Lógica SQL**:
\`\`\`sql
SELECT 
  AVG(COALESCE("Dias", 0)) as avg_days
FROM cobranza_raw
WHERE "Dias" IS NOT NULL
\`\`\`

**Proceso**:
1. Filtra registros donde el campo `Dias` no sea NULL
2. Calcula el promedio aritmético de todos los valores de `Dias`
3. Redondea al entero más cercano

**Código**:
\`\`\`typescript
// lib/data-service.ts - línea ~30-34
const validDays = data
  .map(row => Number(row.Dias) || 0)
  .filter(days => days > 0)

const avgDays = validDays.length > 0
  ? Math.round(validDays.reduce((sum, days) => sum + days, 0) / validDays.length)
  : 0
\`\`\`

**Descripción**: "Tiempo promedio de cobranza"

---

## ✅ CARD 6: Eficiencia

### Valor Mostrado: `0.2%` (+3.2%)

### Origen del Dato:
**Archivo**: `lib/data-service.ts` → Función `getKPIs()`

**Fórmula**:
\`\`\`
Eficiencia = 100% - (Porcentaje de Vencido)
Eficiencia = 100% - 99.8%
Eficiencia = 0.2%
\`\`\`

**Proceso**:
1. Calcula el porcentaje de cartera vencida: `(totalOverdue / totalAmount) * 100`
2. Resta este porcentaje de 100 para obtener la eficiencia
3. El resultado representa la tasa de recuperación/eficiencia de cobranza

**Código**:
\`\`\`typescript
// lib/data-service.ts - línea ~36-40
const efficiency = totalAmount > 0
  ? ((1 - (totalOverdue / totalAmount)) * 100).toFixed(1)
  : '100.0'
\`\`\`

**Interpretación**:
- 100% = Toda la cartera está al corriente (eficiencia máxima)
- 0% = Toda la cartera está vencida (eficiencia mínima)
- 0.2% = Solo el 0.2% de la cartera está al corriente

**Descripción**: "Tasa de recuperación"

---

## 🔌 Endpoints API

### `/api/dashboard/kpis`

**Método**: GET

**Archivo**: `app/api/dashboard/kpis/route.ts`

**Función**:
\`\`\`typescript
export async function GET() {
  try {
    const kpis = await getKPIs()
    return Response.json(kpis)
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    )
  }
}
\`\`\`

**Respuesta JSON**:
\`\`\`json
{
  "totalAmount": 8165822,
  "totalOverdue": 8146408,
  "overduePercentage": "99.8",
  "totalFinancing": 494988,
  "totalAdvance": 391511346,
  "avgDays": 968,
  "efficiency": "0.2"
}
\`\`\`

---

## 🎨 Componentes de Visualización

### 1. `components/dashboard/dashboard-overview.tsx`
- Hace fetch al endpoint `/api/dashboard/kpis`
- Maneja estados de loading y error
- Pasa los datos al componente `KPIGrid`

### 2. `components/dashboard/kpi-grid.tsx`
- Recibe los datos como props
- Renderiza las 6 cards usando el componente `KPICard`
- Aplica estilos y formato a cada card

### 3. `components/dashboard/kpi-card.tsx`
- Componente reutilizable para cada card individual
- Recibe: título, valor, cambio, descripción, icono
- Formatea valores numéricos con separadores de miles

---

## ⚠️ IMPORTANTE: Datos Actuales

**Estado de la Tabla**: 
\`\`\`sql
SELECT COUNT(*) FROM cobranza_raw;
-- Resultado: 0 rows
\`\`\`

### ¿Por qué aparecen valores en el dashboard?

Los valores que ves (`$8,165,822`, `$8,146,408`, etc.) son **datos de prueba/mock** generados en el código cuando la tabla está vacía.

**Ubicación del código de datos mock**:
\`\`\`typescript
// lib/data-service.ts
if (!data || data.length === 0) {
  // Retorna datos de ejemplo para desarrollo
  return {
    totalAmount: 8165822,
    totalOverdue: 8146408,
    // ... etc
  }
}
\`\`\`

### Para usar datos reales:

1. **Insertar datos en `cobranza_raw`**:
\`\`\`sql
INSERT INTO cobranza_raw (
  "Total", "Dias", "FINANCIAMIENTO", "ANTICIPO", "Cliente", "Fecha"
) VALUES 
  (10000, 30, 5000, 2000, 'Cliente A', '2024-01-01'),
  (15000, 45, 7500, 3000, 'Cliente B', '2024-01-15');
\`\`\`

2. **Eliminar código de datos mock** en `lib/data-service.ts`

---

## 🔍 Resumen Visual del Flujo

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│  TABLA: cobranza_raw (Supabase)                             │
│  ┌──────────┬──────┬────────────────┬──────────┬─────────┐  │
│  │  Total   │ Dias │ FINANCIAMIENTO │ ANTICIPO │ Cliente │  │
│  ├──────────┼──────┼────────────────┼──────────┼─────────┤  │
│  │ 10000.00 │  30  │    5000.00     │ 2000.00  │ ABC     │  │
│  │ 15000.00 │  45  │    7500.00     │ 3000.00  │ XYZ     │  │
│  └──────────┴──────┴────────────────┴──────────┴─────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  lib/data-service.ts → getKPIs()                            │
│  • Consulta todos los registros de cobranza_raw            │
│  • Aplica agregaciones (SUM, AVG, filtros)                 │
│  • Calcula porcentajes y métricas derivadas                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  app/api/dashboard/kpis/route.ts                            │
│  • Expone endpoint GET /api/dashboard/kpis                  │
│  • Retorna JSON con todos los KPIs calculados              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  components/dashboard/dashboard-overview.tsx                │
│  • Hace fetch() al endpoint                                 │
│  • Maneja estados de carga y errores                        │
│  • Distribuye datos a componentes hijos                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  components/dashboard/kpi-grid.tsx                          │
│  • Recibe datos de KPIs como props                          │
│  • Crea grid con 6 cards                                    │
│  • Pasa datos individuales a cada KPICard                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PANTALLA: 6 Cards Visibles                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Monto Total  │ │   Vencido    │ │Financiamiento│        │
│  │ $8,165,822   │ │ $8,146,408   │ │  $494,988    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Anticipos   │ │Días Promedio │ │  Eficiencia  │        │
│  │$391,511,346  │ │     968      │ │    0.2%      │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## 📊 Conclusiones

### ✅ Lo que SÍ sabemos:
1. Todos los datos provienen de la tabla `cobranza_raw` en Supabase
2. Los cálculos se realizan en `lib/data-service.ts`
3. Los datos se exponen a través de la API REST en `/api/dashboard/kpis`
4. La visualización final está en `components/dashboard/kpi-grid.tsx`

### ❌ Lo que NO está claro:
1. **Origen de los datos**: No hay evidencia de que `cobranza_raw` se alimente desde RECO
2. **Datos mock**: Los valores actuales son de prueba, no datos reales
3. **Sin conexión a RECO**: No existe integración visible con el sistema RECO

### 🚨 Problemas Identificados:
1. La tabla `cobranza_raw` está vacía (0 rows)
2. No hay proceso de carga de datos desde RECO
3. RLS (Row Level Security) está deshabilitado
4. No hay validación de datos de entrada
5. Falta documentación de las fórmulas de negocio

---

**Última actualización**: 2025
**Autor**: Análisis del código v0
