# 🚀 Guía Rápida - Sistema ML Linking + Pricing

## ⚡ INICIO RÁPIDO

### 1. Iniciar el servidor
```bash
cd backend
npm install  # Si es necesario
node server.js
```

### 2. Acceder a la interfaz
```
http://localhost:5000/ml-manager
```

### 3. Usar el sistema
1. Seleccionar producto (ID = 1)
2. Pegar links de MercadoLibre
3. Ver análisis de precio automático

---

## 🔌 API Principal

### Guardar Links
```bash
POST /api/componentes/:id/ml-mapping
{
  "urls": [
    "https://www.mercadolibre.com.ar/p/MLA19518470",
    "https://www.mercadolibre.com.ar/p/MLA63419156"
  ]
}
```

### Obtener Análisis de Precio
```bash
GET /api/pricing/componente/:id
```

Devuelve:
- Precios de competencia
- Mediana
- Promedio
- **Precio sugerido** (con margen)

---

## 📊 Ejemplo de Flujo

```
Usuario pega links
       ↓
Sistema extrae IDs: MLA123..., MLA456...
       ↓
Valida precios (no 0, no extremos)
       ↓
Calcula mediana
       ↓
Filtra outliers (50%-150% mediana)
       ↓
Calcula promedio
       ↓
Sugiere precio (+5% margen)
       ↓
Muestra resultado en frontend
```

---

## ✨ Características

| Característica | Estado |
|---|---|
| Extracción automática de IDs | ✅ |
| Validación de precios | ✅ |
| Cálculo de mediana | ✅ |
| Filtrado de outliers | ✅ |
| Sugerencia de precio | ✅ |
| Histórico de cambios | ✅ |
| Frontend intuitivo | ✅ |
| Sin API ML bloqueada | ✅ |

---

## 🧪 Tests

```bash
# Ejecutar suite completa
cd backend
node test_ml_system.js
```

10 tests validando:
- Extracción de IDs
- Guardado de mappings
- Cálculo de precios
- Validaciones
- Manejo de errores

---

## 📭 Validaciones Automáticas

| Validación | Regla |
|---|---|
| Precio mínimo | $100 |
| Precio máximo | $10,000,000 |
| Mínimo precios válidos | 2 |
| Margen mínimo | 5% |
| Descuento máximo | 15% |
| Rango outliers | 50%-150% mediana |

---

## 🎯 Casos de Uso

### Caso 1: Nuevo Componente
1. Buscar en MercadoLibre
2. Pegar links de competencia
3. Sistema sugiere precio

### Caso 2: Ajustar Precio
1. Cargar componente
2. Sistema calcula nuevo precio vs competencia
3. Decidir si actualizar

### Caso 3: Monitorear Competencia
1. Guardar links una vez
2. Sistema mantiene histórico
3. Ver tendencia de precios

---

## 📁 Archivos Importantes

```
✅ backend/routes/Componente.js      → POST/GET ML mappings
✅ backend/routes/pricing.js         → Endpoints de pricing
✅ backend/services/pricingService.js → Lógica de cálculos
✅ backend/models/LogMotorPrecio.js  → Logs de precios
✅ frontend/ml-manager.html          → Interfaz web
✅ backend/test_ml_system.js         → Tests
```

---

## 🐛 Troubleshooting

| Problema | Solución |
|---|---|
| CORS error | Check endpoints usar `/api` |
| 404 componente | Verificar ID existe en BD |
| Success: false | Necesita ≥2 precios válidos |
| URLs no se guardan | Verificar formato MLA + números |

---

## 🔗 Links Útiles

- **Documentación completa:** `ML_LINKING_SYSTEM.md`
- **Interfaz web:** http://localhost:5000/ml-manager
- **Test API:** http://localhost:5000/api/pricing/test

---

## 💡 Notas Importantes

✅ NO usa API de MercadoLibre (evita 403)
✅ TODO es manual (copiar/pegar links)
✅ Sistema robusto ante URLs inválidas
✅ Valida automáticamente precios
✅ Histórico de cambios en BD

---

**ESTADO: ✅ LISTO PARA USAR**

Simplemente inicia el servidor y accede a `/ml-manager`
