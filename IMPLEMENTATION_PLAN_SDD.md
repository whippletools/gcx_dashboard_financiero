# Spec-Driven Development: Dashboard Financiero GCX

## Resumen Ejecutivo

Este documento establece el plan de implementación para el Dashboard Financiero GCX siguiendo los principios de **Spec-Driven Development (SDD)**. Basado en el [Spec Kit de Microsoft](https://developer.microsoft.com/blog/spec-driven-development-spec-kit), este enfoque prioriza la definición clara de especificaciones antes de la implementación, asegurando alineación entre requerimientos de negocio, diseño de UI/UX y desarrollo técnico.

---

## 1. Fundamentos de Spec-Driven Development (SDD)

### 1.1 Principios Core

| Principio | Descripción | Aplicación en GCX |
|-----------|-------------|-------------------|
| **Specs First** | Definir especificaciones antes de código | Cada KPI tiene spec técnica y de diseño antes de implementación |
| **Cross-Functional** | Colaboración entre negocio, diseño y desarrollo | Revisión conjunta de cada fase antes de avanzar |
| **Validation Gates** | Puntos de validación definidos | Checklist de aceptación por fase |
| **Traceability** | Trazabilidad requerimientos → código → tests | Matriz de trazabilidad incluida |

### 1.2 Artefactos SDD por Fase

```
┌─────────────────────────────────────────────────────────────┐
│                    SDD WORKFLOW                              │
├─────────────────────────────────────────────────────────────┤
│  FASE 1: Discovery                                          │
│  ├── User Stories                                             │
│  ├── Current State Analysis                                   │
│  └── Gap Identification                                       │
│                          ↓                                    │
│  FASE 2: Technical Specs                                        │
│  ├── API Contracts (OpenAPI)                                  │
│  ├── Data Models                                                │
│  └── Query Specifications                                       │
│                          ↓                                    │
│  FASE 3: Design Specs                                           │
│  ├── Material Design Guidelines                                 │
│  ├── Component Library                                          │
│  └── Interaction Patterns                                       │
│                          ↓                                    │
│  FASE 4: Implementation                                         │
│  ├── Frontend (React + TypeScript)                              │
│  ├── Backend API                                                  │
│  └── Integration                                                  │
│                          ↓                                    │
│  FASE 5: Testing & QA                                           │
│  ├── Unit Tests                                                   │
│  ├── Integration Tests                                            │
│  └── UAT (User Acceptance)                                        │
│                          ↓                                    │
│  FASE 6: Deployment & Monitoring                                │
│  ├── Production Deploy                                            │
│  ├── Performance Monitoring                                       │
│  └── Feedback Loop                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Estado Actual vs. Requerimientos

### 2.1 Matriz de Cobertura Actual

| # | Indicador/Vista | Datos en BD | Implementado | Estado | Prioridad |
|---|-----------------|-------------|--------------|--------|-----------|
| 1 | **Tendencia Cobrado** (comparativo año pasado) | ✅ Parcial (no hay campo cobrado) | ⚠️ Gráfica mensual basada en Total/Vencido | **Parcial** | Alta |
| 2 | **Antigüedad Cartera General** + tabla | ✅ Sí (dias/dias_vencidos, montos) | ⚠️ Gráfica Aging, sin tabla rangos exactos | **Parcial** | Alta |
| 3 | **Tendencia Cartera CXC** (Vencido vs En tiempo) | ✅ Sí (Total, Vencido) | ⚠️ OverdueChart + CollectionTrendChart sin serie En tiempo clara | **Parcial** | Alta |
| 4 | **Tendencia Financiamiento CxC DAC** | ✅ Sí (FINANCIAMIENTO/ANTICIPO, oficinas) | ⚠️ Gráfica financiamiento sin filtro DAC ni separación tipos | **Parcial** | Media |
| 5 | **Estatus Garantías** (Programadas/Desviaciones/Operación) | ❌ No (falta campo en RECO) | ⚠️ Solo esqueleto /garantias | **No cubierto** | Alta |
| 6 | **Antigüedad/Tendencia Cartera Garantías** | ⚠️ Parcial (no hay campo robusto garantía) | ❌ No implementado | **No cubierto** | Media |
| 7 | **Resumen Corporativo por Oficina** | ✅ Sí (campos oficina en BD) | ❌ No hay vista por oficina | **No cubierto** | Alta |
| 8 | **Módulo Facturación DAC** (honorarios vs resto) | ✅ Sí (TOTAL HON, TOTAL COMPL) | ❌ No hay módulo facturación | **No cubierto** | Media |

### 2.2 Estructura de Datos Identificada

**Campos disponibles en BD Depurada:**
- `dias`, `dias_vencidos` - Para cálculo de antigüedad
- `FINANCIAMIENTO`, `ANTICIPO` - Para tendencia financiamiento
- `UD`, `AA` - Campos de oficina/sucursal
- `TOTAL HON`, `TOTAL COMPL` - Para módulo facturación
- `Cobrado` - **NO existe actualmente** (requiere desarrollo backend)

---

## 3. Fases de Implementación

### 🔵 FASE 1: Discovery & Requirements (Semana 1)

#### 1.1 Objetivos
- Validar requerimientos con stakeholders
- Documentar user stories
- Definir KPIs críticos vs nice-to-have

#### 1.2 User Stories

```yaml
# Template de User Story SDD
story_template:
  id: "US-XXX"
  title: ""
  as_a: ""
  i_want: ""
  so_that: ""
  
  acceptance_criteria:
    - "Dado [contexto], Cuando [acción], Entonces [resultado]"
    
  technical_notes:
    data_source: ""
    query_reference: ""
    ui_component: ""
    
  design_notes:
    material_component: ""
    color_scheme: ""
    responsive_behavior: ""
```

#### 1.3 User Stories Definidas

**US-001: Tendencia de Cobrado con Comparativo Anual**
```yaml
id: US-001
title: Visualizar tendencia mensual de cobrado con comparativo año anterior
as_a: Gerente de Cobranza
i_want: Ver una gráfica lineal mensual de montos cobrados
so_that: Compare el desempeño de cobranza contra el año anterior

acceptance_criteria:
  - Dado que selecciono un año, cuando cargo el dashboard, entonces veo dos líneas: año actual y año anterior
  - Dado que hay datos de cobrado, cuando visualizo la gráfica, entonces cada punto representa el total cobrado en ese mes
  - Dado que selecciono un mes, cuando hago hover, entonces veo el monto exacto cobrado
  - Dado que no hay datos para un mes, cuando visualizo la gráfica, entonces ese punto muestra 0 o "Sin datos"

technical_notes:
  data_source: "sp_Tendencia_Cobrado"
  query_parameters: ["@Year INT", "@IdEmpresa INT"]
  required_backend_field: "Cobrado" # Necesita ser agregado a BD
  ui_component: "CollectionTrendChart v2"
  
design_notes:
  material_component: "Line Chart (M3)"
  color_scheme: 
    current_year: "Primary-500"
    previous_year: "Secondary-400"
  responsive_behavior: "Stack on mobile, side-by-side on desktop"
```

**US-002: Antigüedad de Cartera con Rangos Exactos**
```yaml
id: US-002
title: Visualizar antigüedad de cartera con rangos específicos y tabla detallada
as_a: Analista de Crédito
i_want: Ver una gráfica circular de antigüedad con rangos 1-30, 31-60, 61-90, 91-120, 121+ días
so_that: Identifique rápidamente la concentración de riesgo por periodo de vencimiento

acceptance_criteria:
  - Dado que cargo el dashboard, cuando visualizo antigüedad, entonces veo 5 segmentos con colores distintivos
  - Dado que hago clic en un segmento, cuando selecciono, entonces la tabla debajo filtra por ese rango
  - Dado que hay datos de múltiples sucursales, cuando aplico filtro, entonces la gráfica se actualiza
  - Dado que veo la tabla, cuando reviso los montos, entonces coinciden con los totales de la gráfica

technical_notes:
  data_source: "sp_Antiguedad_cartera"
  query_parameters: ["@FechaCorte DATE", "@IdEmpresa INT"]
  ranges: ["1-30", "31-60", "61-90", "91-120", "121-5000"]
  ui_component: "AgingChart v2 + DataTable"
  
design_notes:
  material_component: "Pie Chart + Data Table (M3)"
  color_scheme:
    "1-30": "Green-500"      # Bajo riesgo
    "31-60": "Yellow-500"    # Atención
    "61-90": "Orange-500"    # Alerta
    "91-120": "Red-400"      # Riesgo
    "121+": "Red-700"        # Crítico
  responsive_behavior: "Pie chart full width, table horizontal scroll on mobile"
```

**US-003: Tendencia Cartera CXC (Vencido vs En Tiempo)**
```yaml
id: US-003
title: Visualizar tendencia temporal de cartera vencida vs al día
as_a: Director Financiero
i_want: Ver una gráfica de área/barras apiladas mensual con dos series
so_that: Analice la evolución de cartera sana vs vencida durante el año

acceptance_criteria:
  - Dado que selecciono un año, cuando cargo la vista, entonces veo barras/apiladas por mes
  - Dado que visualizo una barra, cuando reviso los colores, entonces azul=vencido y naranja=en tiempo
  - Dado que hago hover, cuando paso sobre un segmento, entonces veo monto y % del total
  - Dado que cambio de mes, cuando comparo, entonces puedo identificar tendencias de deterioro o mejora

technical_notes:
  data_source: "sp_Tendencia_cartera_CxC"
  derived_metric: "En tiempo = Total - Vencido"
  ui_component: "OverdueTrendChart"
  
design_notes:
  material_component: "Stacked Bar Chart (M3)"
  color_scheme:
    vencido: "Blue-500"      # #2196F3
    en_tiempo: "Orange-500"  # #FF9800
  responsive_behavior: "Vertical bars on desktop, horizontal scroll on mobile"
```

**US-004: Tendencia Financiamiento CxC DAC**
```yaml
id: US-004
title: Visualizar tendencia de financiamiento por facturar vs facturado por DAC
as_a: Gerente de Operaciones
i_want: Ver financiamiento desglosado por tipo y filtrado por oficina DAC
so_that: Controle el riesgo de financiamiento por unidad operativa

acceptance_criteria:
  - Dado que selecciono una oficina DAC, cuando aplico filtro, entonces la gráfica muestra solo esa oficina
  - Dado que visualizo la tendencia, cuando reviso las series, entonces veo "por facturar" y "facturado"
  - Dado que comparo meses, cuando analizo, entonces puedo identificar patrones de facturación
  - Dado que no hay datos para una oficina, cuando selecciono, entonces muestro estado vacío

technical_notes:
  data_source: "sp_Tendencia_Financiamiento"
  filters: ["Oficina DAC", "Unidad"]
  ui_component: "FinancingChart v2"
  
design_notes:
  material_component: "Grouped Bar Chart (M3)"
  color_scheme:
    por_facturar: "Purple-500"
    facturado: "Teal-500"
  responsive_behavior: "Dropdown filters above chart, horizontal scroll if many months"
```

**US-005: Estatus de Garantías**
```yaml
id: US-005
title: Visualizar estatus de garantías (Programadas, Desviaciones, Operación)
as_a: Gerente de Garantías
i_want: Ver tabla mensual con estatus de garantías y promedio
so_that: Haga seguimiento al cumplimiento de garantías programadas

acceptance_criteria:
  - Dado que cargo el módulo, cuando visualizo, entonces veo tabla con columnas: Programadas, Desviaciones, Operación
  - Dado que hay garantías sin estatus, cuando reviso, entonces veo indicador de "Pendiente clasificar"
  - Dado que selecciono un mes, cuando hago clic, entonces veo detalle de garantías
  - Dado que calculo promedio, cuando reviso la última columna, entonces coincide con la fórmula: (Desviaciones + Operación) / Total

attention_blocker:
  note: "Campo 'estatus_garantia' NO EXISTE en RECO actualmente"
  action_required: "Solicitar a RECO agregar campo o crear mapeo temporal"
  
technical_notes:
  data_source: "sp_Estatus_Garantia" # Necesita campo estatus
  dependency: "Campo estatus_garantia en BD RECO"
  ui_component: "GuaranteeStatusTable"
  
design_notes:
  material_component: "Data Table + Status Chips (M3)"
  color_scheme:
    programadas: "Blue-100 text-Blue-800"
    desviaciones: "Red-100 text-Red-800"
    operacion: "Green-100 text-Green-800"
```

**US-006: Resumen Corporativo por Oficina**
```yaml
id: US-006
title: Visualizar resumen de cartera por oficina con métricas clave
as_a: Director Corporativo
i_want: Ver tabla resumen con métricas por oficina: Facturas, rangos de antigüedad, Saldo DAC, Cobrado, Vencido
so_that: Compare desempeño entre oficinas y tome decisiones de asignación de recursos

acceptance_criteria:
  - Dado que cargo el dashboard, cuando visualizo resumen, entonces veo todas las oficinas en tabla
  - Dado que hay datos por oficina, cuando reviso columnas, entonces veo: 01-30, 31-45, 46-60, 61-90, 91+, Total, Saldo DAC, Clientes, Cobrado, Vencido
  - Dado que ordeno por columna, cuando hago clic en header, entonces la tabla se reordena
  - Dado que selecciono una oficina, cuando hago clic, entonces voy a vista detalle de esa oficina

technical_notes:
  data_source: "sp_ResumenDG" o nueva vista agregada
  fields_available: ["UD", "AA"]
  required_metrics: ["Facturas", "Saldo", "Cobrado", "Vencido"]
  ui_component: "OfficeSummaryTable"
  
design_notes:
  material_component: "Data Table + Sortable Headers + Row Actions (M3)"
  color_scheme:
    header: "Surface-variant"
    vencido_highlight: "Red-50 background"
  responsive_behavior: "Horizontal scroll with sticky first column on mobile"
```

**US-007: Módulo de Facturación DAC**
```yaml
id: US-007
title: Visualizar facturación mensual por aduanas DAC desglosada
as_a: Gerente de Facturación
i_want: Ver facturación total por aduana DAC, dividida en honorarios vs resto, con promedio mensual
so_that: Analice el mix de ingresos y el desempeño por aduana

acceptance_criteria:
  - Dado que selecciono período, cuando cargo el módulo, entonces veo barras apiladas por aduana
  - Dado que hay datos de honorarios, cuando visualizo, entonces la parte inferior es azul (honorarios)
  - Dado que hay otros cargos, cuando visualizo, entonces la parte superior es negra/gris (resto)
  - Dado que hay múltiples meses, cuando comparo, entonces veo línea de promedio en tabla
  - Dado que selecciono una aduana, cuando hago clic, entonces veo detalle histórico

technical_notes:
  data_source: "sp_Facturacion"
  fields_available: ["TOTAL HON", "TOTAL COMPL"]
  ui_component: "BillingChart + BillingTable"
  
design_notes:
  material_component: "Stacked Bar Chart + Data Table (M3)"
  color_scheme:
    honorarios: "Blue-500"    # Parte inferior
    resto: "Gray-800"         # Parte superior
    promedio_line: "Orange-500"
  responsive_behavior: "Dropdown selector for aduana, chart scales responsively"
```

#### 1.4 Entregables Fase 1

| Entregable | Formato | Responsable | Reviewers |
|------------|---------|-------------|-----------|
| User Stories Document | Markdown (.md) | Product Owner | Stakeholders, Dev Team |
| Current State Analysis | Documento + Diagramas | Tech Lead | Architect, DBA |
| Gap Analysis Report | Spreadsheet | Business Analyst | Project Manager |
| Priorization Matrix | Canvas/Miro | Product Owner | Stakeholders |

---

### 🔵 FASE 2: Technical Specifications (Semana 2)

#### 2.1 API Contracts (OpenAPI 3.0)

##### Endpoint: Tendencia Cobrado
```yaml
# openapi.yaml
paths:
  /api/v1/tendencia-cobrado:
    get:
      summary: Obtiene tendencia mensual de cobrado
      parameters:
        - name: year
          in: query
          required: true
          schema:
            type: integer
            example: 2024
        - name: idEmpresa
          in: query
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Datos de tendencia por mes
          content:
            application/json:
              schema:
                type: object
                properties:
                  current_year:
                    type: array
                    items:
                      $ref: '#/components/schemas/MonthlyData'
                  previous_year:
                    type: array
                    items:
                      $ref: '#/components/schemas/MonthlyData'
                  
components:
  schemas:
    MonthlyData:
      type: object
      properties:
        mes:
          type: integer
          example: 1
        nombre_mes:
          type: string
          example: "Enero"
        total_cobrado:
          type: number
          format: decimal
          example: 1500000.50
        count_facturas:
          type: integer
          example: 45
```

##### Endpoint: Antigüedad Cartera
```yaml
paths:
  /api/v1/antiguedad-cartera:
    get:
      summary: Obtiene distribución de antigüedad de cartera
      parameters:
        - name: fechaCorte
          in: query
          required: true
          schema:
            type: string
            format: date
        - name: idEmpresa
          in: query
          required: true
          schema:
            type: integer
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  chart_data:
                    type: array
                    items:
                      $ref: '#/components/schemas/AgingBucket'
                  table_data:
                    type: array
                    items:
                      $ref: '#/components/schemas/AgingDetail'

components:
  schemas:
    AgingBucket:
      type: object
      properties:
        rango:
          type: string
          enum: ["1-30", "31-60", "61-90", "91-120", "121-5000"]
        monto:
          type: number
        porcentaje:
          type: number
        color:
          type: string
          description: "Código hex Material Design"
    AgingDetail:
      type: object
      properties:
        cliente:
          type: string
        rfc:
          type: string
        rango_1_30:
          type: number
        rango_31_60:
          type: number
        # ... otros rangos
        total:
          type: number
        sucursal:
          type: string
```

##### Endpoint: Resumen por Oficina
```yaml
paths:
  /api/v1/resumen-oficinas:
    get:
      summary: Obtiene resumen corporativo por oficina
      parameters:
        - name: fechaCorte
          in: query
          required: true
          schema:
            type: string
            format: date
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/OfficeSummary'

components:
  schemas:
    OfficeSummary:
      type: object
      properties:
        id_oficina:
          type: string
        nombre_oficina:
          type: string
        total_facturas:
          type: integer
        rango_01_30:
          type: number
        rango_31_45:
          type: number
        rango_46_60:
          type: number
        rango_61_90:
          type: number
        rango_91_plus:
          type: number
        total_saldo:
          type: number
        saldo_dac:
          type: number
        saldo_clientes:
          type: number
        total_cobrado:
          type: number
        total_vencido:
          type: number
```

#### 2.2 Data Models (TypeScript)

```typescript
// types/dashboard.ts

// US-001: Tendencia Cobrado
export interface CollectionTrendData {
  currentYear: MonthlyCollectionData[];
  previousYear: MonthlyCollectionData[];
}

export interface MonthlyCollectionData {
  month: number;
  monthName: string;
  totalCollected: number;
  invoiceCount: number;
  year: number;
}

// US-002: Antigüedad Cartera
export interface AgingData {
  chartData: AgingBucket[];
  tableData: AgingDetail[];
  summary: AgingSummary;
}

export interface AgingBucket {
  range: '1-30' | '31-60' | '61-90' | '91-120' | '121-5000';
  amount: number;
  percentage: number;
  color: string; // Material Design color token
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgingDetail {
  clientName: string;
  rfc: string;
  range1to30: number;
  range31to60: number;
  range61to90: number;
  range91to120: number;
  range121plus: number;
  total: number;
  branch: string;
}

// US-003: Tendencia CXC
export interface PortfolioTrendData {
  months: MonthPortfolioData[];
}

export interface MonthPortfolioData {
  month: number;
  monthName: string;
  overdue: number;
  onTime: number; // Calculated: Total - Overdue
  total: number;
  overduePercentage: number;
}

// US-004: Financiamiento
export interface FinancingTrendData {
  months: MonthFinancingData[];
  filters: {
    offices: Office[];
    units: Unit[];
  };
}

export interface MonthFinancingData {
  month: number;
  monthName: string;
  pendingInvoice: number; // Por facturar
  invoiced: number;       // Facturado
  total: number;
}

// US-005: Estatus Garantías
export interface GuaranteeStatusData {
  months: MonthGuaranteeData[];
}

export interface MonthGuaranteeData {
  month: number;
  monthName: string;
  scheduled: number;
  deviations: number;
  operation: number;
  total: number;
  average: number; // (Deviations + Operation) / Total
}

// US-006: Resumen Oficinas
export interface OfficeSummaryData {
  offices: OfficeSummary[];
  totals: OfficeSummary; // Totals row
}

export interface OfficeSummary {
  id: string;
  name: string;
  invoiceCount: number;
  range01to30: number;
  range31to45: number;
  range46to60: number;
  range61to90: number;
  range91plus: number;
  total: number;
  dacBalance: number;
  clientBalance: number;
  collected: number;
  overdue: number;
}

// US-007: Facturación
export interface BillingData {
  aduanas: AduanaBilling[];
  months: string[];
}

export interface AduanaBilling {
  id: string;
  name: string;
  monthlyData: MonthBillingData[];
  average: number;
}

export interface MonthBillingData {
  month: number;
  honorarios: number; // Parte inferior (azul)
  otros: number;      // Parte superior (negro)
  total: number;
}
```

#### 2.3 Query Specifications

| Stored Procedure | Propósito | Parámetros | Retorno | Dependencias |
|------------------|-----------|------------|---------|--------------|
| `sp_Tendencia_Cobrado` | Datos mensuales cobrado | `@Year`, `@IdEmpresa` | Tabla con montos por mes | `fn_CGA_Cobrados` - **Necesita campo Cobrado en BD** |
| `sp_Antiguedad_cartera` | Distribución antigüedad | `@FechaCorte`, `@IdEmpresa` | Rangos 1-30, 31-60, 61-90, 91-120, 121-500 | `fn_CuentasPorCobrar_Excel` |
| `sp_Tendencia_cartera_CxC` | Tendencia vencido vs vigente | `@Year`, `@IdEmpresa` | Meses con Vigente/Vencido | `fn_CuentasPorCobrar_Excel` |
| `sp_Tendencia_Financiamiento` | Financiamiento por tipo | `@Year`, `@IdEmpresa` | FinanciadoPTE, FinanciadoFAC | `fn_Tendencia_Financiamiento` |
| `sp_Estatus_Garantia` | Estatus garantías | Pendiente definir | Programadas, Desviaciones, Operación | **BLOQUEADO: Falta campo estatus_garantia** |
| `sp_Antigüedad_cartera_garantias` | Antigüedad garantías | `@FechaCorte` | Similar a antigüedad general | **BLOQUEADO: Sin campo garantía robusto** |
| `sp_Tendencia_cartera_Garantias` | Tendencia garantías | `@Year` | Vencido vs En tiempo garantías | **BLOQUEADO** |
| `sp_Facturacion` | Facturación por aduana | `@Year`, `@Aduana` | Honorarios vs Otros | `TOTAL HON`, `TOTAL COMPL` |
| `sp_ResumenDG` | Resumen corporativo | `@FechaCorte` | Agregación por oficina | Campos `UD`, `AA` |

#### 2.4 Backend Dependencies & Blockers

```yaml
dependencies:
  critical:
    - id: DEP-001
      description: "Campo 'Cobrado' en tabla cobranza_raw"
      status: "PENDIENTE"
      owner: "DBA RECO"
      estimated_completion: "3-5 días"
      blocking: [US-001]
      
    - id: DEP-002
      description: "Campo 'estatus_garantia' en RECO"
      status: "PENDIENTE - REQUIERE ANÁLISIS"
      owner: "Equipo RECO + Negocio"
      estimated_completion: "2-3 semanas"
      blocking: [US-005, US-006]
      mitigation: "Crear mapeo temporal basado en reglas de negocio"
      
    - id: DEP-003
      description: "Identificación robusta de facturas con garantía"
      status: "PENDIENTE - INVESTIGACIÓN"
      owner: "Analista Negocio + DBA"
      estimated_completion: "1-2 semanas"
      blocking: [US-006]
      
  medium:
    - id: DEP-004
      description: "Optimización queries tendencia mensual"
      status: "EN PROGRESO"
      owner: "DBA"
      estimated_completion: "2-3 días"
      blocking: []
      note: "Los queries con CTE recursivos pueden optimizarse"
```

#### 2.5 Entregables Fase 2

| Entregable | Formato | Responsable |
|------------|---------|-------------|
| OpenAPI Specification | `openapi.yaml` | Backend Dev |
| TypeScript Type Definitions | `types/dashboard.ts` | Frontend Lead |
| Database Schema Updates | SQL Scripts | DBA |
| API Implementation Plan | Markdown | Tech Lead |
| Dependency Tracker | Spreadsheet/Notion | Project Manager |

---

### 🔵 FASE 3: Design Specifications (Semana 3)

#### 3.1 Material Design 3 (M3) Guidelines

##### Design System Foundation

```yaml
design_system:
  name: "GCX Dashboard Design System"
  version: "1.0.0"
  base: "Material Design 3"
  
  color_scheme:
    primary: 
      main: "#6750A4"      # Primary-500
      light: "#EADDFF"    # Primary-100
      dark: "#21005D"     # Primary-900
    secondary:
      main: "#625B71"     # Secondary-500
      light: "#E8DEF8"    # Secondary-100
    tertiary:
      main: "#7D5260"     # Tertiary-500
    error:
      main: "#B3261E"     # Error-500
    
    semantic_colors:
      success: "#4CAF50"   # Green-500
      warning: "#FF9800"   # Orange-500
      danger: "#F44336"    # Red-500
      info: "#2196F3"      # Blue-500
      
    chart_palette:
      - "#6750A4"  # Primary
      - "#E8B649"  # Accent Gold
      - "#4CAF50"  # Success
      - "#FF9800"  # Warning
      - "#F44336"  # Danger
      - "#2196F3"  # Info
      - "#9C27B0"  # Purple
      - "#009688"  # Teal
      
  typography:
    font_family: "Roboto, system-ui, sans-serif"
    
    scales:
      display_large: { size: "57px", weight: 400, line_height: "64px" }
      display_medium: { size: "45px", weight: 400, line_height: "52px" }
      display_small: { size: "36px", weight: 400, line_height: "44px" }
      headline_large: { size: "32px", weight: 400, line_height: "40px" }
      headline_medium: { size: "28px", weight: 400, line_height: "36px" }
      headline_small: { size: "24px", weight: 400, line_height: "32px" }
      title_large: { size: "22px", weight: 400, line_height: "28px" }
      title_medium: { size: "16px", weight: 500, line_height: "24px" }
      title_small: { size: "14px", weight: 500, line_height: "20px" }
      body_large: { size: "16px", weight: 400, line_height: "24px" }
      body_medium: { size: "14px", weight: 400, line_height: "20px" }
      body_small: { size: "12px", weight: 400, line_height: "16px" }
      label_large: { size: "14px", weight: 500, line_height: "20px" }
      label_medium: { size: "12px", weight: 500, line_height: "16px" }
      label_small: { size: "11px", weight: 500, line_height: "16px" }
      
  spacing:
    base_unit: "4px"
    scale:
      xs: "4px"
      sm: "8px"
      md: "16px"
      lg: "24px"
      xl: "32px"
      xxl: "48px"
      
  elevation:
    level_0: "0px 0px 0px 0px rgba(0,0,0,0)"
    level_1: "0px 1px 3px 1px rgba(0,0,0,0.15)"
    level_2: "0px 2px 6px 2px rgba(0,0,0,0.15)"
    level_3: "0px 4px 8px 3px rgba(0,0,0,0.15)"
    level_4: "0px 6px 10px 4px rgba(0,0,0,0.15)"
    level_5: "0px 8px 12px 6px rgba(0,0,0,0.15)"
    
  border_radius:
    none: "0px"
    xs: "4px"
    sm: "8px"
    md: "12px"
    lg: "16px"
    xl: "28px"
    full: "50%"
```

##### Component Library

```yaml
components:
  # Data Display
  kpis_card:
    base: "Material Card (M3)"
    variants:
      - default
      - highlighted
      - trend_up
      - trend_down
    specs:
      padding: "16px"
      elevation: 1
      border_radius: "12px"
      
      content_structure:
        icon: "top-left, 24px, colored"
        label: "Material Label Medium, Secondary color"
        value: "Headline Medium, Primary color"
        trend: "Label Small with trend icon"
        
  data_table:
    base: "Material Data Table (M3)"
    specs:
      header:
        background: "Surface-variant"
        typography: "Title Small"
        height: "56px"
        padding: "16px"
      row:
        height: "52px"
        hover: "Surface-variant at 8% opacity"
        selected: "Primary-container"
      pagination:
        style: "Material Pagination"
        page_size_options: [10, 25, 50, 100]
        
  # Charts (Basado en Recharts + M3)
  line_chart:
    base: "Recharts LineChart + M3 Tokens"
    specs:
      grid: 
        show: true
        stroke: "Outline-variant"
        stroke_dasharray: "4 4"
      axis:
        tick: "Body Small, On-surface-variant"
        line: "Outline"
      tooltip:
        background: "Surface-container-highest"
        border_radius: "8px"
        elevation: 2
      legend:
        position: "top"
        alignment: "end"
        
  bar_chart:
    base: "Recharts BarChart + M3 Tokens"
    variants:
      - grouped
      - stacked
      - horizontal
    specs:
      bar_width: "auto"
      bar_gap: "4px"
      category_gap: "16px"
      
  pie_chart:
    base: "Recharts PieChart + M3 Tokens"
    specs:
      inner_radius: "0" # Pie, not donut
      outer_radius: "80%"
      label:
        position: "outside"
        typography: "Label Medium"
      legend:
        position: "right"
        
  area_chart:
    base: "Recharts AreaChart + M3 Tokens"
    specs:
      fill_opacity: 0.3
      stroke_width: 2
      
  # Input
  date_picker:
    base: "Material Date Picker (M3)"
    specs:
      input: "Outlined Text Field"
      calendar: "Modal Date Picker"
      format: "DD/MM/YYYY"
      
  select_dropdown:
    base: "Material Select (M3)"
    variants:
      - filled
      - outlined
    specs:
      menu_max_height: "300px"
      
  # Feedback
  loading_states:
    skeleton:
      base: "Material Skeleton (M3)"
      animation: "wave"
    progress:
      circular: "Indeterminate Circular Progress"
      linear: "Material Linear Progress"
      
  empty_state:
    base: "Custom Empty State Component"
    specs:
      icon: "Material Icon, 48px, Outline-variant"
      title: "Body Large, On-surface"
      subtitle: "Body Medium, On-surface-variant"
      action: "Text Button (optional)"
```

##### Layout Specifications

```yaml
layout:
  grid_system:
    columns: 12
    gutter: "24px"
    margin: 
      desktop: "24px"
      tablet: "16px"
      mobile: "16px"
      
  breakpoints:
    mobile: "0-599px"
    tablet: "600-904px"
    desktop_small: "905-1239px"
    desktop_large: "1240px+"
    
  page_structure:
    header:
      height: "64px"
      elevation: 2
      background: "Surface"
      
    sidebar:
      width: "280px"
      elevation: 1
      background: "Surface-container-low"
      
    main_content:
      background: "Surface-container"
      padding: "24px"
      
  dashboard_grid:
    kpi_cards:
      layout: "CSS Grid"
      desktop: "repeat(auto-fit, minmax(200px, 1fr))"
      tablet: "repeat(2, 1fr)"
      mobile: "1fr"
      gap: "16px"
      
    charts:
      layout: "CSS Grid"
      desktop: "repeat(2, 1fr)"
      tablet: "1fr"
      mobile: "1fr"
      gap: "24px"
      
    tables:
      container: "Card with overflow-x: auto"
      min_width: "100%"
```

#### 3.2 Component Specifications por User Story

##### US-001: Tendencia Cobrado

```yaml
component_spec:
  name: "CollectionTrendChart"
  type: "LineChart"
  
  layout:
    desktop: "Two lines side-by-side with shared legend"
    mobile: "Vertical stack with toggle"
    
  data_mapping:
    x_axis: "monthName"
    y_axis: "totalCollected"
    series_1: 
      name: "Año Actual"
      data_key: "currentYear[].totalCollected"
      color: "primary-500"
    series_2:
      name: "Año Anterior"
      data_key: "previousYear[].totalCollected"
      color: "secondary-400"
      style: "dashed"
      
  interactions:
    hover: 
      action: "show_tooltip"
      tooltip_content: |
        {monthName} {year}
        Total Cobrado: {totalCollected | currency}
        Facturas: {invoiceCount}
    click:
      action: "drill_down"
      target: "monthly_detail_view"
      
  responsive_behavior:
    desktop:
      chart_height: "400px"
      show_legend: true
      show_grid: true
    tablet:
      chart_height: "350px"
      show_legend: true
      show_grid: true
    mobile:
      chart_height: "300px"
      show_legend: false # Use toggle instead
      show_grid: false
      
  accessibility:
    aria_label: "Tendencia de cobrado mensual"
    keyboard_navigation: true
    screen_reader_support: true
```

##### US-002: Antigüedad Cartera

```yaml
component_spec:
  name: "AgingAnalysis"
  type: "Composite: PieChart + DataTable"
  
  layout:
    desktop: "Pie chart (40%) + Table (60%) side-by-side"
    mobile: "Pie chart (stacked) + Table (below)"
    
  pie_chart:
    type: "Pie"
    data_mapping:
      name: "range"
      value: "amount"
      color: "color"
      
    segments:
      - range: "1-30"
        color: "#4CAF50"  # Green-500
        risk: "low"
      - range: "31-60"
        color: "#FF9800"  # Orange-500
        risk: "medium"
      - range: "61-90"
        color: "#FF5722"  # Deep Orange
        risk: "high"
      - range: "91-120"
        color: "#F44336"  # Red-500
        risk: "critical"
      - range: "121-5000"
        color: "#B71C1C"  # Red-900
        risk: "critical"
        
    interactions:
      click:
        action: "filter_table"
        filter_key: "range"
      hover:
        action: "show_tooltip"
        tooltip_content: |
          {range} días
          Monto: {amount | currency}
          {percentage}% del total
          
  data_table:
    columns:
      - key: "clientName"
        label: "Cliente"
        sortable: true
        width: "25%"
      - key: "rfc"
        label: "RFC"
        sortable: true
        width: "15%"
      - key: "range1to30"
        label: "1-30 días"
        sortable: true
        align: "right"
        format: "currency"
        width: "10%"
      - key: "range31to60"
        label: "31-60 días"
        sortable: true
        align: "right"
        format: "currency"
        width: "10%"
      - key: "range61to90"
        label: "61-90 días"
        sortable: true
        align: "right"
        format: "currency"
        width: "10%"
      - key: "range91to120"
        label: "91-120 días"
        sortable: true
        align: "right"
        format: "currency"
        width: "10%"
      - key: "range121plus"
        label: "121+ días"
        sortable: true
        align: "right"
        format: "currency"
        width: "10%"
        cell_style: "background: red-50" # Highlight critical
      - key: "total"
        label: "Total"
        sortable: true
        align: "right"
        format: "currency"
        width: "10%"
        font_weight: "bold"
        
    summary_row:
      position: "bottom"
      style: "sticky, background: surface-variant, font: title-small"
      
  responsive_behavior:
    mobile:
      table: "horizontal scroll with sticky first column"
      pie_chart: "full width, 300px height"
```

##### US-003: Tendencia Cartera CXC

```yaml
component_spec:
  name: "PortfolioTrendChart"
  type: "StackedBarChart"
  
  layout:
    desktop: "Full width chart with legend top-right"
    mobile: "Full width with horizontal scroll if >6 months"
    
  data_mapping:
    x_axis: "monthName"
    series:
      - name: "Vencido"
        data_key: "overdue"
        color: "#2196F3"  # Blue-500
        stack_id: "portfolio"
      - name: "En tiempo"
        data_key: "onTime"
        color: "#FF9800"  # Orange-500
        stack_id: "portfolio"
        
  interactions:
    hover:
      action: "show_tooltip"
      tooltip_content: |
        {monthName}
        {seriesName}: {value | currency}
        Porcentaje: {percentage}%
        Total: {total | currency}
    click:
      action: "drill_down"
      target: "monthly_portfolio_detail"
      
  y_axis:
    format: "currency"
    tick_count: 6
    
  responsive_behavior:
    desktop:
      chart_height: "400px"
      bar_width: "40px"
    mobile:
      chart_height: "300px"
      bar_width: "32px"
      scrollable: true
```

##### US-006: Resumen Corporativo por Oficina

```yaml
component_spec:
  name: "OfficeSummaryTable"
  type: "DataTable with Sorting & Row Actions"
  
  layout:
    desktop: "Full width table with sticky header"
    mobile: "Horizontal scroll with sticky first column"
    
  columns:
    - key: "id"
      label: "No."
      sortable: false
      width: "5%"
      align: "center"
      
    - key: "name"
      label: "Oficina"
      sortable: true
      width: "15%"
      
    - key: "invoiceCount"
      label: "Facturas"
      sortable: true
      align: "center"
      width: "8%"
      
    - key: "range01to30"
      label: "01-30"
      sortable: true
      align: "right"
      format: "currency_compact"
      width: "8%"
      
    - key: "range31to45"
      label: "31-45"
      sortable: true
      align: "right"
      format: "currency_compact"
      width: "8%"
      
    - key: "range46to60"
      label: "46-60"
      sortable: true
      align: "right"
      format: "currency_compact"
      width: "8%"
      
    - key: "range61to90"
      label: "61-90"
      sortable: true
      align: "right"
      format: "currency_compact"
      width: "8%"
      
    - key: "range91plus"
      label: "91+"
      sortable: true
      align: "right"
      format: "currency_compact"
      width: "8%"
      cell_style: "color: error-500" # Highlight risk
      
    - key: "total"
      label: "Total"
      sortable: true
      align: "right"
      format: "currency_compact"
      width: "10%"
      font_weight: "bold"
      
    - key: "dacBalance"
      label: "Saldo DAC"
      sortable: true
      align: "right"
      format: "currency_compact"
      width: "10%"
      
    - key: "clientBalance"
      label: "Saldo Clientes"
      sortable: true
      align: "right"
      format: "currency_compact"
      width: "10%"
      
    - key: "collected"
      label: "Cobrado"
      sortable: true
      align: "right"
      format: "currency_compact"
      width: "10%"
      
    - key: "overdue"
      label: "Vencido"
      sortable: true
      align: "right"
      format: "currency_compact"
      width: "10%"
      
    - key: "actions"
      label: ""
      sortable: false
      width: "5%"
      cell_content: "IconButton:eye"
      
  row_actions:
    - icon: "visibility"
      label: "Ver detalle"
      action: "navigate_to_office_detail"
      
  summary_row:
    position: "top" # Totals row sticky at top
    style: "background: primary-container, font: title-medium"
    
  sorting:
    default_column: "total"
    default_direction: "desc"
    multi_sort: false
    
  pagination:
    enabled: true
    page_size: 25
    show_total: true
    
  responsive_behavior:
    mobile:
      visible_columns: ["name", "total", "overdue", "actions"]
      expand_row: "show all columns"
      sticky_first_column: true
```

#### 3.3 Entregables Fase 3

| Entregable | Formato | Responsable |
|------------|---------|-------------|
| Design System Document | Figma + Markdown | UX Designer |
| Component Library Specs | Storybook Config | Frontend Dev |
| Color Palette & Tokens | CSS Variables | Design System Lead |
| Responsive Layout Specs | Figma Prototypes | UX Designer |
| Accessibility Guidelines | Markdown | UX Designer |

---

### 🔵 FASE 4: Implementation (Semanas 4-7)

#### 4.1 Estructura de Carpetas

```
app/
├── api/
│   ├── tendencia-cobrado/
│   │   └── route.ts
│   ├── antiguedad-cartera/
│   │   └── route.ts
│   ├── tendencia-cxc/
│   │   └── route.ts
│   ├── financiamiento/
│   │   └── route.ts
│   ├── garantias/
│   │   └── route.ts
│   ├── resumen-oficinas/
│   │   └── route.ts
│   └── facturacion/
│       └── route.ts
├── components/
│   ├── charts/
│   │   ├── CollectionTrendChart.tsx    # US-001
│   │   ├── AgingAnalysis.tsx            # US-002 (Pie + Table)
│   │   ├── PortfolioTrendChart.tsx      # US-003
│   │   ├── FinancingTrendChart.tsx      # US-004
│   │   └── BillingChart.tsx             # US-007
│   ├── tables/
│   │   ├── AgingDetailTable.tsx
│   │   ├── OfficeSummaryTable.tsx       # US-006
│   │   ├── GuaranteeStatusTable.tsx     # US-005
│   │   └── DataTable.tsx               # Base component
│   ├── cards/
│   │   └── KPICard.tsx
│   ├── filters/
│   │   ├── DateRangeFilter.tsx
│   │   ├── OfficeFilter.tsx
│   │   └── AduanaFilter.tsx
│   └── layout/
│       ├── DashboardLayout.tsx
│       ├── Sidebar.tsx
│       └── Header.tsx
├── hooks/
│   ├── useCollectionTrend.ts
│   ├── useAgingData.ts
│   ├── usePortfolioTrend.ts
│   ├── useFinancingTrend.ts
│   ├── useGuaranteeStatus.ts
│   ├── useOfficeSummary.ts
│   └── useBillingData.ts
├── lib/
│   ├── utils/
│   │   ├── formatters.ts      # currency, percentages
│   │   ├── calculations.ts    # derived metrics
│   │   └── colors.ts          # chart colors
│   ├── db.ts                  # Database connection
│   └── validators.ts          # Zod schemas
├── types/
│   └── dashboard.ts           # TypeScript interfaces
├── styles/
│   └── material-theme.css     # CSS variables M3
└── page.tsx                   # Main dashboard
```

#### 4.2 Implementation Plan por Sprint

**Sprint 1 (Semana 4): Foundation + Parciales Mejorados**

| Tarea | Story | Estimado | Responsable |
|-------|-------|----------|-------------|
| Setup Material Design Theme | - | 4h | Frontend |
| Implementar API Routes base | - | 8h | Backend |
| Refactor CollectionTrendChart (US-001) | US-001 | 12h | Frontend |
| Implementar campo Cobrado en queries | DEP-001 | 8h | DBA |
| Mejorar AgingChart + Tabla detalle (US-002) | US-002 | 16h | Frontend |
| Tests unitarios componentes | - | 8h | QA |

**Sprint 2 (Semana 5): Nuevas Vistas**

| Tarea | Story | Estimado | Responsable |
|-------|-------|----------|-------------|
| Implementar PortfolioTrendChart (US-003) | US-003 | 12h | Frontend |
| Implementar FinancingTrendChart v2 (US-004) | US-004 | 12h | Frontend |
| Agregar filtros DAC a API | US-004 | 4h | Backend |
| Implementar OfficeSummaryTable (US-006) | US-006 | 16h | Frontend |
| API Resumen por Oficina | US-006 | 8h | Backend |
| Tests integración | - | 8h | QA |

**Sprint 3 (Semana 6): Módulos Pendientes**

| Tarea | Story | Estimado | Responsable | Notas |
|-------|-------|----------|-------------|-------|
| Implementar GuaranteeStatusTable (US-005) | US-005 | 12h | Frontend | **Bloqueado por DEP-002** |
| Mock data garantías (workaround) | US-005 | 4h | Frontend | Si DEP-002 no está listo |
| Implementar BillingModule (US-007) | US-007 | 16h | Frontend |
| API Facturación por Aduana | US-007 | 8h | Backend |
| Tests E2E | - | 8h | QA |

**Sprint 4 (Semana 7): Polishing & Integration**

| Tarea | Estimado | Responsable |
|-------|----------|-------------|
| Responsive design fixes | 8h | Frontend |
| Performance optimization | 8h | Frontend |
| Accessibility audit & fixes | 8h | Frontend |
| Documentación técnica | 8h | Tech Lead |
| Preparación deploy | 4h | DevOps |
| UAT Support | 8h | Team |

#### 4.3 Code Patterns & Standards

```typescript
// Pattern: Custom Hook para Data Fetching
// hooks/useCollectionTrend.ts

import { useQuery } from '@tanstack/react-query';
import { CollectionTrendData } from '@/app/types/dashboard';

interface UseCollectionTrendParams {
  year: number;
  idEmpresa: number;
  enabled?: boolean;
}

export function useCollectionTrend({ 
  year, 
  idEmpresa, 
  enabled = true 
}: UseCollectionTrendParams) {
  return useQuery<CollectionTrendData>({
    queryKey: ['collectionTrend', year, idEmpresa],
    queryFn: async () => {
      const response = await fetch(
        `/api/tendencia-cobrado?year=${year}&idEmpresa=${idEmpresa}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch collection trend');
      }
      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Pattern: Componente Chart Base con M3 Styling
// components/charts/BaseChart.tsx

import { useMaterialTheme } from '@/app/hooks/useMaterialTheme';

interface BaseChartProps {
  children: React.ReactNode;
  height?: number;
  title?: string;
}

export function BaseChart({ children, height = 400, title }: BaseChartProps) {
  const theme = useMaterialTheme();
  
  return (
    <div 
      className="bg-surface-container rounded-xl p-4 shadow-elevation-1"
      style={{ height }}
    >
      {title && (
        <h3 className="text-title-medium text-on-surface mb-4">
          {title}
        </h3>
      )}
      <div style={{ height: height - 60 }}>
        {children}
      </div>
    </div>
  );
}

// Pattern: Formateo de Moneda
// lib/utils/formatters.ts

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatCurrencyCompact = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};
```

#### 4.4 Entregables Fase 4

| Entregable | Formato | Responsable |
|------------|---------|-------------|
| Código fuente implementado | TypeScript/React | Dev Team |
| API Routes funcionales | Next.js API | Backend Dev |
| Storybook con componentes | Storybook | Frontend Dev |
| Unit Tests | Jest/Vitest | QA |
| Integration Tests | Playwright | QA |

---

### 🔵 FASE 5: Testing & QA (Semana 8)

#### 5.1 Testing Strategy

```yaml
testing_strategy:
  levels:
    unit_tests:
      scope: "Componentes individuales, hooks, utils"
      coverage_target: "80%"
      tools: ["Vitest", "React Testing Library"]
      
    integration_tests:
      scope: "API routes, database queries"
      coverage_target: "70%"
      tools: ["Vitest", "msw"]
      
    e2e_tests:
      scope: "User flows completos"
      coverage_target: "Criticall paths"
      tools: ["Playwright"]
      
    visual_tests:
      scope: "UI regressions"
      tools: ["Chromatic"]
      
  test_data:
    strategy: "Mock data + Staging database"
    fixtures: 
      - "tendencia_cobrado_mock.json"
      - "antiguedad_cartera_mock.json"
      - "resumen_oficinas_mock.json"
```

#### 5.2 Test Cases por User Story

##### US-001: Tendencia Cobrado

```typescript
// tests/components/CollectionTrendChart.test.tsx

describe('CollectionTrendChart', () => {
  it('renders two lines for current and previous year', () => {
    const mockData = {
      currentYear: [{ month: 1, totalCollected: 100000 }],
      previousYear: [{ month: 1, totalCollected: 90000 }]
    };
    
    render(<CollectionTrendChart data={mockData} />);
    
    expect(screen.getByText('Año Actual')).toBeInTheDocument();
    expect(screen.getByText('Año Anterior')).toBeInTheDocument();
  });
  
  it('formats currency values in tooltip', async () => {
    // Test formatting
  });
  
  it('handles empty data gracefully', () => {
    // Test empty state
  });
  
  it('is accessible with keyboard navigation', () => {
    // Test a11y
  });
});

// tests/api/tendencia-cobrado.test.ts

describe('GET /api/tendencia-cobrado', () => {
  it('returns 400 if year parameter is missing', async () => {
    const response = await fetch('/api/tendencia-cobrado');
    expect(response.status).toBe(400);
  });
  
  it('returns data structure with current and previous year', async () => {
    const response = await fetch('/api/tendencia-cobrado?year=2024&idEmpresa=1');
    const data = await response.json();
    
    expect(data).toHaveProperty('currentYear');
    expect(data).toHaveProperty('previousYear');
    expect(Array.isArray(data.currentYear)).toBe(true);
  });
  
  it('returns 12 months of data', async () => {
    const response = await fetch('/api/tendencia-cobrado?year=2024&idEmpresa=1');
    const data = await response.json();
    
    expect(data.currentYear).toHaveLength(12);
    expect(data.previousYear).toHaveLength(12);
  });
});
```

##### US-002: Antigüedad Cartera

```typescript
// tests/components/AgingAnalysis.test.tsx

describe('AgingAnalysis', () => {
  it('renders pie chart with 5 segments', () => {
    const mockData = {
      chartData: [
        { range: '1-30', amount: 50000, percentage: 50 },
        { range: '31-60', amount: 20000, percentage: 20 },
        { range: '61-90', amount: 15000, percentage: 15 },
        { range: '91-120', amount: 10000, percentage: 10 },
        { range: '121-5000', amount: 5000, percentage: 5 },
      ],
      tableData: []
    };
    
    render(<AgingAnalysis data={mockData} />);
    
    // Verify 5 legend items
    expect(screen.getAllByRole('legend-item')).toHaveLength(5);
  });
  
  it('filters table when pie segment is clicked', async () => {
    // Test interaction
  });
  
  it('calculates totals correctly in summary row', () => {
    // Test calculations
  });
});
```

#### 5.3 Performance Testing

| Métrica | Target | Herramienta |
|---------|--------|-------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| API Response Time (p95) | < 500ms | k6/Artillery |
| Chart Render Time | < 100ms | React Profiler |
| Bundle Size (main) | < 200KB | webpack-bundle-analyzer |

#### 5.4 Accessibility Testing

| Criterio | WCAG Level | Validación |
|------------|------------|------------|
| Color contrast | AA | axe-core |
| Keyboard navigation | A | Manual testing |
| Screen reader support | A | NVDA/VoiceOver |
| Focus indicators | AA | CSS + Manual |
| Alt text charts | A | axe-core |
| Form labels | A | axe-core |

#### 5.5 Entregables Fase 5

| Entregable | Formato | Responsable |
|------------|---------|-------------|
| Test Suite Completo | Código + Reportes | QA |
| Coverage Report | HTML/JSON | QA |
| Performance Report | Lighthouse PDF | QA |
| Accessibility Audit | axe-core Report | QA |
| UAT Sign-off | Documento Firmado | Stakeholders |

---

### 🔵 FASE 6: Deployment & Monitoring (Semana 9)

#### 6.1 Deployment Strategy

```yaml
deployment:
  environment:
    name: "production"
    platform: "Vercel / AWS / Azure"
    
  checklist:
    pre_deploy:
      - "Todas las pruebas pasan"
      - "Coverage > 80%"
      - "Lighthouse score > 90"
      - "No vulnerabilities críticas (npm audit)"
      - "Variables de entorno configuradas"
      - "Database migrations aplicadas"
      
    deploy:
      - "Blue-green deployment"
      - "Smoke tests post-deploy"
      - "Rollback plan listo"
      
    post_deploy:
      - "Monitor performance 24h"
      - "Validar métricas de error"
      - "Comunicado a usuarios"
```

#### 6.2 Monitoring Setup

```yaml
monitoring:
  tools:
    error_tracking: "Sentry"
    performance: "Vercel Analytics / Datadog"
    uptime: "Pingdom / UptimeRobot"
    
  dashboards:
    - name: "Dashboard Health"
      metrics:
        - "API error rate"
        - "Average response time"
        - "Chart render time"
        
    - name: "Business Metrics"
      metrics:
        - "Active users"
        - "Most viewed charts"
        - "Filter usage"
        
  alerts:
    - condition: "API error rate > 5%"
      severity: "critical"
      channel: "PagerDuty"
      
    - condition: "Response time p95 > 2s"
      severity: "warning"
      channel: "Slack"
      
    - condition: "Lighthouse score < 80"
      severity: "warning"
      channel: "Slack"
```

#### 6.3 Entregables Fase 6

| Entregable | Formable | Responsable |
|------------|----------|-------------|
| Producción Live | URL | DevOps |
| Monitoring Dashboards | URL | DevOps |
| Runbook Operaciones | Markdown | DevOps |
| User Guide | PDF/Confluence | Tech Writer |
| Retrospective | Documento | Team |

---

## 4. Matriz de Pruebas (Test Matrix)

### 4.1 Test Coverage Matrix

| User Story | Unit Tests | Integration | E2E | Visual | A11y | Status |
|------------|------------|-------------|-----|--------|--------|--------|
| US-001 Tendencia Cobrado | ✅ | ✅ | ✅ | ✅ | ✅ | **Covered** |
| US-002 Antigüedad Cartera | ✅ | ✅ | ✅ | ✅ | ✅ | **Covered** |
| US-003 Tendencia CXC | ✅ | ✅ | ✅ | ✅ | ✅ | **Covered** |
| US-004 Financiamiento DAC | ✅ | ✅ | ✅ | ✅ | ✅ | **Covered** |
| US-005 Estatus Garantías | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | **Blocked** |
| US-006 Resumen Oficinas | ✅ | ✅ | ✅ | ✅ | ✅ | **Covered** |
| US-007 Facturación DAC | ✅ | ✅ | ✅ | ✅ | ✅ | **Covered** |

### 4.2 Test Scenarios Detallados

#### Escenarios Funcionales

| ID | Escenario | Precondiciones | Pasos | Resultado Esperado | Story |
|----|-----------|----------------|-------|-------------------|-------|
| TF-001 | Visualizar tendencia cobrado año actual vs anterior | Usuario autenticado, datos disponibles | 1. Ir a Dashboard<br>2. Seleccionar año 2024<br>3. Ver gráfica | Líneas de ambos años visibles con tooltip | US-001 |
| TF-002 | Filtrar antigüedad por rango | Dashboard cargado | 1. Hacer clic en segmento "91-120"<br>2. Ver tabla | Tabla filtrada solo con facturas de ese rango | US-002 |
| TF-003 | Ordenar resumen por oficina | Tabla de oficinas cargada | 1. Hacer clic en header "Total"<br>2. Ver orden | Tabla ordenada descendente por monto | US-006 |
| TF-004 | Cambiar filtro DAC financiamiento | Gráfica financiamiento visible | 1. Seleccionar oficina DAC del dropdown<br>2. Aplicar | Datos actualizados para oficina seleccionada | US-004 |
| TF-005 | Exportar tabla a Excel | Tabla con datos | 1. Clic botón "Exportar"<br>2. Verificar archivo | Archivo Excel descargado con datos correctos | Todos |

#### Escenarios de Error

| ID | Escenario | Precondiciones | Pasos | Resultado Esperado |
|----|-----------|----------------|-------|-------------------|
| TE-001 | API no disponible | Servidor caído | 1. Cargar dashboard | Mensaje de error amigable, botón reintentar |
| TE-002 | Datos incompletos | BD con datos faltantes | 1. Cargar tendencia | Gráfica muestra puntos disponibles, gap donde falta |
| TE-003 | Filtro inválido | Usuario modifica URL | 1. Acceder URL con params inválidos | Validación, mensaje error, valores default |
| TE-004 | Timeout query | Query lento | 1. Cargar reporte grande | Spinner > timeout > mensaje error |

#### Escenarios de Usuario

| ID | Perfil | Objetivo | Flujo Principal | Validación |
|----|--------|----------|---------------|------------|
| EU-001 | Gerente Cobranza | Revisar tendencia cobrado | Dashboard → Tendencia Cobrado → Comparar años | ✅ Ve comparativo claro |
| EU-002 | Analista Crédito | Identificar riesgo | Dashboard → Antigüedad → Filtro 121+ días | ✅ Identifica clientes críticos |
| EU-003 | Director Financiero | Ver estado cartera | Dashboard → Tendencia CXC → Mes actual | ✅ Ve salud cartera mes a mes |
| EU-004 | Gerente Operaciones | Controlar financiamiento | Dashboard → Financiamiento → Filtro DAC | ✅ Controla riesgo por oficina |
| EU-005 | Director Corporativo | Comparar oficinas | Dashboard → Resumen Oficinas → Ordenar | ✅ Compara KPIs entre oficinas |

### 4.3 Browser & Device Matrix

| Navegador | Desktop | Tablet | Mobile | Prioridad |
|-----------|---------|--------|--------|-----------|
| Chrome 120+ | ✅ | ✅ | ✅ | P0 |
| Firefox 120+ | ✅ | N/A | N/A | P1 |
| Safari 17+ | ✅ | ✅ | ✅ | P0 |
| Edge 120+ | ✅ | N/A | N/A | P1 |
| Chrome Android | N/A | N/A | ✅ | P0 |
| Safari iOS | N/A | N/A | ✅ | P0 |

---

## 5. Material Design Implementation Guide

### 5.1 Token System (CSS Variables)

```css
/* styles/material-theme.css */

:root {
  /* Primary Palette */
  --md-sys-color-primary: #6750A4;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-primary-container: #EADDFF;
  --md-sys-color-on-primary-container: #21005D;
  
  /* Secondary Palette */
  --md-sys-color-secondary: #625B71;
  --md-sys-color-on-secondary: #FFFFFF;
  --md-sys-color-secondary-container: #E8DEF8;
  --md-sys-color-on-secondary-container: #1D192B;
  
  /* Tertiary Palette */
  --md-sys-color-tertiary: #7D5260;
  --md-sys-color-on-tertiary: #FFFFFF;
  
  /* Error Palette */
  --md-sys-color-error: #B3261E;
  --md-sys-color-on-error: #FFFFFF;
  --md-sys-color-error-container: #F9DEDC;
  --md-sys-color-on-error-container: #410E0B;
  
  /* Surface Palette */
  --md-sys-color-surface: #FEF7FF;
  --md-sys-color-on-surface: #1D1B20;
  --md-sys-color-surface-variant: #E7E0EC;
  --md-sys-color-on-surface-variant: #49454F;
  --md-sys-color-surface-container-lowest: #FFFFFF;
  --md-sys-color-surface-container-low: #F7F2FA;
  --md-sys-color-surface-container: #F3EDF7;
  --md-sys-color-surface-container-high: #ECE6F0;
  --md-sys-color-surface-container-highest: #E6E0E9;
  
  /* Outline */
  --md-sys-color-outline: #79747E;
  --md-sys-color-outline-variant: #CAC4D0;
  
  /* Elevation */
  --md-sys-elevation-0: 0px 0px 0px 0px rgba(0,0,0,0);
  --md-sys-elevation-1: 0px 1px 3px 1px rgba(0,0,0,0.15);
  --md-sys-elevation-2: 0px 2px 6px 2px rgba(0,0,0,0.15);
  
  /* Shape */
  --md-sys-shape-corner-none: 0px;
  --md-sys-shape-corner-extra-small: 4px;
  --md-sys-shape-corner-small: 8px;
  --md-sys-shape-corner-medium: 12px;
  --md-sys-shape-corner-large: 16px;
  --md-sys-shape-corner-extra-large: 28px;
  
  /* Typography */
  --md-sys-typescale-display-large: 400 57px/64px Roboto;
  --md-sys-typescale-display-medium: 400 45px/52px Roboto;
  --md-sys-typescale-display-small: 400 36px/44px Roboto;
  --md-sys-typescale-headline-large: 400 32px/40px Roboto;
  --md-sys-typescale-headline-medium: 400 28px/36px Roboto;
  --md-sys-typescale-headline-small: 400 24px/32px Roboto;
  --md-sys-typescale-title-large: 400 22px/28px Roboto;
  --md-sys-typescale-title-medium: 500 16px/24px Roboto;
  --md-sys-typescale-title-small: 500 14px/20px Roboto;
  --md-sys-typescale-body-large: 400 16px/24px Roboto;
  --md-sys-typescale-body-medium: 400 14px/20px Roboto;
  --md-sys-typescale-body-small: 400 12px/16px Roboto;
  --md-sys-typescale-label-large: 500 14px/20px Roboto;
  --md-sys-typescale-label-medium: 500 12px/16px Roboto;
  --md-sys-typescale-label-small: 500 11px/16px Roboto;
}
```

### 5.2 Component Classes (Tailwind Config)

```typescript
// tailwind.config.ts

export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--md-sys-color-primary)',
          on: 'var(--md-sys-color-on-primary)',
          container: 'var(--md-sys-color-primary-container)',
          'on-container': 'var(--md-sys-color-on-primary-container)',
        },
        secondary: {
          DEFAULT: 'var(--md-sys-color-secondary)',
          on: 'var(--md-sys-color-on-secondary)',
          container: 'var(--md-sys-color-secondary-container)',
          'on-container': 'var(--md-sys-color-on-secondary-container)',
        },
        surface: {
          DEFAULT: 'var(--md-sys-color-surface)',
          'on': 'var(--md-sys-color-on-surface)',
          'variant': 'var(--md-sys-color-surface-variant)',
          'on-variant': 'var(--md-sys-color-on-surface-variant)',
          'container': 'var(--md-sys-color-surface-container)',
          'container-high': 'var(--md-sys-color-surface-container-high)',
        },
        error: {
          DEFAULT: 'var(--md-sys-color-error)',
          container: 'var(--md-sys-color-error-container)',
        },
        outline: {
          DEFAULT: 'var(--md-sys-color-outline)',
          variant: 'var(--md-sys-color-outline-variant)',
        },
      },
      boxShadow: {
        'elevation-1': 'var(--md-sys-elevation-1)',
        'elevation-2': 'var(--md-sys-elevation-2)',
      },
      borderRadius: {
        'none': 'var(--md-sys-shape-corner-none)',
        'xs': 'var(--md-sys-shape-corner-extra-small)',
        'sm': 'var(--md-sys-shape-corner-small)',
        'md': 'var(--md-sys-shape-corner-medium)',
        'lg': 'var(--md-sys-shape-corner-large)',
        'xl': 'var(--md-sys-shape-corner-extra-large)',
      },
    },
  },
};
```

### 5.3 Chart Color System

```typescript
// lib/utils/colors.ts

import { RiskLevel } from '@/app/types/dashboard';

// Material Design 3 Chart Palette
export const chartColors = {
  primary: '#6750A4',
  secondary: '#E8B649',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  info: '#2196F3',
  purple: '#9C27B0',
  teal: '#009688',
};

// Risk-based color mapping for aging
export const agingRiskColors: Record<string, { fill: string; text: string; risk: RiskLevel }> = {
  '1-30': {
    fill: '#4CAF50',      // Green-500
    text: '#1B5E20',      // Green-900
    risk: 'low',
  },
  '31-60': {
    fill: '#FF9800',      // Orange-500
    text: '#E65100',      // Orange-900
    risk: 'medium',
  },
  '61-90': {
    fill: '#FF5722',      // Deep Orange
    text: '#BF360C',      // Deep Orange-900
    risk: 'high',
  },
  '91-120': {
    fill: '#F44336',      // Red-500
    text: '#B71C1C',      // Red-900
    risk: 'critical',
  },
  '121-5000': {
    fill: '#B71C1C',      // Red-900
    text: '#7F0000',      // Red- darkest
    risk: 'critical',
  },
};

// Series colors for trend charts
export const trendSeriesColors = {
  currentYear: '#6750A4',     // Primary
  previousYear: '#958DA5',    // Secondary-light
  vencido: '#2196F3',         // Blue-500
  enTiempo: '#FF9800',        // Orange-500
  porFacturar: '#9C27B0',     // Purple-500
  facturado: '#009688',       // Teal-500
  honorarios: '#2196F3',      // Blue-500
  otros: '#424242',           // Gray-800
};
```

---

## 6. Gestión de Riesgos

### 6.1 Risk Register

| ID | Riesgo | Probabilidad | Impacto | Mitigación | Owner |
|----|--------|--------------|---------|------------|-------|
| R1 | Campo "Cobrado" no disponible en BD | Alta | Alto | Priorizar con DBA, crear workaround | Tech Lead |
| R2 | Campo "estatus_garantia" no existe | Alta | Alto | Mock data inicial, paralelizar con RECO | Product Owner |
| R3 | Queries lentos con muchos datos | Media | Medio | Paginación, índices, caching | DBA |
| R4 | Cambios en requerimientos | Media | Alto | User Stories claras, gates de aprobación | Product Owner |
| R5 | Compatibilidad navegadores | Baja | Medio | Testing cross-browser early | QA |
| R6 | Performance charts con muchos datos | Media | Medio | Virtualización, lazy loading | Frontend |

### 6.2 Mitigation Strategies

```yaml
mitigations:
  database_blockers:
    strategy: "Parallel Workstreams"
    actions:
      - "Desarrollar con mock data mientras BD está lista"
      - "Crear feature flags para funcionalidades bloqueadas"
      - "Daily sync con equipo RECO/DBA"
      
  performance:
    strategy: "Optimize Early"
    actions:
      - "Implementar React Query caching desde inicio"
      - "Usar virtualization para tablas grandes"
      - "Lazy loading de gráficas no visibles"
      
  requirements:
    strategy: "Clear Contracts"
    actions:
      - "API specs firmadas antes de implementar"
      - "Acceptance criteria claros por US"
      - "Demo mid-sprint con stakeholders"
```

---

## 7. Checklist de Aceptación Final

### 7.1 Pre-Deploy Checklist

- [ ] Todos los unit tests pasan (>80% coverage)
- [ ] Todos los integration tests pasan
- [ ] E2E tests de critical paths pasan
- [ ] Lighthouse score > 90 en todas las vistas
- [ ] No hay vulnerabilidades críticas (npm audit)
- [ ] Responsive design validado en mobile/tablet/desktop
- [ ] Accessibility audit sin issues críticos
- [ ] Performance budget cumplido (< 200KB bundle)
- [ ] API response times < 500ms (p95)
- [ ] Documentation técnica completa
- [ ] User guide actualizado
- [ ] Runbook operaciones listo
- [ ] Monitoring y alerts configurados
- [ ] Rollback plan documentado

### 7.2 Acceptance Criteria por Story

| Story | Criterio | Verificado |
|-------|----------|------------|
| US-001 | Comparativo año vs año visible | ⬜ |
| US-001 | Tooltip muestra monto y count | ⬜ |
| US-002 | 5 rangos exactos en gráfica | ⬜ |
| US-002 | Tabla detalle filtrable | ⬜ |
| US-003 | Colores azul/naranja aplicados | ⬜ |
| US-003 | Serie "En tiempo" calculada correctamente | ⬜ |
| US-004 | Filtro DAC funcional | ⬜ |
| US-004 | Separación por facturar/facturado | ⬜ |
| US-005 | Tabla estatus visible | ⬜ |
| US-005 | Promedio calculado correctamente | ⬜ |
| US-006 | Todas las oficinas listadas | ⬜ |
| US-006 | Columnas según especificación | ⬜ |
| US-006 | Sorting funcional | ⬜ |
| US-007 | Gráfica apilada honorarios/resto | ⬜ |
| US-007 | Colores azul (inf)/negro (sup) | ⬜ |

---

## 8. Timeline Resumido

```
SEMANA 1          SEMANA 2          SEMANA 3          SEMANA 4          SEMANA 5          SEMANA 6          SEMANA 7          SEMANA 8          SEMANA 9
┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐
│ DISCOVERY│       │ TECH    │       │ DESIGN  │       │ SPRINT 1│       │ SPRINT 2│       │ SPRINT 3│       │ SPRINT 4│       │ TESTING │       │ DEPLOY  │
│         │       │ SPECS   │       │ SPECS   │       │         │       │         │       │         │       │         │       │         │       │         │
│ • User  │       │ • API   │       │ • M3    │       │ • Theme │       │ • Portfo│       │ • Guara.│       │ • Respon│       │ • Unit  │       │ • Prod  │
│   Stories│      │   Specs │       │   Theme │       │   Setup │       │   Trend │       │ • Billin│       │ • Perfor│       │   Tests │       │   Live  │
│ • Gap   │       │ • DB    │       │ • Comp. │       │ • Trend │       │ • Offic │       │ • E2E   │       │ • Docum.│       │ • E2E   │       │ • Monit.│
│   Analysis│      │   Schema│       │   Lib   │       │   Collec│       │ • Summa.│       │   Tests │       │ • A11y  │       │ • UAT   │       │ • Runboo│
│ • Prior.│       │ • Type  │       │ • Layout│       │ • Aging │       │ • DAC   │       │         │       │ • Fixes │       │         │       │   k     │
│         │       │   Defs  │       │   Specs │       │   Chart │       │   Financ│       │         │       │         │       │         │       │         │
└─────────┘       └─────────┘       └─────────┘       └─────────┘       └─────────┘       └─────────┘       └─────────┘       └─────────┘       └─────────┘

    Fase 1            Fase 2            Fase 3            Fase 4                                                    Fase 5            Fase 6
    
    ◀────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────▶
                                                       
                                                        IMPLEMENTATION (4 semanas)
```

---

## 9. Referencias

### 9.1 Documentación Material Design

- [Material Design 3 Guidelines](https://m3.material.io/)
- [Material Design Components](https://m3.material.io/components)
- [Material Theming](https://m3.material.io/styles/color/the-color-system)
- [Material Icons](https://fonts.google.com/icons)

### 9.2 Spec-Driven Development

- [Microsoft Spec-Driven Development Spec Kit](https://developer.microsoft.com/blog/spec-driven-development-spec-kit)
- [Writing Great Technical Specifications](https://stackoverflow.blog/2020/04/06/a-practical-guide-to-writing-technical-specs/)

### 9.3 Archivos del Proyecto

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| Descripción Requerimientos | `/Downloads/Dashboard GCX/Descripccion.md` | Análisis gap Excel vs Dashboard |
| Database Scripts | `/Downloads/Dashboard GCX/Dash Completo_database_scripts/` | Stored procedures y funciones |
| Frontend Actual | `/Desktop/carpeta sin título/gcx_dashboard_financiero/app/` | Código Next.js existente |

---

## 10. Sign-off

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Product Owner | | | |
| Tech Lead | | | |
| UX Designer | | | |
| DBA | | | |
| QA Lead | | | |

---

*Documento generado siguiendo principios de Spec-Driven Development.*
*Material Design 3 implementation guide incluido.*
*Matriz de pruebas completa definida.*

**Versión**: 1.0  
**Fecha**: Febrero 2026  
**Status**: Draft - Pendiente Review
