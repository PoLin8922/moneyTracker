// Exchange rate service - fetches real-time rates from exchangerate-api.com (free tier)
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

interface ExchangeRates {
  [currency: string]: number;
}

let cachedRates: ExchangeRates = {
  TWD: 1,
  USD: 30,
  JPY: 0.2,
  EUR: 33,
  GBP: 38,
  CNY: 4.3,
  HKD: 3.8,
};

let lastFetch = 0;

export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  
  // Return cached rates if still fresh
  if (now - lastFetch < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    // Using exchangerate-api.com free tier (no API key needed for basic usage)
    const response = await fetch('https://open.er-api.com/v6/latest/TWD');
    
    if (!response.ok) {
      console.warn('Failed to fetch exchange rates, using cached values');
      return cachedRates;
    }

    const data = await response.json();
    
    if (data.rates) {
      // Convert from TWD base to rates against TWD
      const rates: ExchangeRates = {
        TWD: 1,
      };
      
      // Calculate inverse rates (how many TWD per 1 unit of foreign currency)
      const currencies = ['USD', 'JPY', 'EUR', 'GBP', 'CNY', 'HKD'];
      for (const currency of currencies) {
        if (data.rates[currency]) {
          rates[currency] = 1 / data.rates[currency];
        }
      }
      
      cachedRates = rates;
      lastFetch = now;
      console.log('Exchange rates updated:', rates);
    }
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
  }

  return cachedRates;
}

export function getExchangeRate(currency: string): number {
  return cachedRates[currency] || 1;
}
