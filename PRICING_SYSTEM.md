# Market Price Calculation System

## Overview

Robust market price calculator using MercadoLibre item data. Fetches prices from ML items endpoint, filters outliers, and returns a reliable market average price.

---

## Architecture

### Files Created

#### 1. `backend/services/pricingService.js`
Core service with price calculation logic.

**Exports:**
- `getRobustMarketPrice(ids)` - Calculate robust price from ML IDs
- `getMarketPriceByComponenteId(componenteId, ComponenteMLModel)` - Get price by componente
- `calculateMedian(arr)` - Utility: calculate median
- `fetchItemFromML(itemId, timeout)` - Utility: fetch single ML item

#### 2. `backend/routes/pricing.js`
Express route handlers.

**Endpoints:**
- `GET /api/pricing/test` - Test endpoint with hardcoded ML IDs
- `GET /api/pricing/componente/:id` - Get price for specific componente
- `POST /api/pricing/calculate` - Calculate price for custom IDs

#### 3. `backend/server.js` (Modified)
Integrated pricing routes into Express app.

---

## Algorithm

### `getRobustMarketPrice(ids: string[])`

**Step-by-step:**

1. **Validate Input** - Return empty result if no IDs provided
2. **Parallel Fetch** - Use `Promise.all()` to fetch all items concurrently
3. **Filter Invalid Data** - Exclude:
   - Null prices
   - Zero prices
   - Failed requests (404, timeout, etc.)
   - Inactive items
4. **Calculate Median** - Find middle value of valid prices
5. **Remove Outliers** - Keep only prices within 50% to 150% of median
6. **Calculate Average** - Mean of filtered prices
7. **Return Result** - Object with all data and success flag

**Input Example:**
```javascript
['MLA1617800563', 'MLA1339807170', 'MLA1677927445']
```

**Output Example:**
```javascript
{
  prices: [120000, 125000, 300000, 123000],
  median: 122500,
  filteredPrices: [120000, 125000, 123000],
  average: 122667,
  success: true
}
```

### `getMarketPriceByComponenteId(componenteId, ComponenteMLModel)`

**Steps:**

1. Query `componente_ml` table for all ML IDs of the componente
2. Call `getRobustMarketPrice()` with those IDs
3. Return result with `componenteId` included

**Output Example:**
```javascript
{
  componenteId: 1,
  prices: [120000, 125000, 300000, 123000],
  median: 122500,
  filteredPrices: [120000, 125000, 123000],
  average: 122667,
  success: true
}
```

---

## API Endpoints

### 1. Test Endpoint (With Sample Data)

**Request:**
```bash
GET http://localhost:5000/api/pricing/test
```

**Response:**
```json
{
  "prices": [150000, 160000, 155000, 500000, 140000],
  "median": 155000,
  "filteredPrices": [150000, 160000, 155000, 140000],
  "average": 151250,
  "success": true
}
```

---

### 2. Get Price by Componente ID

**Request:**
```bash
GET http://localhost:5000/api/pricing/componente/1
```

**Response:**
```json
{
  "componenteId": 1,
  "prices": [120000, 125000, 123000],
  "median": 123000,
  "filteredPrices": [120000, 125000, 123000],
  "average": 122667,
  "success": true
}
```

**Error (No ML IDs for componente):**
```json
{
  "componenteId": 1,
  "prices": [],
  "median": 0,
  "filteredPrices": [],
  "average": 0,
  "success": false
}
```

---

### 3. Calculate Price from Custom IDs

**Request:**
```bash
POST http://localhost:5000/api/pricing/calculate
Content-Type: application/json

{
  "ids": ["MLA1617800563", "MLA1339807170", "MLA1677927445"]
}
```

**Response:**
```json
{
  "prices": [120000, 125000, 123000],
  "median": 123000,
  "filteredPrices": [120000, 125000, 123000],
  "average": 122667,
  "success": true
}
```

---

## Error Handling

### Resilience Features

✅ **Per-request try/catch** - One failed ML request doesn't crash the system

✅ **Promise.all() safe** - Concurrent requests with proper error handling

✅ **Request timeout** - 5-second timeout prevents hanging on slow ML API

✅ **Graceful degradation** - Returns `success: false` if no valid prices found

✅ **Silent failures** - Failed requests are logged but don't throw

### Examples

**Invalid componente ID:**
```json
{
  "error": "Invalid componente ID"
}
```

**Invalid POST body:**
```json
{
  "error": "Invalid request",
  "details": "ids must be a non-empty array"
}
```

**ML API failure (partial):**
If 2 of 5 requests fail:
- 3 valid prices are processed
- Median, filtered prices, and average calculated from 3 prices
- `success: true` if at least 1 valid price

---

## Testing

### Run Service Tests

```bash
cd backend
node test_pricing.js
```

**Tests:**
1. ✅ Median calculation (odd length)
2. ✅ Median calculation (even length)
3. ✅ Fetch single ML item
4. ✅ Get robust price (real ML IDs)
5. ✅ Handle empty input
6. ✅ Handle invalid IDs

### Test Endpoints with cURL

```bash
# Test endpoint
curl http://localhost:5000/api/pricing/test

# Custom calculation
curl -X POST http://localhost:5000/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{"ids": ["MLA1617800563", "MLA1339807170"]}'

# By componente
curl http://localhost:5000/api/pricing/componente/1
```

---

## Performance Considerations

- **Concurrent requests** - Uses `Promise.all()` for parallel fetching
- **Timeout** - 5-second per-request timeout prevents hanging
- **Filtering** - Outlier removal keeps results realistic
- **Scalability** - Handles arrays with many IDs efficiently

---

## Data Flow

```
API Request
    ↓
GET /api/pricing/test
    ↓
getRobustMarketPrice(['MLA...', 'MLA...'])
    ↓
Promise.all([fetchItemFromML(), fetchItemFromML(), ...])
    ↓
[{price: 120000}, {price: 125000}, null, {price: 123000}]
    ↓
Filter nulls → [120000, 125000, 123000]
    ↓
Calculate median → 123000
    ↓
Filter outliers (50%-150%) → [120000, 125000, 123000]
    ↓
Calculate average → 122667
    ↓
JSON Response
```

---

## Integration with Existing Code

The pricing service integrates seamlessly with:

- ✅ Existing `componente_ml` database table
- ✅ Existing `Product` model (via relationships)
- ✅ Express routing system
- ✅ Axios HTTP client (already used in project)

No database modifications required.

---

## Next Steps (Optional)

- Cache results using Redis
- Add scheduled pricing updates via cron
- Integrate with admin dashboard
- Create alerts for price anomalies
- Track pricing history
