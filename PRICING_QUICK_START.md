# Pricing System - Quick Reference

## ✅ What Was Implemented

### Files Created
1. `backend/services/pricingService.js` - Core service
2. `backend/routes/pricing.js` - API endpoints
3. `backend/test_pricing.js` - Test suite
4. `PRICING_SYSTEM.md` - Full documentation

### Files Modified
1. `backend/server.js` - Added pricing route integration

---

## 🚀 Quick Start

### Start the server
```bash
cd backend
npm install  # if needed
node server.js
```

### Test the pricing system
```bash
# In another terminal
curl http://localhost:5000/api/pricing/test
```

### Run comprehensive tests
```bash
node test_pricing.js
```

---

## 📊 Core Function: `getRobustMarketPrice(ids)`

```javascript
const { getRobustMarketPrice } = require('./services/pricingService');

// Usage
const result = await getRobustMarketPrice([
  'MLA1617800563',
  'MLA1339807170',
  'MLA1677927445'
]);

// Returns
{
  prices: [120000, 125000, 123000],              // All valid prices
  median: 123000,                                 // Median value
  filteredPrices: [120000, 125000, 123000],     // Prices within 50%-150% of median
  average: 122667,                                // Final calculated average
  success: true                                   // Whether enough data was found
}
```

---

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/pricing/test` | Test with sample ML IDs |
| GET | `/api/pricing/componente/:id` | Get price for componente |
| POST | `/api/pricing/calculate` | Custom IDs calculation |

---

## 💡 Key Features

✅ **Fault-tolerant** - Handles failed requests gracefully
✅ **Outlier-resistant** - Filters extreme prices automatically
✅ **Fast** - Concurrent requests with timeout
✅ **Production-ready** - Comprehensive error handling
✅ **No DB mods** - Uses existing `componente_ml` table

---

## 🧪 Example Usage

### In your application code:

```javascript
const { getRobustMarketPrice, getMarketPriceByComponenteId } = 
  require('./services/pricingService');
const { ComponenteML } = require('./models');

// Calculate price for a componente
const price = await getMarketPriceByComponenteId(1, ComponenteML);
console.log(`Average price: $${price.average}`);

// Or use raw ML IDs
const customPrice = await getRobustMarketPrice([
  'MLA1617800563',
  'MLA1339807170'
]);
console.log(`Median: $${customPrice.median}`);
```

---

## 🎯 Algorithm Summary

1. Fetch all ML item prices → `Promise.all()`
2. Filter invalid prices (null, 0, errors)
3. Calculate median
4. Keep only prices 50%-150% of median
5. Calculate average of filtered prices
6. Return result with all stats

---

## ⚙️ Configuration

### Timeout
Default: 5 seconds per ML API request
Modify in `fetchItemFromML()` function if needed

### Outlier Range
Default: 50% to 150% of median
Modify in `getRobustMarketPrice()` function to adjust sensitivity

---

## 📝 Response Format

```json
{
  "prices": [price1, price2, ...],          // All fetched prices
  "median": number,                          // Middle value
  "filteredPrices": [price1, price2, ...], // After outlier removal
  "average": number,                         // Final average
  "success": boolean                         // success = prices.length > 0
}
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Empty prices array | Check if ML IDs are valid |
| success: false | Verify at least 1 ML ID is working |
| Timeout errors | Check internet connection to ML API |
| 404 on endpoint | Ensure server.js loaded pricingRoutes |

---

For full documentation, see: `PRICING_SYSTEM.md`
