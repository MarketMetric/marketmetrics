const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

// GET /api/quote?symbols=AAPL,MSFT,NVDA
app.get('/api/quote', async (req, res) => {
  try {
    const symbols = req.query.symbols || 'AAPL';
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=symbol,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,marketCap`;
    const response = await fetch(url, { headers: HEADERS });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Quote error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chart?symbol=^GSPC&range=1mo&interval=1d
app.get('/api/chart', async (req, res) => {
  try {
    const { symbol = '^GSPC', range = '1mo', interval = '1d' } = req.query;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const response = await fetch(url, { headers: HEADERS });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Chart error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market-summary
app.get('/api/market-summary', async (req, res) => {
  try {
    const symbols = '^GSPC,^DJI,^IXIC,^VIX,DX-Y.NYB';
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=symbol,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,fiftyTwoWeekHigh,fiftyTwoWeekLow,trailingPE,dividendYield,averageDailyVolume3Month,marketCap`;
    const response = await fetch(url, { headers: HEADERS });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Market summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sectors
app.get('/api/sectors', async (req, res) => {
  try {
    const symbols = 'XLK,XLF,XLV,XLY,XLI,XLE,XLU,XLRE,XLB,XLC,XLP';
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=symbol,shortName,regularMarketChangePercent`;
    const response = await fetch(url, { headers: HEADERS });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Sectors error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movers
app.get('/api/movers', async (req, res) => {
  try {
    const symbols = 'AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,BRK-B,JPM,V,WMT,XOM,UNH,LLY,JNJ,MA,PG,HD,MRK,AVGO';
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=symbol,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent`;
    const response = await fetch(url, { headers: HEADERS });
    const data = await response.json();

    const quotes = data?.quoteResponse?.result || [];
    const sorted = [...quotes].sort((a, b) =>
      Math.abs(b.regularMarketChangePercent) - Math.abs(a.regularMarketChangePercent)
    );

    res.json({
      gainers: sorted.filter(q => q.regularMarketChangePercent > 0).slice(0, 4),
      losers:  sorted.filter(q => q.regularMarketChangePercent < 0).slice(0, 4)
    });
  } catch (err) {
    console.error('Movers error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅  Market Metrics server running at http://localhost:${PORT}\n`);
});
