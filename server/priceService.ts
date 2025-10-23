/**
 * 價格獲取服務
 * 整合多個免費金融 API，自動獲取股票、加密貨幣的最新價格
 */

interface PriceData {
  ticker: string;
  price: number;
  source: string;
  timestamp: Date;
}

/**
 * 從 Yahoo Finance 獲取美股價格
 */
async function fetchYahooFinancePrice(ticker: string): Promise<number | null> {
  try {
    // 使用 Yahoo Finance API (免費，無需 API key)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`⚠️ Yahoo Finance API failed for ${ticker}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    
    if (price && typeof price === 'number') {
      console.log(`✅ Yahoo Finance: ${ticker} = $${price}`);
      return price;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error fetching Yahoo Finance price for ${ticker}:`, error);
    return null;
  }
}

/**
 * 從台灣證交所 API 獲取台股價格
 */
async function fetchTWSEPrice(ticker: string): Promise<number | null> {
  try {
    // 台灣證交所公開 API
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${ticker}.tw`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    
    if (!response.ok) {
      console.log(`⚠️ TWSE API failed for ${ticker}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const stockData = data.msgArray?.[0];
    const price = parseFloat(stockData?.z || stockData?.y || '0');
    
    if (price > 0) {
      console.log(`✅ TWSE: ${ticker} = NT$${price}`);
      return price;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error fetching TWSE price for ${ticker}:`, error);
    return null;
  }
}

/**
 * 從 CoinGecko 獲取加密貨幣價格
 */
async function fetchCryptoPrice(ticker: string): Promise<number | null> {
  try {
    // CoinGecko 免費 API (無需 key)
    const cryptoIdMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'MATIC': 'matic-network',
      'DOT': 'polkadot',
    };
    
    const coinId = cryptoIdMap[ticker.toUpperCase()];
    if (!coinId) {
      console.log(`⚠️ Unknown crypto ticker: ${ticker}`);
      return null;
    }
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`⚠️ CoinGecko API failed for ${ticker}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const price = data[coinId]?.usd;
    
    if (price && typeof price === 'number') {
      console.log(`✅ CoinGecko: ${ticker} = $${price}`);
      return price;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error fetching crypto price for ${ticker}:`, error);
    return null;
  }
}

/**
 * 判斷股票類型並獲取價格
 */
async function fetchPrice(ticker: string, type: string): Promise<number | null> {
  console.log(`🔍 Fetching price for ${ticker} (${type})...`);
  
  // 根據類型選擇對應的 API
  if (type === '台股') {
    // 台股：使用證交所 API
    return await fetchTWSEPrice(ticker);
  } else if (type === '美股') {
    // 美股：使用 Yahoo Finance
    return await fetchYahooFinancePrice(ticker);
  } else if (type === '加密貨幣') {
    // 加密貨幣：使用 CoinGecko
    return await fetchCryptoPrice(ticker);
  } else {
    // 其他：嘗試 Yahoo Finance
    console.log(`⚠️ Unknown type ${type}, trying Yahoo Finance...`);
    return await fetchYahooFinancePrice(ticker);
  }
}

/**
 * 批量獲取多個持倉的價格
 */
export async function fetchPricesForHoldings(holdings: Array<{
  ticker: string;
  type: string;
}>): Promise<Map<string, number>> {
  console.log(`📊 Fetching prices for ${holdings.length} holdings...`);
  
  const priceMap = new Map<string, number>();
  const promises = holdings.map(async (holding) => {
    const price = await fetchPrice(holding.ticker, holding.type);
    if (price !== null) {
      priceMap.set(holding.ticker, price);
    }
    return { ticker: holding.ticker, price };
  });
  
  await Promise.all(promises);
  
  console.log(`✅ Successfully fetched ${priceMap.size} prices`);
  return priceMap;
}

/**
 * 獲取單一股票價格
 */
export async function fetchSinglePrice(ticker: string, type: string): Promise<number | null> {
  return await fetchPrice(ticker, type);
}

/**
 * 測試所有 API 連接
 */
export async function testPriceApis() {
  console.log('🧪 Testing price APIs...');
  
  // 測試美股
  const tslaPrice = await fetchYahooFinancePrice('TSLA');
  console.log(`Tesla: ${tslaPrice !== null ? '✅' : '❌'}`);
  
  // 測試台股
  const tsmcPrice = await fetchTWSEPrice('2330');
  console.log(`台積電: ${tsmcPrice !== null ? '✅' : '❌'}`);
  
  // 測試加密貨幣
  const btcPrice = await fetchCryptoPrice('BTC');
  console.log(`Bitcoin: ${btcPrice !== null ? '✅' : '❌'}`);
  
  console.log('✅ API test completed');
}
