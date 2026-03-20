// ===== MAP SETUP =====
const NI_CENTER = [54.6, -7.0];
const NI_BOUNDS = [[53.9, -8.3], [55.45, -5.3]];

const map = L.map('map', {
  center: NI_CENTER, zoom: 8, minZoom: 7, maxZoom: 15,
  maxBounds: [[53.5, -9.0], [55.8, -4.5]],
  maxBoundsViscosity: 1.0, zoomControl: true, attributionControl: true
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  subdomains: 'abcd', maxZoom: 19
}).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd', maxZoom: 19, pane: 'overlayPane'
}).addTo(map);

// ===== STATE =====
let currentView = 'districts';
let currentLGD = null;
let lgdLayer = null;
let wardsLayer = null;
let compareMode = false;
let compareSelections = [];
let currentChoropleth = 'none';

// ===== STATS LOOKUP =====
const districtStats = STATS_DATA.districts;

function getDistrictKey(name) {
  return Object.keys(districtStats).find(k => districtStats[k].name === name);
}

function getDistrictData(name) {
  const key = getDistrictKey(name);
  return key ? districtStats[key] : null;
}

// ===== FORMATTING =====
function fmt(n) {
  if (n == null) return '—';
  return typeof n === 'number' ? n.toLocaleString() : n;
}

function fmtPct(n) {
  if (n == null) return '—';
  return n.toFixed(1) + '%';
}

function fmtMoney(n) {
  if (n == null) return '—';
  return '£' + n.toLocaleString();
}

// ===== CHOROPLETH =====
const CHOROPLETH_CONFIGS = {
  population_density: { label: 'Population Density (per km²)', key: d => d.population_density_per_sq_km, wardKey: w => w ? w.population : null, min: 40, max: 2600, wardMin: 500, wardMax: 12000, color: [20, 100, 160] },
  deprivation: { label: '% SOAs in Top 100 Deprived', key: d => d.nimdm_pct_in_top100, wardKey: w => w ? (462 - w.deprivation_rank) / 462 * 100 : null, min: 0, max: 30, wardMin: 0, wardMax: 100, color: [180, 40, 40] },
  median_income: { label: 'Median Annual Earnings (£)', key: d => d.median_annual_earnings_residence, wardKey: null, min: 27000, max: 35000, color: [30, 130, 76] },
  house_price: { label: 'Median House Price (£)', key: d => d.housing ? d.housing.median_house_price : null, wardKey: null, min: 120000, max: 210000, color: [140, 80, 30] },
  crime_rate: { label: 'Crime Rate per 1,000', key: d => d.crime ? d.crime.rate_per_1000 : null, wardKey: null, min: 20, max: 80, color: [160, 30, 30] },
  degree_pct: { label: '% Degree-Educated', key: d => d.education ? d.education.degree_plus_pct : null, wardKey: w => w ? w.level_4_plus_pct : null, min: 18, max: 40, wardMin: 5, wardMax: 65, color: [30, 80, 160] },
  no_car_pct: { label: '% Households No Car', key: d => d.transport ? d.transport.no_car_pct : null, wardKey: w => w ? w.no_cars_pct : null, min: 10, max: 40, wardMin: 0, wardMax: 60, color: [100, 60, 140] },
  catholic_pct: { label: '% Catholic Background', key: d => d.demographics ? d.demographics.catholic_pct : null, wardKey: w => w ? w.catholic_pct : null, min: 8, max: 75, wardMin: 0, wardMax: 100, color: [40, 120, 60] },
  protestant_pct: { label: '% Protestant / Other Christian', key: d => d.demographics ? d.demographics.protestant_other_christian_pct : null, wardKey: w => w ? w.protestant_other_christian_pct : null, min: 20, max: 75, wardMin: 0, wardMax: 100, color: [50, 80, 150] }
};

function getChoroplethColor(val, config) {
  if (val == null) return '#333';
  const t = Math.max(0, Math.min(1, (val - config.min) / (config.max - config.min)));
  const [r, g, b] = config.color;
  const base = 0.15;
  const intensity = base + t * (1 - base);
  return `rgb(${Math.round(r * intensity)}, ${Math.round(g * intensity)}, ${Math.round(b * intensity)})`;
}

function updateChoropleth() {
  currentChoropleth = document.getElementById('choropleth-select').value;
  const legend = document.getElementById('legend');

  if (currentChoropleth === 'none') {
    legend.style.display = 'none';
    if (lgdLayer && currentView === 'districts') lgdLayer.setStyle(lgdDefaultStyle);
    if (wardsLayer && currentView === 'wards') wardsLayer.setStyle(wardStyle);
    return;
  }

  const config = CHOROPLETH_CONFIGS[currentChoropleth];
  if (!config) return;

  // Update legend
  legend.style.display = 'block';
  document.getElementById('legend-title').textContent = config.label;
  const [r, g, b] = config.color;
  document.getElementById('legend-bar').style.background =
    `linear-gradient(to right, rgb(${Math.round(r*0.15)},${Math.round(g*0.15)},${Math.round(b*0.15)}), rgb(${r},${g},${b}))`;

  const isMoney = currentChoropleth === 'median_income' || currentChoropleth === 'house_price';
  document.getElementById('legend-min').textContent = isMoney ? '£' + config.min.toLocaleString() : config.min.toLocaleString();
  document.getElementById('legend-max').textContent = isMoney ? '£' + config.max.toLocaleString() : config.max.toLocaleString();

  // Update layer styles
  if (lgdLayer && currentView === 'districts') {
    lgdLayer.eachLayer(layer => {
      const name = layer.feature.properties.name;
      const d = getDistrictData(name);
      const val = d ? config.key(d) : null;
      layer.setStyle({
        fillColor: getChoroplethColor(val, config),
        fillOpacity: 0.75,
        color: '#555',
        weight: 1.5
      });
    });
  }

  // Update ward layer styles if in ward view
  if (wardsLayer && currentView === 'wards') {
    if (config.wardKey) {
      const min = config.wardMin != null ? config.wardMin : config.min;
      const max = config.wardMax != null ? config.wardMax : config.max;
      wardsLayer.eachLayer(layer => {
        const w = getWardData(layer.feature.properties.name, layer.feature.properties.lgd);
        const val = config.wardKey(w);
        layer.setStyle({
          fillColor: getChoroplethColor(val, { min, max, color: config.color }),
          fillOpacity: 0.75, color: '#555', weight: 1
        });
      });
    } else {
      wardsLayer.setStyle(wardStyle);
    }
  }
}

// ===== STYLES =====
const lgdDefaultStyle = {
  color: '#555', weight: 1.5, fillColor: '#333', fillOpacity: 0.6
};
const lgdHoverStyle = {
  color: '#888', weight: 2.5, fillColor: '#444', fillOpacity: 0.7
};
const wardStyle = {
  color: '#555', weight: 1, fillColor: '#383838', fillOpacity: 0.5
};
const wardHoverStyle = {
  color: '#999', weight: 2, fillColor: '#4a4a4a', fillOpacity: 0.65
};

function getLgdStyle(feature) {
  if (currentChoropleth !== 'none') {
    const config = CHOROPLETH_CONFIGS[currentChoropleth];
    const d = getDistrictData(feature.properties.name);
    const val = d ? config.key(d) : null;
    return {
      fillColor: getChoroplethColor(val, config),
      fillOpacity: 0.75, color: '#555', weight: 1.5
    };
  }
  return lgdDefaultStyle;
}

// ===== LGD LAYER =====
function createLGDLayer() {
  lgdLayer = L.geoJSON(LGD_GEO, {
    style: getLgdStyle,
    onEachFeature: (feature, layer) => {
      layer.on({
        mouseover: (e) => {
          if (currentView !== 'districts') return;
          const name = feature.properties.name;
          const d = getDistrictData(name);
          if (currentChoropleth !== 'none' && d) {
            const config = CHOROPLETH_CONFIGS[currentChoropleth];
            const val = config.key(d);
            e.target.setStyle({ weight: 2.5, color: '#aaa', fillOpacity: 0.85 });
          } else {
            e.target.setStyle(lgdHoverStyle);
          }
          e.target.bringToFront();
        },
        mouseout: (e) => {
          if (currentView !== 'districts') return;
          lgdLayer.resetStyle(e.target);
        },
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          const name = feature.properties.name;
          if (compareMode) {
            addToComparison(name);
            return;
          }
          showDistrictStats(name);
          drillDown(name, e.target.getBounds());
        }
      });
    }
  }).addTo(map);
}

// ===== WARD LAYER =====
function getWardStyle(feature) {
  if (currentChoropleth !== 'none') {
    const config = CHOROPLETH_CONFIGS[currentChoropleth];
    if (config.wardKey) {
      const w = getWardData(feature.properties.name, feature.properties.lgd);
      const val = config.wardKey(w);
      const min = config.wardMin != null ? config.wardMin : config.min;
      const max = config.wardMax != null ? config.wardMax : config.max;
      return {
        fillColor: getChoroplethColor(val, { min, max, color: config.color }),
        fillOpacity: 0.75, color: '#555', weight: 1
      };
    }
  }
  return wardStyle;
}

function createWardsLayer(lgdName) {
  const filtered = {
    type: 'FeatureCollection',
    features: WARDS_GEO.features.filter(f => f.properties.lgd === lgdName)
  };

  wardsLayer = L.geoJSON(filtered, {
    style: getWardStyle,
    onEachFeature: (feature, layer) => {
      layer.on({
        mouseover: (e) => {
          if (currentChoropleth !== 'none') {
            e.target.setStyle({ weight: 2, color: '#aaa', fillOpacity: 0.85 });
          } else {
            e.target.setStyle(wardHoverStyle);
          }
          e.target.bringToFront();
        },
        mouseout: (e) => { wardsLayer.resetStyle(e.target); },
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          showWardStats(feature.properties.name, feature.properties.lgd);
        }
      });
    }
  }).addTo(map);
}

// ===== NAVIGATION =====
function drillDown(lgdName, bounds) {
  currentView = 'wards';
  currentLGD = lgdName;
  if (lgdLayer) map.removeLayer(lgdLayer);
  if (wardsLayer) map.removeLayer(wardsLayer);
  createWardsLayer(lgdName);
  map.flyToBounds(bounds, { padding: [40, 40], duration: 0.8 });
  document.getElementById('back-btn').classList.add('visible');
}

function zoomToNI() {
  currentView = 'districts';
  currentLGD = null;
  if (wardsLayer) map.removeLayer(wardsLayer);
  if (lgdLayer) map.removeLayer(lgdLayer);
  createLGDLayer();
  map.flyToBounds(NI_BOUNDS, { duration: 0.8 });
  document.getElementById('back-btn').classList.remove('visible');
  closePanel();
}

// ===== COMPARISON MODE =====
function toggleCompareMode() {
  compareMode = !compareMode;
  const btn = document.getElementById('compare-btn');
  const panel = document.getElementById('compare-panel');
  btn.classList.toggle('active', compareMode);
  if (compareMode) {
    compareSelections = [];
    panel.classList.add('visible');
    document.getElementById('compare-text').textContent = 'Click two districts to compare';
    document.getElementById('compare-areas').textContent = '';
    closePanel();
  } else {
    panel.classList.remove('visible');
    compareSelections = [];
  }
}

function clearComparison() {
  compareSelections = [];
  document.getElementById('compare-text').textContent = 'Click two districts to compare';
  document.getElementById('compare-areas').textContent = '';
  closePanel();
}

function addToComparison(name) {
  if (compareSelections.includes(name)) return;
  compareSelections.push(name);

  if (compareSelections.length === 1) {
    document.getElementById('compare-text').textContent = 'Now click a second district';
    document.getElementById('compare-areas').textContent = name;
  } else if (compareSelections.length === 2) {
    document.getElementById('compare-text').textContent = 'Comparing:';
    document.getElementById('compare-areas').textContent = compareSelections[0] + ' vs ' + compareSelections[1];
    showComparisonPanel(compareSelections[0], compareSelections[1]);
  }
}

// ===== PANEL =====
function closePanel() {
  document.getElementById('panel').classList.remove('open');
}

function openPanel(html) {
  document.getElementById('panel-content').innerHTML = html;
  document.getElementById('panel').classList.add('open');
  // Activate first tab
  const firstTab = document.querySelector('.tab-btn');
  if (firstTab) firstTab.click();
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById('tab-' + tabId).classList.add('active');
}

// ===== PARTY HELPERS =====
function getPartyClass(party) {
  const p = party.toLowerCase();
  if (p.includes('sinn') || p === 'sf') return 'party-sf';
  if (p.includes('dup')) return 'party-dup';
  if (p.includes('alliance')) return 'party-alliance';
  if (p.includes('uup')) return 'party-uup';
  if (p.includes('sdlp')) return 'party-sdlp';
  if (p.includes('tuv')) return 'party-tuv';
  if (p.includes('pbp') || p.includes('people before')) return 'party-pbp';
  if (p.includes('green')) return 'party-green';
  return 'party-other';
}

// ===== SVG DONUT =====
function makeDonutSVG(segments, size) {
  size = size || 90;
  const cx = size/2, cy = size/2, r = size*0.38, sw = size*0.18;
  let cumPct = 0;
  let paths = '';
  const circ = 2 * Math.PI * r;

  segments.forEach(seg => {
    const dashLen = (seg.pct / 100) * circ;
    const gap = circ - dashLen;
    const offset = -((cumPct / 100) * circ) + circ * 0.25;
    paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${sw}" stroke-dasharray="${dashLen} ${gap}" stroke-dashoffset="${offset}" />`;
    cumPct += seg.pct;
  });

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths}</svg>`;
}

// ===== BAR BUILDER =====
function makeBarChart(items, maxOverride) {
  const maxVal = maxOverride || Math.max(...items.map(i => i.value));
  return items.map(i => {
    const w = maxVal > 0 ? (i.value / maxVal * 100).toFixed(1) : 0;
    const cls = i.class || '';
    const bg = i.color ? `background:${i.color}` : '';
    return `<div class="bar-row">
      <div class="bar-label">${i.label}</div>
      <div class="bar-track"><div class="bar-fill ${cls}" style="width:${w}%;${bg}"></div></div>
      <div class="bar-value">${i.display || fmtPct(i.value)}</div>
    </div>`;
  }).join('');
}

// ===== STACKED BAR =====
function makeStackedBar(segments) {
  let bar = '<div class="h-bar-container">';
  segments.forEach(s => {
    bar += `<div class="h-bar-segment" style="width:${s.pct}%;background:${s.color}" title="${s.label}: ${s.pct}%"></div>`;
  });
  bar += '</div><div class="h-bar-legend">';
  segments.forEach(s => {
    bar += `<div class="h-bar-legend-item"><div class="h-bar-legend-dot" style="background:${s.color}"></div>${s.label}: ${fmtPct(s.pct)}</div>`;
  });
  bar += '</div>';
  return bar;
}

// ===== DISTRICT STATS (TABBED) =====
function showDistrictStats(name) {
  const key = getDistrictKey(name);
  if (!key) { openPanel('<div class="panel-header"><h2>' + name + '</h2></div><div class="stat-section"><p>No data available.</p></div>'); return; }
  const d = districtStats[key];

  const html = `
    <div class="panel-header">
      <div class="panel-type">Local Government District</div>
      <h2>${d.name}</h2>
    </div>
    <div class="tab-bar">
      <button class="tab-btn active" data-tab="overview" onclick="switchTab('overview')">Overview</button>
      <button class="tab-btn" data-tab="demographics" onclick="switchTab('demographics')">Demographics</button>
      <button class="tab-btn" data-tab="housing" onclick="switchTab('housing')">Housing</button>
      <button class="tab-btn" data-tab="health" onclick="switchTab('health')">Health</button>
      <button class="tab-btn" data-tab="crime" onclick="switchTab('crime')">Crime</button>
      <button class="tab-btn" data-tab="education" onclick="switchTab('education')">Education</button>
      <button class="tab-btn" data-tab="transport" onclick="switchTab('transport')">Transport</button>
    </div>
    <div id="tab-overview" class="tab-content active">${buildOverviewTab(d)}</div>
    <div id="tab-demographics" class="tab-content">${buildDemographicsTab(d)}</div>
    <div id="tab-housing" class="tab-content">${buildHousingTab(d)}</div>
    <div id="tab-health" class="tab-content">${buildHealthTab(d)}</div>
    <div id="tab-crime" class="tab-content">${buildCrimeTab(d)}</div>
    <div id="tab-education" class="tab-content">${buildEducationTab(d)}</div>
    <div id="tab-transport" class="tab-content">${buildTransportTab(d)}</div>
    <div class="panel-footer">
      Source: NISRA Census 2021, NIMDM 2017, NISRA Health Inequalities 2024, ASHE 2024, NI Electoral Office 2022, PSNI, LPS, Ofcom.
    </div>
  `;
  openPanel(html);
}

// ===== TAB BUILDERS =====
function buildOverviewTab(d) {
  // Population cards
  const popChange = d.demographics ? d.demographics.population_change_pct : null;
  const changeHtml = popChange != null
    ? `<div class="change-indicator"><span class="change-arrow ${popChange >= 0 ? 'up' : 'down'}">${popChange >= 0 ? '▲' : '▼'}</span> ${Math.abs(popChange).toFixed(1)}% since 2011</div>`
    : '';

  // Age donut
  const ageSvg = makeDonutSVG([
    { pct: d.age_0_15_pct, color: '#4a7c8a', label: '0–15' },
    { pct: d.age_16_64_pct, color: '#2980b9', label: '16–64' },
    { pct: d.age_65_plus_pct, color: '#7fb3d3', label: '65+' }
  ]);

  // Election bars
  let electionBars = '';
  if (d.assembly_2022 && d.assembly_2022.top_parties) {
    electionBars = makeBarChart(d.assembly_2022.top_parties.map(p => ({
      label: p.party, value: p.approx_vote_share, class: getPartyClass(p.party),
      display: p.approx_vote_share.toFixed(1) + '%'
    })));
  }

  // Deprivation
  const depPct = d.nimdm_pct_in_top100 || 0;
  const depMarkerPos = Math.min(depPct * 2, 100);

  return `
    <div class="stat-section">
      <h3>Population</h3>
      <div class="stat-cards">
        <div class="stat-card"><div class="card-value">${fmt(d.population)}</div><div class="card-label">People</div></div>
        <div class="stat-card"><div class="card-value">${d.population_density_per_sq_km}</div><div class="card-label">per km²</div></div>
      </div>
      ${changeHtml ? `<div style="text-align:center;font-size:12px;color:#aaa;margin-top:4px">${changeHtml}</div>` : ''}
      <div class="stat-row"><span class="stat-label">Area</span><span class="stat-value">${fmt(d.area_sq_km)} km²</span></div>
    </div>
    <div class="stat-section">
      <h3>Age Breakdown</h3>
      <div class="donut-container">
        ${ageSvg}
        <div class="donut-legend">
          <div class="donut-legend-item"><div class="donut-legend-dot" style="background:#4a7c8a"></div>0–15: ${d.age_0_15_pct}%</div>
          <div class="donut-legend-item"><div class="donut-legend-dot" style="background:#2980b9"></div>16–64: ${d.age_16_64_pct}%</div>
          <div class="donut-legend-item"><div class="donut-legend-dot" style="background:#7fb3d3"></div>65+: ${d.age_65_plus_pct}%</div>
        </div>
      </div>
    </div>
    <div class="stat-section">
      <h3>Economy</h3>
      <div class="stat-row"><span class="stat-label">Median Earnings</span><span class="stat-value">${fmtMoney(d.median_annual_earnings_residence)}</span></div>
      <div class="stat-row"><span class="stat-label">Employment Rate</span><span class="stat-value">${d.employment_rate_pct}%</span></div>
      <div class="stat-row"><span class="stat-label">Unemployment</span><span class="stat-value">${d.unemployment_rate_census_pct}%</span></div>
    </div>
    <div class="stat-section">
      <h3>Deprivation (NIMDM 2017)</h3>
      <div class="stat-row"><span class="stat-label">SOAs in top 100</span><span class="stat-value">${d.nimdm_soas_in_top100} of ${d.nimdm_total_soas}</span></div>
      <div class="deprivation-meter">
        <div class="meter-track"><div class="meter-marker" style="left:${depMarkerPos}%"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#555"><span>Least</span><span>Most</span></div>
      </div>
    </div>
    <div class="stat-section">
      <h3>2022 Assembly Election</h3>
      ${d.assembly_2022 && d.assembly_2022.note ? '<div style="font-size:10px;color:#666;margin-bottom:8px;font-style:italic">' + d.assembly_2022.note + '</div>' : ''}
      <div class="bar-chart">${electionBars}</div>
    </div>
  `;
}

function buildDemographicsTab(d) {
  const dem = d.demographics;
  if (!dem) return '<div class="stat-section"><p style="color:#888;font-size:12px">Demographic data not available.</p></div>';

  // Religion stacked bar
  const religionBar = makeStackedBar([
    { label: 'Catholic', pct: dem.catholic_pct, color: '#2d7a3a' },
    { label: 'Protestant & Other Christian', pct: dem.protestant_other_christian_pct, color: '#3a6fb0' },
    { label: 'Other', pct: dem.other_religion_pct, color: '#8e6fb0' },
    { label: 'None', pct: dem.no_religion_pct, color: '#666' }
  ]);

  // Country of birth stacked bar
  const birthBar = makeStackedBar([
    { label: 'NI', pct: dem.born_ni_pct, color: '#4a7c8a' },
    { label: 'Rest of UK', pct: dem.born_rest_uk_pct, color: '#2980b9' },
    { label: 'Ireland', pct: dem.born_ireland_pct, color: '#27ae60' },
    { label: 'EU', pct: dem.born_eu_pct, color: '#e8a838' },
    { label: 'Rest of World', pct: dem.born_rest_world_pct, color: '#c0392b' }
  ]);

  const popChange = dem.population_change_pct;
  const changeClass = popChange >= 0 ? 'positive' : 'negative';

  return `
    <div class="stat-section">
      <h3>Population Change 2011→2021</h3>
      <div class="stat-cards">
        <div class="stat-card"><div class="card-value">${fmt(dem.population_2011)}</div><div class="card-label">2011</div></div>
        <div class="stat-card"><div class="card-value">${fmt(d.population)}</div><div class="card-label">2021</div></div>
      </div>
      <div style="text-align:center;margin-top:6px">
        <span class="stat-value ${changeClass}">${popChange >= 0 ? '+' : ''}${popChange.toFixed(1)}%</span>
      </div>
    </div>
    <div class="stat-section">
      <h3>Religion / Community Background</h3>
      ${religionBar}
    </div>
    <div class="stat-section">
      <h3>Country of Birth</h3>
      ${birthBar}
    </div>
    <div class="stat-section">
      <h3>Language</h3>
      <div class="stat-row"><span class="stat-label">Irish speakers</span><span class="stat-value">${fmtPct(dem.irish_speakers_pct)}</span></div>
      <div class="stat-row"><span class="stat-label">Ulster-Scots speakers</span><span class="stat-value">${fmtPct(dem.ulster_scots_speakers_pct)}</span></div>
    </div>
    ${dem.urban_rural ? `<div class="stat-section"><h3>Settlement</h3><div class="stat-row"><span class="stat-label">Classification</span><span class="stat-value">${dem.urban_rural}</span></div></div>` : ''}
  `;
}

function buildHousingTab(d) {
  const h = d.housing;
  if (!h) return '<div class="stat-section"><p style="color:#888;font-size:12px">Housing data not available.</p></div>';

  const tenureBar = makeStackedBar([
    { label: 'Owner-occupied', pct: h.owner_occupied_pct, color: '#2980b9' },
    { label: 'Private rented', pct: h.private_rented_pct, color: '#e8a838' },
    { label: 'Social housing', pct: h.social_housing_pct, color: '#27ae60' }
  ]);

  return `
    <div class="stat-section">
      <h3>House Prices</h3>
      <div class="stat-cards">
        <div class="stat-card"><div class="card-value">${fmtMoney(h.median_house_price)}</div><div class="card-label">Median Price</div></div>
        <div class="stat-card"><div class="card-value">${fmtMoney(h.avg_house_price)}</div><div class="card-label">Average Price</div></div>
      </div>
      ${h.price_year ? `<div style="font-size:10px;color:#555;text-align:center;margin-top:2px">Source: LPS ${h.price_year}</div>` : ''}
    </div>
    <div class="stat-section">
      <h3>Housing Tenure</h3>
      ${tenureBar}
    </div>
  `;
}

function buildHealthTab(d) {
  let html = '';

  // Life expectancy
  html += `
    <div class="stat-section">
      <h3>Life Expectancy</h3>
      <div class="stat-cards">
        <div class="stat-card"><div class="card-value">${d.life_expectancy_male}</div><div class="card-label">Male</div></div>
        <div class="stat-card"><div class="card-value">${d.life_expectancy_female}</div><div class="card-label">Female</div></div>
      </div>
    </div>
  `;

  // General health
  const h = d.health;
  if (h) {
    const healthBar = makeBarChart([
      { label: 'Very Good', value: h.very_good_pct, color: '#27ae60' },
      { label: 'Good', value: h.good_pct, color: '#2ecc71' },
      { label: 'Fair', value: h.fair_pct, color: '#e8a838' },
      { label: 'Bad', value: h.bad_pct, color: '#e67e22' },
      { label: 'Very Bad', value: h.very_bad_pct, color: '#c0392b' }
    ]);

    html += `
      <div class="stat-section">
        <h3>General Health (Self-Assessed)</h3>
        <div class="bar-chart">${healthBar}</div>
      </div>
      <div class="stat-section">
        <h3>Disability & Care</h3>
        <div class="stat-row"><span class="stat-label">Long-term health condition</span><span class="stat-value">${fmtPct(d.long_term_health_condition_pct)}</span></div>
        <div class="stat-row"><span class="stat-label">Activity limited a lot</span><span class="stat-value">${fmtPct(h.disability_limited_lot_pct)}</span></div>
        <div class="stat-row"><span class="stat-label">Activity limited a little</span><span class="stat-value">${fmtPct(h.disability_limited_little_pct)}</span></div>
        <div class="stat-row"><span class="stat-label">Provides unpaid care</span><span class="stat-value">${fmtPct(h.unpaid_care_pct)}</span></div>
      </div>
    `;
  } else {
    html += `
      <div class="stat-section">
        <div class="stat-row"><span class="stat-label">Long-term Condition</span><span class="stat-value">${fmtPct(d.long_term_health_condition_pct)}</span></div>
      </div>
    `;
  }
  return html;
}

function buildCrimeTab(d) {
  const c = d.crime;
  if (!c) return '<div class="stat-section"><p style="color:#888;font-size:12px">Crime data not available.</p></div>';

  const crimeTypes = [];
  if (c.violence != null) crimeTypes.push({ label: 'Violence', value: c.violence, color: '#c0392b' });
  if (c.theft != null) crimeTypes.push({ label: 'Theft', value: c.theft, color: '#e8a838' });
  if (c.criminal_damage != null) crimeTypes.push({ label: 'Criminal Damage', value: c.criminal_damage, color: '#d35400' });
  if (c.burglary != null) crimeTypes.push({ label: 'Burglary', value: c.burglary, color: '#8e44ad' });
  if (c.drugs != null) crimeTypes.push({ label: 'Drug Offences', value: c.drugs, color: '#2980b9' });
  if (c.public_order != null) crimeTypes.push({ label: 'Public Order', value: c.public_order, color: '#27ae60' });
  if (c.possession_weapons != null) crimeTypes.push({ label: 'Weapons', value: c.possession_weapons, color: '#666' });

  const crimeBar = crimeTypes.length > 0 ? makeBarChart(crimeTypes.map(ct => ({
    label: ct.label, value: ct.value, color: ct.color, display: fmt(ct.value)
  }))) : '';

  return `
    <div class="stat-section">
      <h3>Recorded Crime</h3>
      <div class="stat-cards">
        <div class="stat-card"><div class="card-value">${fmt(c.total_recorded)}</div><div class="card-label">Total Offences</div></div>
        <div class="stat-card"><div class="card-value">${c.rate_per_1000}</div><div class="card-label">per 1,000 pop.</div></div>
      </div>
      ${c.period ? `<div style="font-size:10px;color:#555;text-align:center;margin-top:2px">${c.period}</div>` : ''}
    </div>
    ${crimeBar ? `<div class="stat-section"><h3>Crime by Type</h3><div class="bar-chart">${crimeBar}</div></div>` : ''}
    ${c.antisocial_behaviour != null ? `<div class="stat-section"><h3>Antisocial Behaviour</h3><div class="stat-row"><span class="stat-label">ASB Incidents</span><span class="stat-value">${fmt(c.antisocial_behaviour)}</span></div></div>` : ''}
  `;
}

function buildEducationTab(d) {
  const e = d.education;
  if (!e) return '<div class="stat-section"><p style="color:#888;font-size:12px">Education data not available.</p></div>';

  const qualBar = makeBarChart([
    { label: 'Degree+', value: e.degree_plus_pct, color: '#2980b9' },
    { label: 'A-Level', value: e.a_level_pct, color: '#3498db' },
    { label: 'GCSE', value: e.gcse_pct, color: '#7fb3d3' },
    { label: 'Other', value: e.other_pct || 0, color: '#95a5a6' },
    { label: 'None', value: e.no_qualifications_pct, color: '#666' }
  ]);

  return `
    <div class="stat-section">
      <h3>Highest Qualification (Age 16+)</h3>
      <div class="stat-cards">
        <div class="stat-card"><div class="card-value">${fmtPct(e.degree_plus_pct)}</div><div class="card-label">Degree+</div></div>
        <div class="stat-card"><div class="card-value">${fmtPct(e.no_qualifications_pct)}</div><div class="card-label">No Quals</div></div>
      </div>
    </div>
    <div class="stat-section">
      <h3>Qualification Breakdown</h3>
      <div class="bar-chart">${qualBar}</div>
    </div>
  `;
}

function buildTransportTab(d) {
  const t = d.transport;
  if (!t) return '<div class="stat-section"><p style="color:#888;font-size:12px">Transport data not available.</p></div>';

  // Car ownership stacked bar
  const carBar = makeStackedBar([
    { label: 'No car', pct: t.no_car_pct, color: '#c0392b' },
    { label: '1 car', pct: t.one_car_pct, color: '#e8a838' },
    { label: '2+ cars', pct: t.two_plus_cars_pct, color: '#27ae60' }
  ]);

  // Travel to work
  const travelItems = [];
  if (t.drive_pct != null) travelItems.push({ label: 'Car/Van', value: t.drive_pct, color: '#2980b9' });
  if (t.public_transport_pct != null) travelItems.push({ label: 'Public Transport', value: t.public_transport_pct, color: '#27ae60' });
  if (t.walk_cycle_pct != null) travelItems.push({ label: 'Walk/Cycle', value: t.walk_cycle_pct, color: '#e8a838' });
  if (t.work_from_home_pct != null) travelItems.push({ label: 'Work from Home', value: t.work_from_home_pct, color: '#8e44ad' });
  if (t.other_pct != null) travelItems.push({ label: 'Other', value: t.other_pct, color: '#666' });
  const travelBar = travelItems.length > 0 ? makeBarChart(travelItems) : '';

  return `
    <div class="stat-section">
      <h3>Car Ownership</h3>
      ${carBar}
    </div>
    ${travelBar ? `<div class="stat-section"><h3>Travel to Work</h3><div class="bar-chart">${travelBar}</div></div>` : ''}
    ${t.avg_broadband_mbps != null ? `<div class="stat-section"><h3>Broadband</h3><div class="stat-row"><span class="stat-label">Avg. Download Speed</span><span class="stat-value">${t.avg_broadband_mbps} Mbps</span></div></div>` : ''}
  `;
}

// ===== WARD STATS LOOKUP =====
function getWardData(wardName, lgdName) {
  if (typeof WARD_STATS === 'undefined') return null;
  const lgdData = WARD_STATS[lgdName];
  if (!lgdData) return null;
  return lgdData[wardName] || null;
}

// ===== WARD STATS =====
function showWardStats(wardName, lgdName) {
  const w = getWardData(wardName, lgdName);

  if (!w) {
    // Fallback: no ward data available
    openPanel(`
      <div class="panel-header">
        <div class="panel-type">Ward — ${lgdName}</div>
        <h2>${wardName}</h2>
      </div>
      <div class="stat-section"><p style="color:#888;font-size:12px">Ward-level data not available for this ward.</p></div>
    `);
    return;
  }

  const html = `
    <div class="panel-header">
      <div class="panel-type">Ward — ${lgdName}</div>
      <h2>${wardName}</h2>
    </div>
    <div class="tab-bar">
      <button class="tab-btn active" data-tab="overview" onclick="switchTab('overview')">Overview</button>
      <button class="tab-btn" data-tab="demographics" onclick="switchTab('demographics')">Demographics</button>
      <button class="tab-btn" data-tab="housing" onclick="switchTab('housing')">Housing</button>
      <button class="tab-btn" data-tab="health" onclick="switchTab('health')">Health</button>
      <button class="tab-btn" data-tab="education" onclick="switchTab('education')">Education</button>
      <button class="tab-btn" data-tab="transport" onclick="switchTab('transport')">Transport</button>
    </div>
    <div id="tab-overview" class="tab-content active">${buildWardOverviewTab(w)}</div>
    <div id="tab-demographics" class="tab-content">${buildWardDemographicsTab(w)}</div>
    <div id="tab-housing" class="tab-content">${buildWardHousingTab(w)}</div>
    <div id="tab-health" class="tab-content">${buildWardHealthTab(w)}</div>
    <div id="tab-education" class="tab-content">${buildWardEducationTab(w)}</div>
    <div id="tab-transport" class="tab-content">${buildWardTransportTab(w)}</div>
    <div class="panel-footer">
      Source: NISRA Census 2021, NIMDM 2017. All figures are ward-level where available.
    </div>
  `;
  openPanel(html);
}

function buildWardOverviewTab(w) {
  // Age donut
  const ageSvg = makeDonutSVG([
    { pct: w.age_0_15_pct, color: '#4a7c8a', label: '0–15' },
    { pct: w.age_16_64_pct, color: '#2980b9', label: '16–64' },
    { pct: w.age_65_plus_pct, color: '#7fb3d3', label: '65+' }
  ]);

  // Deprivation (rank out of 462, lower = more deprived)
  const depRank = w.deprivation_rank;
  const depPct = depRank != null ? ((462 - depRank) / 462 * 100).toFixed(0) : null;
  const depMarkerPos = depRank != null ? ((462 - depRank) / 462 * 100) : 0;

  return `
    <div class="stat-section">
      <h3>Population</h3>
      <div class="stat-cards">
        <div class="stat-card"><div class="card-value">${fmt(w.population)}</div><div class="card-label">People</div></div>
        <div class="stat-card"><div class="card-value">${fmt(w.male)}</div><div class="card-label">Male</div></div>
        <div class="stat-card"><div class="card-value">${fmt(w.female)}</div><div class="card-label">Female</div></div>
      </div>
      ${w.urban_rural ? `<div style="text-align:center;font-size:11px;color:#888;margin-top:4px">Settlement: ${w.urban_rural}</div>` : ''}
    </div>
    <div class="stat-section">
      <h3>Age Breakdown</h3>
      <div class="donut-container">
        ${ageSvg}
        <div class="donut-legend">
          <div class="donut-legend-item"><div class="donut-legend-dot" style="background:#4a7c8a"></div>0–15: ${w.age_0_15_pct}%</div>
          <div class="donut-legend-item"><div class="donut-legend-dot" style="background:#2980b9"></div>16–64: ${w.age_16_64_pct}%</div>
          <div class="donut-legend-item"><div class="donut-legend-dot" style="background:#7fb3d3"></div>65+: ${w.age_65_plus_pct}%</div>
        </div>
      </div>
    </div>
    ${depRank != null ? `
    <div class="stat-section">
      <h3>Deprivation (NIMDM 2017)</h3>
      <div class="stat-row"><span class="stat-label">Overall Rank</span><span class="stat-value">${depRank} of 462</span></div>
      <div class="deprivation-meter">
        <div class="meter-track"><div class="meter-marker" style="left:${depMarkerPos}%"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#555"><span>Least deprived</span><span>Most deprived</span></div>
      </div>
      <div style="font-size:10px;color:#666;margin-top:6px">
        <div class="stat-row"><span class="stat-label">Income</span><span class="stat-value">${w.income_rank}/462</span></div>
        <div class="stat-row"><span class="stat-label">Employment</span><span class="stat-value">${w.employment_rank}/462</span></div>
        <div class="stat-row"><span class="stat-label">Health</span><span class="stat-value">${w.health_rank}/462</span></div>
        <div class="stat-row"><span class="stat-label">Education</span><span class="stat-value">${w.education_rank}/462</span></div>
        <div class="stat-row"><span class="stat-label">Access to Services</span><span class="stat-value">${w.access_rank}/462</span></div>
        <div class="stat-row"><span class="stat-label">Living Environment</span><span class="stat-value">${w.living_env_rank}/462</span></div>
        <div class="stat-row"><span class="stat-label">Crime & Disorder</span><span class="stat-value">${w.crime_rank}/462</span></div>
      </div>
    </div>` : ''}
  `;
}

function buildWardDemographicsTab(w) {
  const religionBar = makeStackedBar([
    { label: 'Catholic', pct: w.catholic_pct, color: '#2d7a3a' },
    { label: 'Protestant & Other Christian', pct: w.protestant_other_christian_pct, color: '#3a6fb0' },
    { label: 'Other', pct: w.other_religion_pct, color: '#8e6fb0' },
    { label: 'None', pct: w.no_religion_pct, color: '#666' }
  ]);

  const birthBar = makeStackedBar([
    { label: 'NI', pct: w.born_ni_pct, color: '#4a7c8a' },
    { label: 'Rest of UK', pct: w.born_other_uk_pct, color: '#2980b9' },
    { label: 'Ireland', pct: w.born_roi_pct, color: '#27ae60' },
    { label: 'Elsewhere', pct: w.born_elsewhere_pct, color: '#e8a838' }
  ]);

  return `
    <div class="stat-section">
      <h3>Religion / Community Background</h3>
      ${religionBar}
    </div>
    <div class="stat-section">
      <h3>Country of Birth</h3>
      ${birthBar}
    </div>
  `;
}

function buildWardHousingTab(w) {
  const tenureBar = makeStackedBar([
    { label: 'Owner-occupied', pct: w.owner_occupied_pct, color: '#2980b9' },
    { label: 'Private rented', pct: w.private_rented_pct, color: '#e8a838' },
    { label: 'Social housing', pct: w.social_rented_pct, color: '#27ae60' }
  ]);

  return `
    <div class="stat-section">
      <h3>Housing Tenure</h3>
      ${tenureBar}
      <div style="font-size:10px;color:#555;margin-top:4px">Source: Census 2021</div>
    </div>
    <div class="stat-section">
      <p style="font-size:11px;color:#666">House prices are not available at ward level. See district stats for LPS price data.</p>
    </div>
  `;
}

function buildWardHealthTab(w) {
  const healthBar = makeBarChart([
    { label: 'Very Good / Good', value: w.very_good_good_health_pct, color: '#27ae60' },
    { label: 'Fair', value: w.fair_health_pct, color: '#e8a838' },
    { label: 'Bad / Very Bad', value: w.bad_very_bad_health_pct, color: '#c0392b' }
  ]);

  return `
    <div class="stat-section">
      <h3>General Health (Self-Assessed)</h3>
      <div class="bar-chart">${healthBar}</div>
    </div>
    <div class="stat-section">
      <p style="font-size:11px;color:#666">Life expectancy and disability data not available at ward level.</p>
    </div>
  `;
}

function buildWardEducationTab(w) {
  const qualBar = makeBarChart([
    { label: 'Level 4+ (Degree)', value: w.level_4_plus_pct, color: '#2980b9' },
    { label: 'Level 3 (A-Level)', value: w.level_3_pct, color: '#3498db' },
    { label: 'Level 1-2 (GCSE)', value: w.level_1_2_pct, color: '#7fb3d3' },
    { label: 'No Qualifications', value: w.no_qualifications_pct, color: '#666' }
  ]);

  return `
    <div class="stat-section">
      <h3>Highest Qualification (Age 16+)</h3>
      <div class="stat-cards">
        <div class="stat-card"><div class="card-value">${fmtPct(w.level_4_plus_pct)}</div><div class="card-label">Degree+</div></div>
        <div class="stat-card"><div class="card-value">${fmtPct(w.no_qualifications_pct)}</div><div class="card-label">No Quals</div></div>
      </div>
    </div>
    <div class="stat-section">
      <h3>Qualification Breakdown</h3>
      <div class="bar-chart">${qualBar}</div>
    </div>
  `;
}

function buildWardTransportTab(w) {
  const carBar = makeStackedBar([
    { label: 'No car', pct: w.no_cars_pct, color: '#c0392b' },
    { label: '1 car', pct: w.one_car_pct, color: '#e8a838' },
    { label: '2+ cars', pct: w.two_plus_cars_pct, color: '#27ae60' }
  ]);

  const travelItems = [];
  if (w.drive_to_work_pct != null) travelItems.push({ label: 'Car/Van', value: w.drive_to_work_pct, color: '#2980b9' });
  if (w.public_transport_pct != null) travelItems.push({ label: 'Public Transport', value: w.public_transport_pct, color: '#27ae60' });
  if (w.walk_cycle_pct != null) travelItems.push({ label: 'Walk/Cycle', value: w.walk_cycle_pct, color: '#e8a838' });
  if (w.work_from_home_pct != null) travelItems.push({ label: 'Work from Home', value: w.work_from_home_pct, color: '#8e44ad' });
  const travelBar = travelItems.length > 0 ? makeBarChart(travelItems) : '';

  return `
    <div class="stat-section">
      <h3>Car Ownership</h3>
      ${carBar}
    </div>
    ${travelBar ? `<div class="stat-section"><h3>Travel to Work</h3><div class="bar-chart">${travelBar}</div></div>` : ''}
  `;
}

// ===== COMPARISON PANEL =====
function showComparisonPanel(name1, name2) {
  const d1 = getDistrictData(name1);
  const d2 = getDistrictData(name2);
  if (!d1 || !d2) return;

  function compRow(label, v1, v2, higherBetter, formatter) {
    formatter = formatter || fmtPct;
    const fv1 = formatter(v1);
    const fv2 = formatter(v2);
    let c1 = '', c2 = '';
    if (v1 != null && v2 != null && higherBetter !== undefined) {
      if (v1 > v2) { c1 = 'compare-highlight-better'; c2 = 'compare-highlight-worse'; }
      else if (v2 > v1) { c2 = 'compare-highlight-better'; c1 = 'compare-highlight-worse'; }
    }
    return `<div class="stat-row">
      <span class="stat-value ${c1}" style="width:80px;text-align:left;font-size:12px">${fv1}</span>
      <span class="stat-label" style="flex:1;text-align:center;font-size:11px">${label}</span>
      <span class="stat-value ${c2}" style="width:80px;text-align:right;font-size:12px">${fv2}</span>
    </div>`;
  }

  const f = (n) => n != null ? n.toLocaleString() : '—';
  const fm = (n) => n != null ? '£' + n.toLocaleString() : '—';

  let rows = '';
  rows += compRow('Population', d1.population, d2.population, undefined, f);
  rows += compRow('Density (km²)', d1.population_density_per_sq_km, d2.population_density_per_sq_km, undefined, f);
  rows += compRow('Median Earnings', d1.median_annual_earnings_residence, d2.median_annual_earnings_residence, true, fm);
  rows += compRow('Employment', d1.employment_rate_pct, d2.employment_rate_pct, true);
  rows += compRow('Unemployment', d1.unemployment_rate_census_pct, d2.unemployment_rate_census_pct, false);
  rows += compRow('Life Exp. (M)', d1.life_expectancy_male, d2.life_expectancy_male, true, f);
  rows += compRow('Life Exp. (F)', d1.life_expectancy_female, d2.life_expectancy_female, true, f);
  rows += compRow('% Deprived SOAs', d1.nimdm_pct_in_top100, d2.nimdm_pct_in_top100, false);

  if (d1.housing && d2.housing) {
    rows += compRow('Median House Price', d1.housing.median_house_price, d2.housing.median_house_price, undefined, fm);
    rows += compRow('Owner-Occupied', d1.housing.owner_occupied_pct, d2.housing.owner_occupied_pct, undefined);
  }
  if (d1.education && d2.education) {
    rows += compRow('Degree+', d1.education.degree_plus_pct, d2.education.degree_plus_pct, true);
    rows += compRow('No Qualifications', d1.education.no_qualifications_pct, d2.education.no_qualifications_pct, false);
  }
  if (d1.crime && d2.crime) {
    rows += compRow('Crime Rate', d1.crime.rate_per_1000, d2.crime.rate_per_1000, false, f);
  }
  if (d1.demographics && d2.demographics) {
    rows += compRow('Catholic', d1.demographics.catholic_pct, d2.demographics.catholic_pct, undefined);
    rows += compRow('Protestant', d1.demographics.protestant_other_christian_pct, d2.demographics.protestant_other_christian_pct, undefined);
  }

  const html = `
    <div class="panel-header" style="padding-bottom:10px">
      <div class="panel-type">Comparison</div>
      <div style="display:flex;justify-content:space-between;margin-top:6px">
        <h2 style="font-size:13px;flex:1;text-align:left">${d1.name}</h2>
        <span style="color:#555;padding:0 8px;font-size:12px">vs</span>
        <h2 style="font-size:13px;flex:1;text-align:right">${d2.name}</h2>
      </div>
    </div>
    <div class="stat-section">
      ${rows}
    </div>
    <div class="panel-footer" style="font-size:10px;color:#444">
      Green = higher/better, Red = lower/worse (where applicable). Source: NISRA Census 2021, NIMDM 2017, LPS, PSNI.
    </div>
  `;
  openPanel(html);
}

// ===== CLICK OUTSIDE =====
map.on('click', () => {
  if (!compareMode && document.getElementById('panel').classList.contains('open')) {
    closePanel();
  }
});

// ===== INIT =====
createLGDLayer();
map.fitBounds(NI_BOUNDS);
