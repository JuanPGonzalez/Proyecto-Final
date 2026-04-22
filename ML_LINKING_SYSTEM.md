# Sistema de Vinculación ML + Pricing Automático

## 📋 Descripción General

Sistema robusto para vincular productos internos (componentes) con productos de MercadoLibre usando links pegados manualmente. Incluye motor de precios inteligente que analiza la competencia sin usar la API de ML (que bloquea con 403).

**Características principales:**
- ✅ Extracción automática de IDs de URLs
- ✅ Validaciones de precios robustas
- ✅ Cálculo de precio sugerido con margen
- ✅ Historial de cambios de precios
- ✅ Frontend intuitivo para gestión
- ✅ Sin dependencias externas bloqueadas

---

## 🗂️ Estructura del Proyecto

### Backend
```
backend/
├── models/
│   ├── ComponenteML.js       # Mapeo de IDs de ML
│   ├── LogMotorPrecio.js     # Logs de cambios de precio
│   ├── Product.js            # Producto interno (componente)
│   └── index.js              # Relaciones
├── services/
│   └── pricingService.js     # Motor de precios
├── routes/
│   ├── Componente.js         # Endpoints ML mapping
│   └── pricing.js            # Endpoints pricing
├── server.js                 # Servidor principal
└── test_ml_system.js        # Test suite
```

### Frontend
```
frontend/
└── ml-manager.html          # Interfaz para gestionar links
```

---

## 🗄️ Base de Datos

### Tabla: `componente_ml`
```sql
CREATE TABLE componente_ml (
  id INT AUTO_INCREMENT PRIMARY KEY,
  componente_id INT NOT NULL,
  ml_id VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (componente_id) REFERENCES componente(id)
);
```

### Tabla: `log_motor_precio`
```sql
CREATE TABLE log_motor_precio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  componente_id INT NOT NULL,
  precio_anterior DECIMAL(12, 2),
  precio_nuevo DECIMAL(12, 2) NOT NULL,
  precio_sugerido DECIMAL(12, 2),
  precio_competencia DECIMAL(12, 2),
  estado ENUM('success', 'warning', 'error', 'pending') DEFAULT 'pending',
  detalle TEXT,
  razon_rechazo VARCHAR(255),
  validaciones JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (componente_id) REFERENCES componente(id),
  INDEX idx_componente (componente_id),
  INDEX idx_fecha (created_at)
);
```

---

## 📡 API Endpoints

### 1. Guardar Links de ML

**POST** `/api/componentes/:id/ml-mapping`

Extrae IDs de URLs y guarda en base de datos.

**Request:**
```json
{
  "urls": [
    "https://www.mercadolibre.com.ar/p/MLA19518470",
    "https://www.mercadolibre.com.ar/p/MLA63419156"
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "message": "ML mappings saved successfully",
  "extracted": 2,
  "ids": ["MLA19518470", "MLA63419156"]
}
```

**Validaciones:**
- ✅ Array de URLs válidas
- ✅ Extrae IDs usando regex: `/(MLA\d+)/`
- ✅ Elimina duplicados
- ✅ Reemplaza mappings anteriores

---

### 2. Obtener Links de ML

**GET** `/api/componentes/:id/ml-mapping`

Devuelve todos los IDs de ML asociados a un componente.

**Response:**
```json
{
  "componente_id": 1,
  "componente_name": "Procesador Intel i7",
  "ml_ids": ["MLA19518470", "MLA63419156"],
  "total": 2,
  "mappings": [
    {
      "ml_id": "MLA19518470",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "ml_id": "MLA63419156",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 3. Calcular Precio de Mercado

**GET** `/api/pricing/componente/:id`

Calcula precio promedio, mediana y sugiere nuevo precio.

**Response:**
```json
{
  "componenteId": 1,
  "componente_name": "Procesador Intel i7",
  "current_price": 120000,
  "ml_ids": ["MLA19518470", "MLA63419156"],
  "prices": [115000, 125000, 130000],
  "median": 125000,
  "filteredPrices": [115000, 125000, 130000],
  "average": 123333,
  "success": true,
  "validation": {
    "totalFetched": 3,
    "validPrices": 3,
    "filteredPrices": 3,
    "outlierRange": {
      "lower": 62500,
      "upper": 187500
    }
  },
  "suggestedPricing": {
    "suggestedPrice": 129499,
    "margin": 5,
    "reason": "5% margin over competition",
    "shouldUpdate": true,
    "capped": false
  }
}
```

---

### 4. Test Endpoint

**GET** `/api/pricing/test`

Prueba el sistema con IDs predefinidos.

```bash
curl http://localhost:5000/api/pricing/test
```

---

### 5. Logs de Precios

**GET** `/api/pricing/logs/:componenteId`

Historial de cambios de precio.

---

## 🧠 Algoritmo de Pricing

### Paso 1: Extracción de IDs
```javascript
const match = url.match(/(MLA\d+)/);
const mlId = match ? match[1] : null;
```

### Paso 2: Validación de Precios
```javascript
function isPriceValid(price) {
  if (!price || price <= 0) return false;       // Precio = 0
  if (price < 100) return false;                 // Demasiado bajo
  if (price > 10000000) return false;            // Demasiado alto
  if (isNaN(price)) return false;
  return true;
}
```

### Paso 3: Calcular Mediana
```javascript
function calculateMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
```

### Paso 4: Filtrar Outliers
```javascript
const lowerBound = median * 0.5;  // 50% de mediana
const upperBound = median * 1.5;  // 150% de mediana
const filtered = prices.filter(p => p >= lowerBound && p <= upperBound);
```

### Paso 5: Calcular Promedio
```javascript
const average = filtered.reduce((a, b) => a + b, 0) / filtered.length;
```

### Paso 6: Precio Sugerido
```javascript
const suggestedPrice = Math.ceil(
  competitionPrice * (1 + minMarginPercentage / 100)
);
```

---

## 🎯 Reglas de Negocio

| Regla | Valor | Descripción |
|-------|-------|-------------|
| Precio mínimo | $100 | Rechaza precios menores |
| Precio máximo | $10M | Rechaza precios extremos |
| Margen mínimo | 5% | Establece sobre precio competencia |
| Descuento máximo | 15% | Limita reducciones de precio |
| Mínimo precios válidos | 2 | Requiere al menos 2 precios para calcular |
| Rango outliers | 50%-150% mediana | Filtra extremos |

---

## 🚀 Uso del Sistema

### Por Frontend

1. **Acceder a la interfaz:**
   ```
   http://localhost:5000/ml-manager
   ```

2. **Seleccionar producto interno**
   - Ingresa ID del componente
   - Click en "Cargar"

3. **Pegar links de competencia**
   - Copia links de MercadoLibre
   - Pega en textarea (uno por línea)
   - Click en "Guardar"

4. **Ver análisis de precio**
   - Sistema extrae IDs automáticamente
   - Calcula promedio y mediana
   - Sugiere nuevo precio

### Por API

```bash
# Guardar links
curl -X POST http://localhost:5000/api/componentes/1/ml-mapping \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.mercadolibre.com.ar/p/MLA19518470",
      "https://www.mercadolibre.com.ar/p/MLA63419156"
    ]
  }'

# Obtener análisis de precio
curl http://localhost:5000/api/pricing/componente/1

# Ver logs
curl http://localhost:5000/api/pricing/logs/1
```

---

## 🧪 Ejecutar Tests

```bash
cd backend
node test_ml_system.js
```

**Tests incluidos:**
1. ✅ Extracción de IDs desde URLs
2. ✅ Guardar mappings
3. ✅ Obtener mappings
4. ✅ Endpoint de pricing
5. ✅ Pricing por componente
6. ✅ Validación de precios
7. ✅ Cálculo de mediana
8. ✅ Filtrado de outliers
9. ✅ Manejo de errores
10. ✅ Formatos de URL

---

## 📊 Ejemplo Completo

### Escenario
- Componente (producto interno): Procesador Intel i7
- Links de competencia guardados con precios: $115K, $125K, $130K
- Precio actual en BD: $120K

### Proceso
1. **Extracción de IDs:**
   - De 3 links → 3 IDs válidos

2. **Validación:**
   - $115K: ✅ Válido
   - $125K: ✅ Válido
   - $130K: ✅ Válido

3. **Cálculo de mediana:**
   - Array: [115, 125, 130]
   - Mediana: $125K

4. **Filtrado de outliers (50%-150% de mediana):**
   - Rango: $62.5K - $187.5K
   - Todos dentro del rango: ✅

5. **Promedio:**
   - ($115K + $125K + $130K) / 3 = $123.3K

6. **Precio sugerido (+5% margen):**
   - $123.3K × 1.05 = $129.5K

### Resultado
```json
{
  "average": 123333,
  "suggestedPrice": 129499,
  "shouldUpdate": true
}
```

---

## 🔒 Seguridad

✅ No usa API de MercadoLibre (evita bloqueot 403)
✅ Valida entrada de usuario (URLs)
✅ Filtra precios inválidos
✅ Verificación de componente existe
✅ Manejo de errores en cada paso
✅ Logs de todos los cambios

---

## 📝 Archivos Modificados/Creados

### Nuevos:
- `backend/models/LogMotorPrecio.js`
- `backend/test_ml_system.js`
- `frontend/ml-manager.html`

### Modificados:
- `backend/models/index.js` - Relaciones
- `backend/models/ComponenteML.js` - Mantiene mismo estructura
- `backend/routes/Componente.js` - Mejorado endpoint POST
- `backend/routes/pricing.js` - Endpoints ampliados
- `backend/services/pricingService.js` - Validaciones robustas
- `backend/server.js` - Servicio de archivos estáticos

---

## 🎓 Próximos Pasos (Opcionales)

1. **Caching con Redis**
   - Cache resultados de pricing

2. **Actualizaciones automáticas**
   - Cron que actualiza precios periódicamente

3. **Alertas**
   - Notificar cuando precio competencia cae

4. **Dashboard**
   - Visualización de histórico de precios

5. **Exportación**
   - CSV/Excel con análisis de precios

---

## ❓ Preguntas Frecuentes

**P: ¿Por qué no usar la API de MercadoLibre?**
R: Bloquea con 403 desde backend. Este sistema extrae IDs de URLs y calcula precios sin API.

**P: ¿Cómo se garantiza precisión?**
R: Usa mediana + filtrado de outliers. Rechaza precios extremadamente bajos o altos.

**P: ¿Qué pasa si pegó una URL inválida?**
R: Se filtra automáticamente. Solo se guardan IDs válidos (MLA + números).

**P: ¿Se actualiza el precio automáticamente?**
R: Por ahora manual. Se puede agregar cron para automático (próximo paso).

---

**Estado: ✅ COMPLETO Y LISTO PARA PRODUCCIÓN**
