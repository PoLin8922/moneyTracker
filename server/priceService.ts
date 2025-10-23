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
 * 標準化股票代碼格式供 Yahoo Finance 使用
 * 台股: 2330 → 2330.TW
 * 美股: TSLA → TSLA
 * 加密貨幣: BTC → BTC-USD
 */
function normalizeTickerForYahoo(ticker: string, type: string): string[] {
  // 返回多個可能的格式，按優先級嘗試
  const possibilities: string[] = [ticker]; // 原始格式
  
  if (type === '台股') {
    // 台股：嘗試多種格式
    if (!ticker.includes('.')) {
      possibilities.unshift(`${ticker}.TW`);  // 優先嘗試
      possibilities.push(`${ticker}.TWO`);    // 櫃買中心
    }
  } else if (type === '加密貨幣') {
    // 加密貨幣：嘗試 -USD 後綴
    if (!ticker.includes('-')) {
      possibilities.unshift(`${ticker}-USD`);
    }
  }
  // 美股和其他：直接使用原始代碼
  
  return possibilities;
}

/**
 * 從 Yahoo Finance 獲取價格（支援全球市場）
 * 支援：美股、台股、港股、日股、加密貨幣等
 */
async function fetchYahooFinancePrice(ticker: string, type: string = '美股'): Promise<number | null> {
  const possibilities = normalizeTickerForYahoo(ticker, type);
  
  for (const symbol of possibilities) {
    try {
      // 使用 Yahoo Finance API (免費，無需 API key)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`⚠️ Yahoo Finance: ${symbol} not found (${response.status})`);
        continue; // 嘗試下一個格式
      }
      
      const data = await response.json();
      const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
      
      if (price && typeof price === 'number') {
        console.log(`✅ Yahoo Finance: ${symbol} = $${price}`);
        return price;
      }
    } catch (error) {
      console.log(`⚠️ Yahoo Finance error for ${symbol}:`, error);
      continue;
    }
  }
  
  console.log(`❌ Yahoo Finance: No valid format found for ${ticker}`);
  return null;
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
 * 智能多源價格獲取策略
 * 策略：優先使用 Yahoo Finance（支援最廣），失敗才用專用 API
 */
async function fetchPrice(ticker: string, type: string): Promise<number | null> {
  console.log(`🔍 Fetching price for ${ticker} (${type})...`);
  
  // 策略 1: 優先嘗試 Yahoo Finance（支援全球市場）
  console.log(`📊 Strategy 1: Trying Yahoo Finance for ${ticker}...`);
  let price = await fetchYahooFinancePrice(ticker, type);
  if (price !== null) {
    return price;
  }
  
  // 策略 2: 如果 Yahoo Finance 失敗，使用專用 API 作為備用
  console.log(`📊 Strategy 2: Yahoo failed, trying specialized API...`);
  
  if (type === '台股') {
    // 台股備用：證交所 API
    console.log(`🇹🇼 Trying TWSE API for ${ticker}...`);
    price = await fetchTWSEPrice(ticker);
    if (price !== null) return price;
  } else if (type === '加密貨幣') {
    // 加密貨幣備用：CoinGecko
    console.log(`💰 Trying CoinGecko for ${ticker}...`);
    price = await fetchCryptoPrice(ticker);
    if (price !== null) return price;
  }
  
  // 策略 3: 最後嘗試，直接用原始代碼查詢 Yahoo（可能是其他國際市場）
  console.log(`📊 Strategy 3: Trying raw ticker on Yahoo...`);
  const rawUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
  try {
    const response = await fetch(rawUrl);
    if (response.ok) {
      const data = await response.json();
      const rawPrice = data.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (rawPrice && typeof rawPrice === 'number') {
        console.log(`✅ Yahoo Finance (raw): ${ticker} = $${rawPrice}`);
        return rawPrice;
      }
    }
  } catch (error) {
    // 忽略錯誤
  }
  
  console.log(`❌ All strategies failed for ${ticker}`);
  return null;
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
 * 測試所有 API 連接和支援的市場
 */
export async function testPriceApis() {
  console.log('🧪 Testing price APIs and market support...');
  console.log('='.repeat(60));
  
  const tests = [
    // 美股
    { ticker: 'TSLA', type: '美股', name: 'Tesla' },
    { ticker: 'AAPL', type: '美股', name: 'Apple' },
    { ticker: 'NVDA', type: '美股', name: 'NVIDIA' },
    
    // 台股
    { ticker: '2330', type: '台股', name: '台積電' },
    { ticker: '0050', type: '台股', name: '元大台灣50' },
    { ticker: '2454', type: '台股', name: '聯發科' },
    
    // 港股
    { ticker: '0700.HK', type: '港股', name: '騰訊' },
    { ticker: '9988.HK', type: '港股', name: '阿里巴巴' },
    
    // 日股
    { ticker: '7203.T', type: '日股', name: 'Toyota' },
    
    // 加密貨幣
    { ticker: 'BTC', type: '加密貨幣', name: 'Bitcoin' },
    { ticker: 'ETH', type: '加密貨幣', name: 'Ethereum' },
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    const price = await fetchPrice(test.ticker, test.type);
    const status = price !== null ? '✅' : '❌';
    const priceStr = price !== null ? `$${price}` : 'Failed';
    console.log(`${status} ${test.name} (${test.ticker}): ${priceStr}`);
    if (price !== null) successCount++;
  }
  
  console.log('='.repeat(60));
  console.log(`✅ Test completed: ${successCount}/${tests.length} succeeded`);
  console.log('');
  console.log('📝 支援的市場:');
  console.log('  🇺🇸 美股: 直接使用代碼 (TSLA, AAPL, GOOGL...)');
  console.log('  🇹🇼 台股: 使用代碼或加 .TW (2330, 0050, 2454...)');
  console.log('  🇭🇰 港股: 代碼.HK (0700.HK, 9988.HK...)');
  console.log('  🇯🇵 日股: 代碼.T (7203.T, 6758.T...)');
  console.log('  🇨🇳 A股: 代碼.SS 或 .SZ (600519.SS...)');
  console.log('  💰 加密貨幣: BTC, ETH, BTC-USD...');
  console.log('  🌍 其他: 只要 Yahoo Finance 有，都支援！');
}
