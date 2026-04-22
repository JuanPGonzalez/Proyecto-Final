
/**
 * Calculate median of an array of numbers
 * @param {number[]} arr
 * @returns {number}
 */
function calculateMedian(arr) {
  if (arr.length === 0) return 0;

  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// No API fetching from node allowed. Pricing uses cached frontend prices.

/**
 * Validate price follows business rules
 * @param {number} price
 * @returns {boolean}
 */
function isPriceValid(price) {
  // Reject zero or negative prices
  if (!price || price <= 0) return false;

  // Reject extremely low prices (less than 100)
  if (price < 100) return false;

  // Reject extremely high prices (more than 10 million)
  if (price > 10000000) return false;

  // Reject NaN
  if (isNaN(price)) return false;

  return true;
}

/**
 * Get robust market price from array of cached prices
 * @param {number[]} cachedPrices - Array of prices from database
 * @param {Object} options - Optional configuration
 * @returns {Promise<{prices: number[], median: number, filteredPrices: number[], average: number, success: boolean, validation: Object}>}
 */
async function getRobustMarketPrice(cachedPrices, options = {}) {
  const {
    minValidPrices = 2,
    outlierPercentage = 0.5, // 50% to 150% of median
    minPriceThreshold = 100,
    maxPriceThreshold = 10000000
  } = options;

  if (!cachedPrices || cachedPrices.length === 0) {
    return {
      prices: [],
      median: 0,
      filteredPrices: [],
      average: 0,
      success: false,
      validation: { reason: 'No prices provided' }
    };
  }

  try {
    // Step 3: Extract valid prices (filter by business rules)
    const prices = cachedPrices.filter(price => price !== null && isPriceValid(price));

    // Check if we have minimum valid prices
    if (prices.length < minValidPrices) {
      return {
        prices: [],
        median: 0,
        filteredPrices: [],
        average: 0,
        success: false,
        validation: {
          reason: 'Insufficient valid prices',
          found: prices.length,
          required: minValidPrices
        }
      };
    }

    // Step 5: Calculate median
    const median = calculateMedian(prices);

    // Step 6: Remove outliers (50% to 150% of median)
    const lowerBound = median * (1 - outlierPercentage);
    const upperBound = median * (1 + outlierPercentage);

    const filteredPrices = prices.filter(
      price => price >= lowerBound && price <= upperBound
    );

    // Step 7: Calculate final average
    const average = filteredPrices.length > 0
      ? filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length
      : 0;

    // Step 8: Return result
    return {
      prices,
      median,
      filteredPrices,
      average: Math.round(average),
      success: filteredPrices.length > 0,
      validation: {
        totalFetched: cachedPrices.length,
        validPrices: prices.length,
        filteredPrices: filteredPrices.length,
        outlierRange: { lower: Math.round(lowerBound), upper: Math.round(upperBound) }
      }
    };
  } catch (error) {
    console.error('[Pricing] Error in getRobustMarketPrice:', error);
    return {
      prices: [],
      median: 0,
      filteredPrices: [],
      average: 0,
      success: false,
      validation: { reason: 'Error processing prices' }
    };
  }
}

/**
 * Calculate suggested price with business rules
 * @param {number} competitionPrice - Average competition price
 * @param {number} currentPrice - Current price in database
 * @param {Object} rules - Business rules
 * @returns {Object} { suggestedPrice, margin, reason }
 */
function calculateSuggestedPrice(competitionPrice, currentPrice = 0, rules = {}) {
  const {
    minMarginPercentage = 5, // Minimum 5% margin
    maxDiscountPercentage = 15, // Can't lower more than 15%
    minPrice = 100
  } = rules;

  if (!competitionPrice || competitionPrice < minPrice) {
    return {
      suggestedPrice: currentPrice,
      margin: 0,
      reason: 'Invalid competition price',
      shouldUpdate: false
    };
  }

  // Suggested price = competition + minimum margin
  const suggestedPrice = Math.ceil(competitionPrice * (1 + minMarginPercentage / 100));

  // If we have current price, check if reduction is acceptable
  if (currentPrice > 0) {
    const discountPercentage = ((currentPrice - suggestedPrice) / currentPrice) * 100;

    if (discountPercentage > maxDiscountPercentage) {
      return {
        suggestedPrice: Math.ceil(currentPrice * (1 - maxDiscountPercentage / 100)),
        margin: maxDiscountPercentage,
        reason: `Reduction capped at ${maxDiscountPercentage}%`,
        shouldUpdate: true,
        capped: true
      };
    }
  }

  return {
    suggestedPrice,
    margin: minMarginPercentage,
    reason: `${minMarginPercentage}% margin over competition`,
    shouldUpdate: suggestedPrice !== currentPrice,
    capped: false
  };
}
/**
 * Calculate market price for a specific componente
 * @param {number|string} componenteId
 * @returns {Promise<Object>}
 */
async function getMarketPriceByComponenteId(componenteId) {
  const { ComponenteML } = require('../models');
  try {
    // Get all ML mappings for this componente
    const mappings = await ComponenteML.findAll({
      where: { componente_id: componenteId }
    });

    const cachedPrices = mappings.map(m => m.price).filter(p => p !== null && p > 0);

    if (cachedPrices.length === 0) {
      return {
        componenteId,
        prices: [],
        median: 0,
        filteredPrices: [],
        average: 0,
        success: false
      };
    }

    // Get robust market price
    const priceData = await getRobustMarketPrice(cachedPrices);

    return {
      componenteId,
      ...priceData
    };
  } catch (error) {
    console.error(`[Pricing] Error getting price for componente ${componenteId}:`, error);
    return {
      componenteId,
      prices: [],
      median: 0,
      filteredPrices: [],
      average: 0,
      success: false
    };
  }
}

module.exports = {
  getRobustMarketPrice,
  getMarketPriceByComponenteId,
  calculateMedian,
  calculateSuggestedPrice,
  isPriceValid
};
