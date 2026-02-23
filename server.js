const express = require(‘express’);
const fetch = require(‘node-fetch’);
const cors = require(‘cors’);
const path = require(‘path’);

const app = express();
const PORT = 3000;
const API_KEY = ‘vxyAviWMbyvAMVQ3UHECsPKM9KGZz4fj’;
const FMP = ‘https://financialmodelingprep.com/api/v3’;

app.use(cors());
app.use(express.static(path.join(__dirname, ‘public’)));

// GET /api/quote?symbols=AAPL,MSFT
app.get(’/api/quote’, async (req, res) => {
try {
const symbols = (req.query.symbols || ‘AAPL’).split(’,’);
const results = await Promise.all(symbols.map(async s => {
const r = await fetch(`${FMP}/quote/${s.trim()}?apikey=${API_KEY}`);
const d = await r.json();
return d[0] ?? null;
}));
res.json({ quoteResponse: { result: results.filter(Boolean) } });
} catch (err) {
console.error(‘Quote error:’, err.message);
res.status(500).json({ error: err.message });
}
});

// GET /api/market-summary
app.get(’/api/market-summary’, async (req, res) => {
try {
const symbols    = [’^GSPC’, ‘^DJI’, ‘^IXIC’, ‘^VIX’, ‘DX-Y.NYB’];
const fmpSymbols = [’%5EGSPC’, ‘%5EDJI’, ‘%5EIXIC’, ‘%5EVIX’, ‘DX-Y.NYB’];

```
const results = await Promise.all(fmpSymbols.map(async (s, i) => {
  try {
    const r = await fetch(`${FMP}/quote/${s}?apikey=${API_KEY}`);
    const d = await r.json();
    if (d && d[0]) {
      return {
        ...d[0],
        symbol:                     symbols[i],
        regularMarketPrice:         d[0].price,
        regularMarketChange:        d[0].change,
        regularMarketChangePercent: d[0].changesPercentage,
        fiftyTwoWeekHigh:           d[0].yearHigh,
        fiftyTwoWeekLow:            d[0].yearLow,
        trailingPE:                 d[0].pe,
        marketCap:                  d[0].marketCap,
        averageDailyVolume3Month:   d[0].avgVolume,
      };
    }
    return null;
  } catch { return null; }
}));

res.json({ quoteResponse: { result: results.filter(Boolean) } });
```

} catch (err) {
console.error(‘Market summary error:’, err.message);
res.status(500).json({ error: err.message });
}
});

// GET /api/chart?symbol=^GSPC&range=1mo&interval=1d
app.get(’/api/chart’, async (req, res) => {
try {
let { symbol = ‘%5EGSPC’, range = ‘1mo’ } = req.query;

```
const rangeMap = {
  '1d':  { endpoint: 'historical-chart/5min',  limit: 78   },
  '5d':  { endpoint: 'historical-chart/15min', limit: 130  },
  '1mo': { endpoint: 'historical-price-full',  limit: 30   },
  '3mo': { endpoint: 'historical-price-full',  limit: 90   },
  '1y':  { endpoint: 'historical-price-full',  limit: 365  },
  '5y':  { endpoint: 'historical-price-full',  limit: 1825 },
};

const { endpoint, limit } = rangeMap[range] ?? rangeMap['1mo'];
const encodedSymbol = symbol.replace('^', '%5E');
const url = `${FMP}/${endpoint}/${encodedSymbol}?apikey=${API_KEY}`;
const r = await fetch(url);
const d = await r.json();

let candles = [];
if (endpoint === 'historical-price-full') {
  candles = (d.historical ?? []).slice(0, limit).reverse();
} else {
  candles = (Array.isArray(d) ? d : []).slice(0, limit).reverse();
}

const timestamps = candles.map(c => Math.floor(new Date(c.date).getTime() / 1000));
const closes     = candles.map(c => c.close);

res.json({
  chart: {
    result: [{
      timestamp:  timestamps,
      timestamps: timestamps,
      indicators: { quote: [{ close: closes }] }
    }]
  }
});
```

} catch (err) {
console.error(‘Chart error:’, err.message);
res.status(500).json({ error: err.message });
}
});

// GET /api/sectors
app.get(’/api/sectors’, async (req, res) => {
try {
const r = await fetch(`${FMP}/sectors-performance?apikey=${API_KEY}`);
const d = await r.json();

```
const sectorMap = {
  'Technology':             'XLK',
  'Financial Services':     'XLF',
  'Healthcare':             'XLV',
  'Consumer Cyclical':      'XLY',
  'Industrials':            'XLI',
  'Energy':                 'XLE',
  'Utilities':              'XLU',
  'Real Estate':            'XLRE',
  'Basic Materials':        'XLB',
  'Communication Services': 'XLC',
  'Consumer Defensive':     'XLP',
};

const results = (d ?? []).map(s => ({
  symbol:                     sectorMap[s.sector] ?? s.sector,
  shortName:                  s.sector,
  regularMarketChangePercent: parseFloat(s.changesPercentage?.replace('%', '') ?? 0),
}));

res.json({ quoteResponse: { result: results } });
```

} catch (err) {
console.error(‘Sectors error:’, err.message);
res.status(500).json({ error: err.message });
}
});

// GET /api/movers
app.get(’/api/movers’, async (req, res) => {
try {
const [gainersRes, losersRes] = await Promise.all([
fetch(`${FMP}/stock_market/gainers?apikey=${API_KEY}`),
fetch(`${FMP}/stock_market/losers?apikey=${API_KEY}`),
]);

```
const gainersData = await gainersRes.json();
const losersData  = await losersRes.json();

const normalize = q => ({
  symbol:                     q.symbol,
  shortName:                  q.name,
  regularMarketPrice:         q.price,
  regularMarketChange:        q.change,
  regularMarketChangePercent: q.changesPercentage,
});

res.json({
  gainers: (gainersData ?? []).slice(0, 4).map(normalize),
  losers:  (losersData  ?? []).slice(0, 4).map(normalize),
});
```

} catch (err) {
console.error(‘Movers error:’, err.message);
res.status(500).json({ error: err.message });
}
});

app.listen(PORT, () => {
console.log(`\n✅  Market Metrics server running at http://localhost:${PORT}\n`);
});
