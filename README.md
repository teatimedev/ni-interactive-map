# 🗺️ Northern Ireland Interactive Map

An interactive, layered web map of Northern Ireland with real statistics from official sources.

![Greyscale map with dark UI](https://img.shields.io/badge/style-greyscale%20%2B%20dark-333?style=flat-square) ![Vanilla JS](https://img.shields.io/badge/tech-vanilla%20JS-f7df1e?style=flat-square) ![Leaflet](https://img.shields.io/badge/map-Leaflet.js-199900?style=flat-square)

## Features

### 🗺️ Layered Map
- **11 Local Government Districts (LGDs)** on initial load
- **Click any district** → smooth zoom into its **462 individual wards**
- Back button to return to district view
- Greyscale CartoDB Dark basemap

### 📊 Choropleth Mode
Toggle the map colouring by metric:
- Population density, deprivation rank, median income
- House prices, crime rate, % degree-educated
- % no car, % Catholic, % Protestant

### 🔄 Comparison Mode
- Click two districts for a **side-by-side comparison**
- Green/red highlighting shows which area performs better

### 📋 Tabbed Stats Panel
Click any area to see detailed statistics across **7 tabs**:

| Tab | Data |
|-----|------|
| **Overview** | Population, age breakdown, economy, deprivation, election results |
| **Demographics** | Religion, country of birth, language speakers, population change 2011→2021 |
| **Housing** | Median/average house prices, housing tenure breakdown |
| **Health** | Life expectancy, general health, disability rates, unpaid care |
| **Crime** | Total recorded crime, rate per 1,000, breakdown by type |
| **Education** | Qualification levels, % degree-educated, % no qualifications |
| **Transport** | Car ownership, travel to work, broadband speeds |

### 📍 Ward-Level Data
All **462 wards** have individual data including:
- Population, age, gender breakdown
- Religion / community background
- Country of birth
- Housing tenure
- Qualification levels
- NIMDM 2017 deprivation ranks (overall + 7 domains)

## Data Sources

All data is **real and sourced from official publications**. No placeholders or estimates.

| Source | Data |
|--------|------|
| [NISRA Census 2021](https://www.nisra.gov.uk/statistics/census/2021-census) | Population, demographics, housing, health, education, transport |
| [NIMDM 2017](https://www.nisra.gov.uk/statistics/deprivation/northern-ireland-multiple-deprivation-measure-2017-nimdm2017) | Deprivation rankings (890 SOAs, 462 wards) |
| [NISRA Health Inequalities 2024](https://www.nisra.gov.uk/) | Life expectancy (2020-22 period) |
| [ASHE 2024 / Invest NI](https://www.investni.com/) | Median annual earnings, employment rates |
| [NI Electoral Office](https://www.eoni.org.uk/) | 2022 Assembly election results |
| [LPS / Dept of Finance](https://www.finance-ni.gov.uk/) | House prices 2024 |
| [PSNI](https://www.psni.police.uk/official-statistics) | Recorded crime statistics 2023/24–2024/25 |
| [Ofcom Connected Nations](https://www.ofcom.org.uk/) | Broadband speeds |
| [OSNI Open Data](https://www.opendatani.gov.uk/) | GeoJSON boundary data |

## Tech Stack

- **Leaflet.js** — map rendering
- **Vanilla HTML/CSS/JS** — no frameworks
- **CartoDB Dark** — greyscale basemap tiles
- **OSNI** — GeoJSON boundaries (LGDs + 462 wards)
- Mobile responsive

## Getting Started

Just open `index.html` in a browser. No build step, no dependencies to install.

```bash
# Or serve locally
npx serve .
```

## File Structure

```
ni-map/
├── index.html        # Main page + CSS
├── app.js            # Map logic, UI, interactions
├── geo-data.js       # GeoJSON boundaries (LGDs + wards)
├── stats-data.js     # District-level statistics
├── ward-stats.js     # Ward-level statistics (462 wards)
└── README.md
```

## License

MIT
