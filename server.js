const express = require(‘express’);
const fetch = require(‘node-fetch’);
const cors = require(‘cors’);
const path = require(‘path’);

const app = express();
const PORT = 3000;
const API_KEY = ‘vxyAviWMbyvAMVQ3UHECsPKM9KGZz4fj’;
const FMP_BASE = ‘https://financialmodelingprep.com/api/v3’;

app.use(cors());
app.use(express.static(path.join(__dirname, ‘public’)));

app.get(’/api/quote’, async function(req, res) {
try {
var symbolList = (req.query.symbols || ‘AAPL’).split(’,’);
var results = [];
for (var i = 0; i < symbolList.length; i++) {
var sym = symbolList[i].trim();
var url = FMP_BASE + ‘/quote/’ + sym + ‘?apikey=’ + API_KEY;
var response = await fetch(url);
var data = await response.json();
if (data && data[0]) {
results.push(data[0]);
}
}
res.json({ quoteResponse: { result: results } });
} catch (err) {
console.error(‘Quote error:’, err.message);
res.status(500).json({ error: err.message });
}
});

app.get(’/api/market-summary’, async function(req, res) {
try {
var symbols    = [’^GSPC’, ‘^DJI’, ‘^IXIC’, ‘^VIX’, ‘DX-Y.NYB’];
var fmpSymbols = [’%5EGSPC’, ‘%5EDJI’, ‘%5EIXIC’, ‘%5EVIX’, ‘DX-Y.NYB’];
var results = [];
for (var i = 0; i < fmpSymbols.length; i++) {
try {
var url = FMP_BASE + ‘/quote/’ + fmpSymbols[i] + ‘?apikey=’ + API_KEY;
var response = await fetch(url);
var data = await response.json();
if (data && data[0]) {
var q = data[0];
results.push({
symbol:                     symbols[i],
shortName:                  q.name,
regularMarketPrice:         q.price,
regularMarketChange:        q.change,
regularMarketChangePercent: q.changesPercentage,
fiftyTwoWeekHigh:           q.yearHigh,
fiftyTwoWeekLow:            q.yearLow,
trailingPE:                 q.pe,
marketCap:                  q.marketCap,
averageDailyVolume3Month:   q.avgVolume,
dividendYield:              q.dividendYield
});
}
} catch (innerErr) {
console.error(’Error fetching ’ + fmpSymbols[i], innerErr.message);
}
}
res.json({ quoteResponse: { result: results } });
} catch (err) {
console.error(‘Market summary error:’, err.message);
res.status(500).json({ error: err.message });
}
});

app.get(’/api/chart’, async function(req, res) {
try {
var symbol = req.query.symbol || ‘%5EGSPC’;
var range  = req.query.range  || ‘1mo’;
var endpoint = ‘historical-price-full’;
var limit    = 30;
if (range === ‘1d’) { endpoint = ‘historical-chart/5min’; limit = 78; }
else if (range === ‘5d’)  { endpoint = ‘historical-chart/15min’; limit = 130; }
else if (range === ‘1mo’) { endpoint = ‘historical-price-full’;  limit = 30;  }
else if (range === ‘3mo’) { endpoint = ‘historical-price-full’;  limit = 90;  }
else if (range === ‘1y’)  { endpoint = ‘historical-price-full’;  limit = 365; }
else if (range === ‘5y’)  { endpoint = ‘historical-price-full’;  limit = 1825;}
var encodedSymbol = symbol.replace(’^’, ‘%5E’);
var url = FMP_BASE + ‘/’ + endpoint + ‘/’ + encodedSymbol + ‘?apikey=’ + API_KEY;
var response = await fetch(url);
var data = await response.json();
var candles = [];
if (endpoint === ‘historical-price-full’) {
var historical = data.historical || [];
candles = historical.slice(0, limit).reverse();
} else {
var arr = Array.isArray(data) ? data : [];
candles = arr.slice(0, limit).reverse();
}
var timestamps = [];
var closes = [];
for (var i = 0; i < candles.length; i++) {
timestamps.push(Math.floor(new Date(candles[i].date).getTime() / 1000));
closes.push(candles[i].close);
}
res.json({ chart: { result: [{ timestamp: timestamps, timestamps: timestamps, indicators: { quote: [{ close: closes }] } }] } });
} catch (err) {
console.error(‘Chart error:’, err.message);
res.status(500).json({ error: err.message });
}
});

app.get(’/api/sectors’, async function(req, res) {
try {
var url = FMP_BASE + ‘/sectors-performance?apikey=’ + API_KEY;
var response = await fetch(url);
var data = await response.json();
var sectorMap = {
‘Technology’: ‘XLK’, ‘Financial Services’: ‘XLF’, ‘Healthcare’: ‘XLV’,
‘Consumer Cyclical’: ‘XLY’, ‘Industrials’: ‘XLI’, ‘Energy’: ‘XLE’,
‘Utilities’: ‘XLU’, ‘Real Estate’: ‘XLRE’, ‘Basic Materials’: ‘XLB’,
‘Communication Services’: ‘XLC’, ‘Consumer Defensive’: ‘XLP’
};
var results = [];
var list = data || [];
for (var i = 0; i < list.length; i++) {
var s = list[i];
var pct = parseFloat((s.changesPercentage || ‘0’).replace(’%’, ‘’));
results.push({ symbol: sectorMap[s.sector] || s.sector, shortName: s.sector, regularMarketChangePercent: pct });
}
res.json({ quoteResponse: { result: results } });
} catch (err) {
console.error(‘Sectors error:’, err.message);
res.status(500).json({ error: err.message });
}
});

app.get(’/api/movers’, async function(req, res) {
try {
var gainersRes = await fetch(FMP_BASE + ‘/stock_market/gainers?apikey=’ + API_KEY);
var losersRes  = await fetch(FMP_BASE + ‘/stock_market/losers?apikey=’  + API_KEY);
var gainersData = await gainersRes.json();
var losersData  = await losersRes.json();
var gainers = [];
var losers  = [];
var gList = gainersData || [];
var lList = losersData  || [];
for (var i = 0; i < Math.min(gList.length, 4); i++) {
var g = gList[i];
gainers.push({ symbol: g.symbol, shortName: g.name, regularMarketPrice: g.price, regularMarketChange: g.change, regularMarketChangePercent: g.changesPercentage });
}
for (var j = 0; j < Math.min(lList.length, 4); j++) {
var l = lList[j];
losers.push({ symbol: l.symbol, shortName: l.name, regularMarketPrice: l.price, regularMarketChange: l.change, regularMarketChangePercent: l.changesPercentage });
}
res.json({ gainers: gainers, losers: losers });
} catch (err) {
console.error(‘Movers error:’, err.message);
res.status(500).json({ error: err.message });
}
});

app.listen(PORT, function() {
console.log(’\n✅  Market Metrics server running at http://localhost:’ + PORT + ‘\n’);
});
