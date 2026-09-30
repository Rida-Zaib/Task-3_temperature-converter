// Tapish - temperature converter + live weather (vanilla JavaScript, Open-Meteo API, no key needed)

const SYMBOLS = { C: '°C', F: '°F', K: 'K' };
const DEFAULT_PLACE = { label: 'Lahore, Pakistan', lat: 31.5497, lon: 74.3436 }; // change to any city
const root = document.documentElement;
const $ = (id) => document.getElementById(id);

/* ---------- Conversion helpers (everything goes through Celsius) ---------- */
function toCelsius(v, u) { return u === 'F' ? (v - 32) * 5 / 9 : u === 'K' ? v - 273.15 : v; }
function fromCelsius(c, u) { return u === 'F' ? c * 9 / 5 + 32 : u === 'K' ? c + 273.15 : c; }
function isBelowAbsoluteZero(c) { return c < -273.15 - 1e-9; }
function formatValue(n, u) {
  let r = Math.round(n * 100) / 100;
  if (Object.is(r, -0)) r = 0;
  return r.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ' + SYMBOLS[u];
}

/* ---------- Mood: page colour + ruler follow the latest temperature ---------- */
function tempHue(c) { return Math.round(215 - Math.min(Math.max((c + 15) / 60, 0), 1) * 210); }
function tempColor(c) { return 'hsl(' + tempHue(c) + ' 80% 48%)'; }
function setMood(c) {
  root.style.setProperty('--hue', tempHue(c));
  root.style.setProperty('--pos', Math.min(Math.max((c + 20) / 70, 0), 1) * 100 + '%');
  $('ruler-label').textContent = Math.round(c) + ' °C';
}

/* ---------- Converter ---------- */
const form = $('converter-form');
const input = $('temp-input');
const unitSelect = $('unit-select');
const errorMsg = $('error-msg');
const NUMBER_PATTERN = /^[-+]?(\d+\.?\d*|\.\d+)$/;
const PARTIAL_PATTERN = /^[-+]?\d*\.?\d*$/;

function showError(msg) { errorMsg.textContent = msg; errorMsg.hidden = false; input.classList.add('invalid'); input.setAttribute('aria-invalid', 'true'); }
function clearError() { errorMsg.hidden = true; input.classList.remove('invalid'); input.removeAttribute('aria-invalid'); }
function hideResults() { $('result-list').hidden = true; $('empty-state').hidden = false; }

input.addEventListener('input', () => {
  const t = input.value.trim();
  if (t === '' || PARTIAL_PATTERN.test(t)) clearError();
  else showError('Please enter numbers only, for example 25 or -4.5.');
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const t = input.value.trim();
  if (t === '') { showError('Enter a temperature to convert.'); hideResults(); return; }
  if (!NUMBER_PATTERN.test(t)) { showError('"' + t + '" is not a valid number. Use digits only, for example 25 or -4.5.'); hideResults(); return; }
  const unit = unitSelect.value;
  const c = toCelsius(parseFloat(t), unit);
  if (isBelowAbsoluteZero(c)) {
    showError('That is below absolute zero (-273.15 °C, -459.67 °F or 0 K). Nothing can get colder, so enter a higher value.');
    hideResults(); return;
  }
  clearError();
  ['C', 'F', 'K'].forEach((u) => {
    $('out-' + u).textContent = formatValue(fromCelsius(c, u), u);
    document.querySelector('#result-list [data-unit="' + u + '"]').classList.toggle('source', u === unit);
  });
  $('empty-state').hidden = true;
  $('result-list').hidden = false;
  setMood(c);
});

/* ---------- Live weather ---------- */
const WEATHER = { 0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Freezing fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers',
  85: 'Snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail' };

const state = { unit: 'C', cur: null, hours: [], days: [] };
const statusEl = $('weather-status');
const fmtHour = (t) => { const h = +t.slice(11, 13); return (h % 12 || 12) + (h < 12 ? ' AM' : ' PM'); };
const fmtClock = (t) => { const h = +t.slice(11, 13); return (h % 12 || 12) + t.slice(13, 16) + (h < 12 ? ' AM' : ' PM'); };
const fmtDay = (t) => new Date(t.slice(0, 10) + 'T00:00').toLocaleDateString('en-US', { weekday: 'short' });

function setStatus(msg, bad) { statusEl.textContent = msg; statusEl.classList.toggle('bad', !!bad); statusEl.hidden = !msg; }

async function getJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally { clearTimeout(timer); }
}

async function loadWeather(lat, lon, label) {
  setStatus('Loading live weather...');
  document.querySelectorAll('#city-form button').forEach((b) => (b.disabled = true));
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code' +
      '&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto';
    const d = await getJson(url);
    const c = d.current;
    const start = Math.max(0, d.hourly.time.findIndex((t) => t.slice(0, 13) >= c.time.slice(0, 13)));
    state.cur = { label, time: c.time, c: c.temperature_2m, feels: c.apparent_temperature, humidity: c.relative_humidity_2m, wind: c.wind_speed_10m, code: c.weather_code };
    state.hours = d.hourly.time.slice(start, start + 24).map((t, i) => ({ time: t, c: d.hourly.temperature_2m[start + i] })).filter((h) => Number.isFinite(h.c));
    state.days = d.daily.time.map((t, i) => ({ time: t, max: d.daily.temperature_2m_max[i], min: d.daily.temperature_2m_min[i] }));
    setStatus('');
    $('weather-body').hidden = false;
    render();
    setMood(state.cur.c);
  } catch (err) {
    setStatus('Could not load live weather. Check your internet connection and try again.', true);
  } finally {
    document.querySelectorAll('#city-form button').forEach((b) => (b.disabled = false));
  }
}

async function searchCity(name) {
  setStatus('Searching for "' + name + '"...');
  try {
    const g = await getJson('https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=' + encodeURIComponent(name));
    if (!g.results || !g.results.length) { setStatus('No city found for "' + name + '". Check the spelling and try again.', true); return; }
    const r = g.results[0];
    loadWeather(r.latitude, r.longitude, r.name + (r.country ? ', ' + r.country : ''));
  } catch (err) {
    setStatus('Could not search right now. Check your internet connection and try again.', true);
  }
}

$('city-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('city-input').value.trim();
  if (!name) { setStatus('Type a city name to search.', true); return; }
  searchCity(name);
});

$('geo-btn').addEventListener('click', () => {
  if (!navigator.geolocation) { setStatus('Your browser does not support location. Search for a city instead.', true); return; }
  setStatus('Finding your location...');
  navigator.geolocation.getCurrentPosition(
    (p) => loadWeather(p.coords.latitude.toFixed(4), p.coords.longitude.toFixed(4), 'Your location'),
    () => setStatus('Could not get your location. Allow location access or search for a city instead.', true),
    { timeout: 10000 }
  );
});

document.querySelectorAll('.unit-toggle button').forEach((b) => b.addEventListener('click', () => {
  state.unit = b.dataset.unit;
  if (state.cur) render();
}));

$('use-live').addEventListener('click', () => {
  input.value = String(Math.round(state.cur.c * 10) / 10);
  unitSelect.value = 'C';
  form.requestSubmit();
  form.scrollIntoView({ block: 'center' });
});

function render() {
  const u = state.unit, cur = state.cur;
  $('place-name').textContent = cur.label;
  $('local-time').textContent = fmtDay(cur.time) + ', ' + fmtClock(cur.time) + ' local time';
  $('temp-big').textContent = formatValue(fromCelsius(cur.c, u), u);
  $('weather-desc').textContent = WEATHER[cur.code] || 'Current conditions';
  $('stat-feels').textContent = formatValue(fromCelsius(cur.feels, u), u);
  $('stat-humidity').textContent = cur.humidity + '%';
  $('stat-wind').textContent = Math.round(cur.wind) + ' km/h';
  document.querySelectorAll('.unit-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.unit === u)));
  drawHourly();
  drawDaily();
}

/* ---------- Charts (hand-drawn SVG, no libraries) ---------- */
function drawHourly() {
  const u = state.unit, hours = state.hours, n = hours.length;
  if (n < 2) { $('hourly-chart').textContent = 'No hourly data available.'; return; }
  const W = 640, H = 240, L = 40, R = 14, T = 16, B = 30;
  const vals = hours.map((h) => fromCelsius(h.c, u));
  const lo = Math.floor(Math.min(...vals)) - 1, hi = Math.ceil(Math.max(...vals)) + 1;
  const step = (W - L - R) / (n - 1);
  const X = (i) => L + i * step, Y = (v) => T + (hi - v) * (H - T - B) / (hi - lo);
  const line = vals.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
  const color = tempColor(hours.reduce((s, h) => s + h.c, 0) / n);
  let grid = '', xl = '';
  for (let k = 0; k <= 3; k++) {
    const v = lo + (hi - lo) * k / 3, y = Y(v).toFixed(1);
    grid += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="#d3e0e5"/><text x="' + (L - 6) + '" y="' + (+y + 4) + '" text-anchor="end">' + Math.round(v) + '</text>';
  }
  hours.forEach((h, i) => { if (i % 4 === 0) xl += '<text x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + fmtHour(h.time) + '</text>'; });
  const wrap = $('hourly-chart');
  wrap.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Line chart of the temperature for the next 24 hours">' +
    '<defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity="0.45"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
    grid + xl +
    '<path d="' + line + ' L' + X(n - 1) + ' ' + (H - B) + ' L' + X(0) + ' ' + (H - B) + ' Z" fill="url(#hg)"/>' +
    '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<circle cx="' + X(0) + '" cy="' + Y(vals[0]).toFixed(1) + '" r="5" fill="' + color + '" stroke="#fff" stroke-width="2"/>' +
    '<line id="hx" y1="' + T + '" y2="' + (H - B) + '" stroke="#12303b" stroke-opacity="0.35" visibility="hidden"/>' +
    '<circle id="hd" r="6" fill="#12303b" stroke="#fff" stroke-width="2" visibility="hidden"/></svg><div class="tip" hidden></div>';
  const svg = wrap.querySelector('svg'), tip = wrap.querySelector('.tip'), hx = svg.querySelector('#hx'), hd = svg.querySelector('#hd');
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width * W - L) / step)));
    hx.setAttribute('x1', X(i)); hx.setAttribute('x2', X(i)); hd.setAttribute('cx', X(i)); hd.setAttribute('cy', Y(vals[i]));
    hx.setAttribute('visibility', 'visible'); hd.setAttribute('visibility', 'visible');
    tip.textContent = fmtDay(hours[i].time) + ' ' + fmtHour(hours[i].time) + ': ' + Math.round(vals[i] * 10) / 10 + ' ' + SYMBOLS[u];
    tip.style.left = X(i) / W * 100 + '%'; tip.style.top = Y(vals[i]) / H * 100 + '%'; tip.hidden = false;
  });
  svg.addEventListener('pointerleave', () => { hx.setAttribute('visibility', 'hidden'); hd.setAttribute('visibility', 'hidden'); tip.hidden = true; });
}

function drawDaily() {
  const u = state.unit, days = state.days;
  if (!days.length) { $('daily-chart').textContent = 'No daily data available.'; return; }
  const W = 640, H = 250, T = 34, B = 46, colW = W / days.length;
  const lo = Math.floor(Math.min(...days.map((d) => fromCelsius(d.min, u)))) - 2;
  const hi = Math.ceil(Math.max(...days.map((d) => fromCelsius(d.max, u)))) + 2;
  const Y = (v) => T + (hi - v) * (H - T - B) / (hi - lo);
  let defs = '', bars = '';
  days.forEach((d, i) => {
    const mx = fromCelsius(d.max, u), mn = fromCelsius(d.min, u), cx = colW * (i + 0.5);
    const y1 = Y(mx), y2 = Math.max(Y(mn), y1 + 10);
    defs += '<linearGradient id="dg' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + tempColor(d.max) + '"/><stop offset="1" stop-color="' + tempColor(d.min) + '"/></linearGradient>';
    bars += '<rect x="' + (cx - 13) + '" y="' + y1.toFixed(1) + '" width="26" height="' + (y2 - y1).toFixed(1) + '" rx="13" fill="url(#dg' + i + ')"/>' +
      '<text class="strong" x="' + cx + '" y="' + (y1 - 8).toFixed(1) + '" text-anchor="middle">' + Math.round(mx) + '°</text>' +
      '<text x="' + cx + '" y="' + (y2 + 16).toFixed(1) + '" text-anchor="middle">' + Math.round(mn) + '°</text>' +
      '<text class="strong" x="' + cx + '" y="' + (H - 12) + '" text-anchor="middle">' + (i === 0 ? 'Today' : fmtDay(d.time)) + '</text>';
  });
  $('daily-chart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Range chart of the daily high and low temperature for the next 7 days"><defs>' + defs + '</defs>' + bars + '</svg>';
}

/* ---------- Start ---------- */
$('year').textContent = new Date().getFullYear();
loadWeather(DEFAULT_PLACE.lat, DEFAULT_PLACE.lon, DEFAULT_PLACE.label);
