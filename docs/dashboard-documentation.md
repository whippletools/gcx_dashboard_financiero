# Documentación del Dashboard Financiero

## Tabla de Datos: `cobranza_raw`

El dashboard se alimenta de la tabla `cobranza_raw` en Supabase que contiene los siguientes campos principales:

- `cliente`: Nombre del cliente
- `rfc`: RFC del cliente  
- `unidad`: Unidad de negocio (UD)
- `ejecutivo`: Ejecutivo asignado
- `factura`: Número de factura
- `fecha_factura`: Fecha de emisión de la factura
- `fecha_vencimiento`: Fecha de vencimiento
- `monto_original`: Monto original de la factura
- `saldo_pendiente`: Saldo pendiente por cobrar
- `estatus`: Estado de la factura (Vigente, Vencida, Pagada)
- `dias_vencidos`: Días transcurridos desde el vencimiento
- `tipo_garantia`: Tipo de garantía asociada
- `estatus_garantia`: Estado de la garantía
- `tipo_financiamiento`: Tipo de financiamiento (Anticipo, Financiamiento)
- `monto_financiamiento`: Monto del financiamiento
- `fecha_pago`: Fecha del último pago
- `monto_pago`: Monto del último pago

---

## 1. Pantalla Principal (Dashboard Overview)

### KPIs Principales

#### **Total por Cobrar**
- **Fuente**: `SUM(saldo_pendiente) WHERE estatus IN ('Vigente', 'Vencida')`
- **Descripción**: Suma total de todos los saldos pendientes de facturas vigentes y vencidas
- **Interacción**: Al hacer clic, muestra tabla detallada de clientes con sus saldos pendientes

#### **Monto en Tiempo**  
- **Fuente**: `SUM(saldo_pendiente) WHERE estatus = 'Vigente' AND dias_vencidos <= 0`
- **Descripción**: Suma de saldos de facturas que aún no han vencido
- **Interacción**: Al hacer clic, muestra tabla de facturas vigentes con fechas de vencimiento

#### **Monto Vencido**
- **Fuente**: `SUM(saldo_pendiente) WHERE estatus = 'Vencida' AND dias_vencidos > 0`
- **Descripción**: Suma de saldos de facturas vencidas
- **Interacción**: Al hacer clic, muestra tabla de clientes con facturas vencidas y días de atraso

### Gráficas Principales

#### **Tendencia de Cartera Mensual (Gráfica de Línea)**
- **Fuente**: 
  \`\`\`sql
  SELECT 
    DATE_TRUNC('month', fecha_factura) as mes,
    SUM(saldo_pendiente) as total_cartera
  FROM cobranza_raw 
  WHERE estatus IN ('Vigente', 'Vencida')
  GROUP BY mes
  ORDER BY mes
  \`\`\`
- **Descripción**: Muestra la evolución mensual del total de la cartera por cobrar
- **Interacción**: Al hacer clic en un punto del mes, filtra y muestra el desglose de clientes de ese período

#### **Antigüedad de Cartera (Gráfica de Barras)**
- **Fuente**: 
  \`\`\`sql
  SELECT 
    CASE 
      WHEN dias_vencidos <= 0 THEN 'Al día'
      WHEN dias_vencidos BETWEEN 1 AND 30 THEN '1-30 días'
      WHEN dias_vencidos BETWEEN 31 AND 60 THEN '31-60 días'
      WHEN dias_vencidos BETWEEN 61 AND 90 THEN '61-90 días'
      ELSE 'Más de 90 días'
    END as rango_antiguedad,
    SUM(saldo_pendiente) as monto,
    COUNT(*) as facturas
  FROM cobranza_raw 
  WHERE estatus IN ('Vigente', 'Vencida')
  GROUP BY rango_antiguedad
  \`\`\`
- **Descripción**: Distribución de la cartera por rangos de antigüedad
- **Interacción**: Al hacer clic en una barra, muestra lista detallada de facturas en ese rango

---

## 2. Módulo de Cartera

### **Comparación En Tiempo vs Vencido por Mes (Gráfica de Barras Agrupadas)**
- **Fuente**:
  \`\`\`sql
  SELECT 
    DATE_TRUNC('month', fecha_factura) as mes,
    SUM(CASE WHEN dias_vencidos <= 0 THEN saldo_pendiente ELSE 0 END) as en_tiempo,
    SUM(CASE WHEN dias_vencidos > 0 THEN saldo_pendiente ELSE 0 END) as vencido
  FROM cobranza_raw 
  WHERE estatus IN ('Vigente', 'Vencida')
  GROUP BY mes
  ORDER BY mes
  \`\`\`
- **Descripción**: Comparación mensual entre montos en tiempo y vencidos
- **Interacción**: Al hacer clic en una barra, filtra la tabla de clientes por ese mes

### **Tabla Detallada de Cartera**
- **Fuente**: 
  \`\`\`sql
  SELECT 
    cliente,
    SUM(saldo_pendiente) as total,
    SUM(CASE WHEN dias_vencidos > 0 THEN saldo_pendiente ELSE 0 END) as vencido,
    MAX(dias_vencidos) as max_dias_vencidos,
    estatus
  FROM cobranza_raw 
  WHERE estatus IN ('Vigente', 'Vencida')
  GROUP BY cliente, estatus
  \`\`\`
- **Descripción**: Resumen por cliente con totales, montos vencidos y días máximos de atraso
- **Interacción**: Al hacer clic en un cliente, abre la vista detallada del cliente

---

## 3. Módulo de Garantías

### **KPI: Total de Garantías**
- **Fuente**: `COUNT(DISTINCT factura) WHERE tipo_garantia IS NOT NULL`
- **Descripción**: Número total de facturas que tienen garantías asociadas

### **Distribución de Garantías por Estatus (Gráfica de Pastel)**
- **Fuente**:
  \`\`\`sql
  SELECT 
    estatus_garantia,
    COUNT(*) as cantidad,
    SUM(saldo_pendiente) as monto_total
  FROM cobranza_raw 
  WHERE tipo_garantia IS NOT NULL
  GROUP BY estatus_garantia
  \`\`\`
- **Descripción**: Proporción de garantías por su estado (Vigente, Vencida, Ejecutada, etc.)
- **Interacción**: Al hacer clic en un segmento, filtra la tabla de garantías

### **Tabla de Garantías**
- **Fuente**: Registros con `tipo_garantia IS NOT NULL`
- **Campos**: Cliente, Factura, Tipo de Garantía, Estatus, Monto, Fecha de Vencimiento
- **Interacción**: Al hacer clic en una garantía, abre modal con detalles editables

---

## 4. Módulo de Financiamiento

### **KPI: Total de Financiamientos**
- **Fuente**: `COUNT(*) WHERE tipo_financiamiento IS NOT NULL`
- **Descripción**: Número total de operaciones de financiamiento

### **Anticipos vs Financiamientos (Gráfica de Barras Agrupadas)**
- **Fuente**:
  \`\`\`sql
  SELECT 
    DATE_TRUNC('month', fecha_factura) as mes,
    SUM(CASE WHEN tipo_financiamiento = 'Anticipo' THEN monto_financiamiento ELSE 0 END) as anticipos,
    SUM(CASE WHEN tipo_financiamiento = 'Financiamiento' THEN monto_financiamiento ELSE 0 END) as financiamientos
  FROM cobranza_raw 
  WHERE tipo_financiamiento IS NOT NULL
  GROUP BY mes
  ORDER BY mes
  \`\`\`
- **Descripción**: Comparación mensual entre montos de anticipos y financiamientos
- **Interacción**: Al hacer clic en una barra, muestra lista de operaciones del período

---

## 5. Módulo de Indicadores Financieros

### **Tabla de Totales por Cliente**
- **Fuente**:
  \`\`\`sql
  SELECT 
    cliente,
    COUNT(*) as total_facturas,
    SUM(monto_original) as monto_total_facturado,
    SUM(saldo_pendiente) as saldo_pendiente,
    SUM(CASE WHEN dias_vencidos > 0 THEN saldo_pendiente ELSE 0 END) as monto_vencido,
    AVG(dias_vencidos) as promedio_dias_vencidos
  FROM cobranza_raw 
  GROUP BY cliente
  ORDER BY saldo_pendiente DESC
  \`\`\`
- **Descripción**: Resumen consolidado por cliente con métricas clave

### **TOP 10 Clientes con Mayor Deuda (Gráfica de Barras)**
- **Fuente**:
  \`\`\`sql
  SELECT 
    cliente,
    SUM(saldo_pendiente) as deuda_total
  FROM cobranza_raw 
  WHERE estatus IN ('Vigente', 'Vencida')
  GROUP BY cliente
  ORDER BY deuda_total DESC
  LIMIT 10
  \`\`\`
- **Descripción**: Ranking de los 10 clientes con mayor saldo pendiente
- **Interacción**: Al hacer clic en una barra, muestra histórico del cliente

---

## 6. Vista Detallada de Cliente

### **Información General**
- **Fuente**: Campos `cliente`, `rfc`, `unidad`, `ejecutivo` del primer registro del cliente

### **Facturas del Cliente**
- **Activas**: `WHERE cliente = ? AND estatus = 'Vigente'`
- **Vencidas**: `WHERE cliente = ? AND estatus = 'Vencida'`  
- **Pagadas**: `WHERE cliente = ? AND estatus = 'Pagada'`

### **Historial de Pagos**
- **Fuente**: Registros con `fecha_pago IS NOT NULL AND monto_pago > 0`
- **Ordenado por**: `fecha_pago DESC`

### **Garantías Vinculadas**
- **Fuente**: `WHERE cliente = ? AND tipo_garantia IS NOT NULL`

### **Gráfica de Evolución de Pagos**
- **Fuente**:
  \`\`\`sql
  SELECT 
    DATE_TRUNC('month', fecha_pago) as mes,
    SUM(monto_pago) as total_pagado
  FROM cobranza_raw 
  WHERE cliente = ? AND fecha_pago IS NOT NULL
  GROUP BY mes
  ORDER BY mes
  \`\`\`

---

## Filtros Globales

Todos los módulos respetan los filtros globales aplicados:

- **Fecha**: Filtra por `fecha_factura BETWEEN fecha_inicio AND fecha_fin`
- **Cliente**: Filtra por `cliente = ?`
- **Estatus**: Filtra por `estatus = ?`
- **Unidad**: Filtra por `unidad = ?`

## Funcionalidad de Exportación

- **Excel**: Utiliza la librería `xlsx` para generar archivos .xlsx con los datos filtrados
- **PDF**: Utiliza `jsPDF` para generar reportes en PDF con gráficas y tablas
- **CSV**: Exportación nativa de JavaScript para archivos CSV

Cada módulo incluye botones de exportación que respetan los filtros activos y las selecciones del usuario.
