const axios = require('axios');

// Cache for exchange rates to avoid excessive API calls
let exchangeRatesCache = {
  rates: {},
  lastUpdated: null,
  cacheDuration: 60 * 60 * 1000 // 1 hour in milliseconds
};

const getCurrencyRates = (req, res) => {
  const now = new Date();

  // Return cached data if fresh
  if (
    exchangeRatesCache.lastUpdated &&
    exchangeRatesCache.rates &&
    Object.keys(exchangeRatesCache.rates).length > 0 &&
    (now - exchangeRatesCache.lastUpdated) < exchangeRatesCache.cacheDuration
  ) {
    return res.json({
      success: true,
      rates: exchangeRatesCache.rates,
      cached: true,
      lastUpdated: exchangeRatesCache.lastUpdated
    });
  }

  // Fetch from API
  axios.get('https://api.currencyapi.com/v3/latest?apikey=cur_live_bg90WLPOcxTMNyqVUvbF5UfedrK9qHnw8WwOve3E', {
    params: {
      base_currency: 'USD',
      currencies: 'GBP,LKR'
    },
    timeout: 10000 // 10 seconds
  })
    .then((response) => {
      if (response.data && response.data.data) {
        const rates = {};

        if (response.data.data.GBP) {
          rates.GBP = response.data.data.GBP.value;
        }
        if (response.data.data.LKR) {
          rates.LKR = response.data.data.LKR.value;
        }

        // Update cache
        exchangeRatesCache.rates = rates;
        exchangeRatesCache.lastUpdated = now;

        res.json({
          success: true,
          rates: rates,
          cached: false,
          lastUpdated: now
        });
      } else {
        throw new Error('Invalid response format from currency API');
      }
    })
    .catch((error) => {
      console.error('Currency API Error:', error.message);

      // Return stale cached data if available
      if (exchangeRatesCache.rates && Object.keys(exchangeRatesCache.rates).length > 0) {
        return res.json({
          success: true,
          rates: exchangeRatesCache.rates,
          cached: true,
          stale: true,
          lastUpdated: exchangeRatesCache.lastUpdated,
          message: 'Using cached rates due to API unavailability'
        });
      }

      // Fallback default rates
      console.log('No cached data available, returning default rates');
      const defaultRates = {
        GBP: 0.75,
        LKR: 320
      };

      res.json({
        success: true,
        rates: defaultRates,
        cached: false,
        fallback: true,
        message: 'Using fallback rates due to API unavailability'
      });
    });
};

module.exports = {
  getCurrencyRates
};
