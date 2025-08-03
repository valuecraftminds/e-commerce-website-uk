const axios = require('axios');

// Cache for exchange rates to avoid excessive API calls
let exchangeRatesCache = {
  rates: {},
  lastUpdated: null,
  cacheDuration: 60 * 60 * 1000 // 1 hour in milliseconds
};

const getCurrencyRates = async (req, res) => {
  try {
    const now = new Date();
    
    // Check if we have cached data that's still fresh
    if (
      exchangeRatesCache.lastUpdated && 
      exchangeRatesCache.rates && 
      Object.keys(exchangeRatesCache.rates).length > 0 &&
      (now - exchangeRatesCache.lastUpdated) < exchangeRatesCache.cacheDuration
    ) {
      console.log('Returning cached exchange rates');
      return res.json({
        success: true,
        rates: exchangeRatesCache.rates,
        cached: true,
        lastUpdated: exchangeRatesCache.lastUpdated
      });
    }

    // Fetch fresh data from currency API
    console.log('Fetching fresh exchange rates from API');
    // const response = await axios.get('https://api.currencyapi.com/v3/latest', {
    const response = await axios.get('https://api.currencyapi.com/v3/latest?apikey=cur_live_Spd5bZ9jnvFWEQzhMAcmaQabDj8KdveVc46E6WzE', {
      params: {
        base_currency: 'USD',
        currencies: 'GBP,LKR'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.data) {
      // Transform the response to match the format expected by frontend
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

  } catch (error) {
    console.error('Currency API Error:', error.message);
    
    // If we have cached data, return it even if it's old
    if (exchangeRatesCache.rates && Object.keys(exchangeRatesCache.rates).length > 0) {
      console.log('API failed, returning stale cached data');
      return res.json({
        success: true,
        rates: exchangeRatesCache.rates,
        cached: true,
        stale: true,
        lastUpdated: exchangeRatesCache.lastUpdated,
        message: 'Using cached rates due to API unavailability'
      });
    }

    // If no cached data, return default rates
    console.log('No cached data available, returning default rates');
    const defaultRates = {
      GBP: 0.75, // Default GBP rate
      LKR: 320   // Default LKR rate
    };
    
    res.json({
      success: true,
      rates: defaultRates,
      cached: false,
      fallback: true,
      message: 'Using fallback rates due to API unavailability'
    });
  }
};

module.exports = {
  getCurrencyRates
};
