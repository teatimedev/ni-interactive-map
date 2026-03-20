# The Big Dirty NI Map

An interactive, layered web map of Northern Ireland with real statistics for all 462 wards and 11 Local Government Districts.

## Features

### Floating Capsule Navigation
- Floating pill-shaped controls that hover over the map
- Brand capsule (top-left) with app title
- Action buttons capsule (top-right) — Compare, Drop Pin, Back
- Shade By dropdown in its own capsule — colour the map by any metric
- Search bar below the nav for finding districts and wards

### Layered Map
- **11 Local Government Districts (LGDs)** on initial load
- **Click any district** to zoom into its individual wards
- Click another district at any time without pressing Back
- Dark CartoDB basemap

### Choropleth Shading
Shade the map by metric — works at both district and ward level:
- Population density, deprivation rank, median income
- House prices, crime rate, % degree-educated
- % no car, % Catholic, % Protestant, livability score

### Comparison Mode
- Click two districts for a side-by-side comparison
- Green/red highlighting shows which area performs better

### Map Pins
- Drop custom pins anywhere on the map
- Label your pins with custom text
- Community-driven — see pins from other users

### Tabbed Stats Panel
Click any area to see detailed statistics across 7 tabs:

| Tab | Data |
|-----|------|
| **Overview** | Population, age breakdown, economy, deprivation, election results, livability score |
| **Demographics** | Religion, country of birth, language speakers, population change 2011→2021 |
| **Housing** | Median/average house prices, housing tenure breakdown |
| **Health** | Life expectancy, general health, disability rates, unpaid care |
| **Crime** | Total recorded crime, rate per 1,000, breakdown by type |
| **Education** | Qualification levels, % degree-educated, % no qualifications |
| **Transport** | Car ownership, travel to work, broadband speeds |

### Ward-Level Features
All 462 wards have individual data including:
- Population with 2011→2021 trend comparison (source: NISRA CT0367NI)
- Religion / community background
- Country of birth, housing tenure, qualification levels
- NIMDM 2017 deprivation ranks (overall + 7 domains)
- **Livability Score** — weighted average of 7 deprivation domains (deprivation, income, health, education, crime, environment, access)
- **Ward Rank Card** — grade (A+ to F), percentile, domain strengths/weaknesses, full score breakdown with rank numbers
- **Similar Wards** — find the 5 most demographically similar wards across NI using Euclidean distance on 12 profile fields
- **Community Tags** — user-contributed labels for each ward

### Leaderboard
- Ward rankings by livability score across all of Northern Ireland

## Data Sources

All data is real and sourced from official publications. No placeholders or estimates.

| Source | Data |
|--------|------|
| [NISRA Census 2021](https://www.nisra.gov.uk/statistics/census/2021-census) | Population, demographics, housing, health, education, transport |
| [NISRA Census 2011 (CT0367NI)](https://www.nisra.gov.uk/statistics/2011-census-results/headcount-and-household-estimates) | Ward population at 2014 boundaries (for trend comparison) |
| [NIMDM 2017](https://www.nisra.gov.uk/statistics/deprivation/northern-ireland-multiple-deprivation-measure-2017-nimdm2017) | Deprivation rankings (890 SOAs, 462 wards, 8 domains) |
| [NISRA Health Inequalities 2024](https://www.nisra.gov.uk/) | Life expectancy (2020-22 period) |
| [ASHE 2024 / Invest NI](https://www.investni.com/) | Median annual earnings, employment rates |
| [NI Electoral Office](https://www.eoni.org.uk/) | 2022 Assembly election results |
| [LPS / Dept of Finance](https://www.finance-ni.gov.uk/) | House prices 2024 |
| [PSNI](https://www.psni.police.uk/official-statistics) | Recorded crime statistics 2024/25 |
| [Ofcom Connected Nations](https://www.ofcom.org.uk/) | Broadband speeds |
| [OSNI Open Data](https://www.opendatani.gov.uk/) | GeoJSON boundary data |

## Livability Score

Each ward receives a livability score (0–100) based on a weighted average of 7 NIMDM 2017 deprivation domains:

| Domain | Weight |
|--------|--------|
| Deprivation (overall) | 20% |
| Income | 15% |
| Health | 18% |
| Education | 13% |
| Crime | 13% |
| Living Environment | 12% |
| Access to Services | 9% |

Rank 1 = most deprived (score 0), rank 462 = least deprived (score 100). Grades range from A+ (90+) to F (<25).

## Tech Stack

- **Next.js 16** — React framework
- **TypeScript** — typed throughout
- **Tailwind CSS v4** — styling
- **react-leaflet** — map rendering
- **Recharts** — data visualisation (bar charts, donut charts, stacked bars)
- **Supabase** — authentication, pins, community tags
- **CartoDB Dark** — greyscale basemap tiles

## Getting Started

```bash
npm install
npm run dev
```

### Environment Variables

For pins, tags, and auth features, create a `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The map and all statistics work without Supabase — only community features require it.

## Data Pipeline

Raw data lives in three JS files at the project root:
- `stats-data.js` — district-level statistics
- `ward-stats.js` — ward-level statistics (462 wards)
- `geo-data.js` — GeoJSON boundaries

Run the conversion script to generate typed outputs:

```bash
npx tsx scripts/convert-data.ts
```

This writes to both `data/` (for imports) and `public/data/wards/` (for runtime fetch).

## Build

```bash
npm run build
```

## Deploy

Connect the repository to [Vercel](https://vercel.com). It will detect Next.js automatically and deploy on push.

## License

MIT
