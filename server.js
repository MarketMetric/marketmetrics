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
var r = await fetch(url);
var d = await r.json();
if (d && d[0]) { results.push(d[0]); }
}
res.json({ quoteResponse: { result: results } });
} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.get(’/api/market-summary’, async function(req, res) {
try {
var symbols = [’^GSPC’,’^DJI’,’^IXIC’,’^VIX’,‘DX-Y.NYB’];
var fmpSym  = [’%5EGSPC’,’%5EDJI’,’%5EIXIC’,’%5EVIX’,‘DX-Y.NYB’];
var results = [];
for (var i = 0; i < fmpSym.length; i++) {
try {
var url = FMP_BASE + ‘/quote/’ + fmpSym[i] + ‘?apikey=’ + API_KEY;
var r = await fetch(url);
var d = await r.json();
if (d && d[0]) {
var q = d[0];
results.push({
symbol: symbols[i],
shortName: q.name,
regularMarketPrice: q.price,
regularMarketChange: q.change,
regularMarketChangePercent: q.changesPercentage,
fiftyTwoWeekHigh: q.yearHigh,
fiftyTwoWeekLow: q.yearLow,
trailingPE: q.pe,
marketCap: q.marketCap,
averageDailyVolume3Month: q.avgVolume,
dividendYield: q.dividendYield
});
}
} catch(e) {}
}
res.json({ quoteResponse: { result: results } });
} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.get(’/api/chart’, async function(req, res) {
try {
var symbol = req.query.symbol || ‘%5EGSPC’;
var range = req.query.range || ‘1mo’;
var endpoint = ‘historical-price-full’;
var limit = 30;
if (range === ‘1d’) { endpoint = ‘historical-chart/5min’; limit = 78; }
else if (range === ‘5d’)  { endpoint = ‘historical-chart/15min’; limit = 130; }
else if (range === ‘3mo’) { limit = 90; }
else if (range === ‘1y’)  { limit = 365; }
else if (range === ‘5y’)  { limit = 1825; }
var enc = symbol.replace(’^’, ‘%5E’);
var url = FMP_BASE + ‘/’ + endpoint + ‘/’ + enc + ‘?apikey=’ + API_KEY;
var r = await fetch(url);
var d = await r.json();
var candles = [];
if (endpoint === ‘historical-price-full’) {
candles = (d.historical || []).slice(0, limit).reverse();
} else {
candles = (Array.isArray(d) ? d : []).slice(0, limit).reverse();
}
var ts = [];
var cl = [];
for (var i = 0; i < candles.length; i++) {
ts.push(Math.floor(new Date(candles[i].date).getTime() / 1000));
cl.push(candles[i].close);
}
res.json({ chart: { result: [{ timestamp: ts, timestamps: ts, indicators: { quote: [{ close: cl }] } }] } });
} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.get(’/api/sectors’, async function(req, res) {
try {
var url = FMP_BASE + ‘/sectors-performance?apikey=’ + API_KEY;
var r = await fetch(url);
var d = await r.json();
var map = { ‘Technology’:‘XLK’,‘Financial Services’:‘XLF’,‘Healthcare’:‘XLV’,‘Consumer Cyclical’:‘XLY’,‘Industrials’:‘XLI’,‘Energy’:‘XLE’,‘Utilities’:‘XLU’,‘Real Estate’:‘XLRE’,‘Basic Materials’:‘XLB’,‘Communication Services’:‘XLC’,‘Consumer Defensive’:‘XLP’ };
var results = [];
var list = d || [];
for (var i = 0; i < list.length; i++) {
var s = list[i];
var pct = parseFloat((s.changesPercentage || ‘0’).replace(’%’,’’));
results.push({ symbol: map[s.sector] || s.sector, shortName: s.sector, regularMarketChangePercent: pct });
}
res.json({ quoteResponse: { result: results } });
} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.get(’/api/movers’, async function(req, res) {
try {
var gr = await fetch(FMP_BASE + ‘/stock_market/gainers?apikey=’ + API_KEY);
var lr = await fetch(FMP_BASE + ‘/stock_market/losers?apikey=’ + API_KEY);
var gd = await gr.json();
var ld = await lr.json();
var gainers = [];
var losers = [];
var gl = gd || [];
var ll = ld || [];
for (var i = 0; i < Math.min(gl.length,4); i++) {
var g = gl[i];
gainers.push({ symbol: g.symbol, shortName: g.name, regularMarketPrice: g.price, regularMarketChange: g.change, regularMarketChangePercent: g.changesPercentage });
}
for (var j = 0; j < Math.min(ll.length,4); j++) {
var l = ll[j];
losers.push({ symbol: l.symbol, shortName: l.name, regularMarketPrice: l.price, regularMarketChange: l.change, regularMarketChangePercent: l.changesPercentage });
}
res.json({ gainers: gainers, losers: losers });
} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.listen(PORT, function() {
console.log(‘Market Metrics running at http://localhost:’ + PORT);
});
