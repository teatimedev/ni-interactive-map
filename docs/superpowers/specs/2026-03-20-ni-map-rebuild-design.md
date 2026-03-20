# The Big Dirty NI Map — Rebuild Design Spec

## Overview

Rebuild the existing vanilla JS interactive map of Northern Ireland as a Next.js App Router application. The site visualizes real official statistics (NISRA Census 2021, PSNI crime, LPS house prices, NIMDM deprivation, etc.) across 11 Local Government Districts and 462 wards with choropleth coloring, comparison mode, and tabbed stats panels.

**Goal:** A polished, mobile-first, shareable public site that NI residents can browse on their phones and share in group chats.

**Audience:** General public / NI residents. Social sharing is a primary distribution channel.

**Branding:** "The Big Dirty NI Map"

**Deployment:** Vercel (subdomain, e.g. `bigdirtynimap.vercel.app`), auto-deploy from `teatimedev/ni-interactive-map` GitHub repo.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | File-based routing, built-in metadata API, Vercel integration |
| Language | TypeScript | Type safety across 462 wards x 30+ fields |
| Styling | Tailwind CSS | Dark theme utilities, responsive breakpoints, co-located with components |
| Map | react-leaflet + Leaflet | Proven, lightweight, handles 462 polygons |
| Charts | Recharts | Accessible, composable, dark theme support. Replaces hand-rolled SVG |
| State | React context + hooks | useMapState, useChoropleth, useComparison — no Redux needed |
| Mobile panel | Custom bottom sheet | CSS transitions + touch events, three snap points |
| Search | Client-side filter | ~473 items total — no backend needed |
| Deployment | Vercel | Auto-deploy on push from GitHub |
| Testing | None initially | Ship first, add tests if it grows |

---

## Project Structure

```
ni-interactive-map/
├── app/
│   ├── layout.tsx              # Root layout — dark theme, fonts, metadata
│   ├── page.tsx                # Home — full map view (district level)
│   ├── district/
│   │   └── [slug]/
│   │       └── page.tsx        # District detail — zoomed map + stats panel
│   └── ward/
│       └── [lgd]/[slug]/
│           └── page.tsx        # Ward detail — zoomed map + stats panel
├── components/
│   ├── Map/
│   │   ├── MapContainer.tsx    # Leaflet map wrapper (client component)
│   │   ├── DistrictLayer.tsx   # GeoJSON layer for 11 LGDs
│   │   ├── WardLayer.tsx       # GeoJSON layer for wards (lazy loaded)
│   │   └── ChoroplethControls.tsx
│   ├── StatsPanel/
│   │   ├── StatsPanel.tsx      # Slide-in panel shell (desktop) / bottom sheet (mobile)
│   │   ├── OverviewTab.tsx
│   │   ├── DemographicsTab.tsx
│   │   ├── HousingTab.tsx
│   │   ├── HealthTab.tsx
│   │   ├── CrimeTab.tsx
│   │   ├── EducationTab.tsx
│   │   └── TransportTab.tsx
│   ├── ComparePanel.tsx        # Bottom comparison view
│   ├── Search.tsx              # Search districts/wards by name
│   ├── Charts/
│   │   ├── DonutChart.tsx
│   │   ├── BarChart.tsx
│   │   └── StackedBar.tsx
│   └── ui/
│       ├── BackButton.tsx
│       ├── Legend.tsx
│       └── LoadingSkeleton.tsx
├── data/
│   ├── districts.ts            # District stats (typed, bundled)
│   ├── geo-districts.json      # LGD GeoJSON (bundled)
│   ├── ni-overall.ts           # NI-wide totals
│   └── wards/
│       ├── antrim-newtownabbey.json
│       ├── ards-north-down.json
│       ├── armagh-banbridge-craigavon.json
│       ├── belfast.json
│       ├── causeway-coast-glens.json
│       ├── derry-strabane.json
│       ├── fermanagh-omagh.json
│       ├── lisburn-castlereagh.json
│       ├── mid-east-antrim.json
│       ├── mid-ulster.json
│       └── newry-mourne-down.json
├── hooks/
│   ├── useMapState.ts          # Current view, selected area, zoom
│   ├── useChoropleth.ts        # Active metric, color calculation
│   └── useComparison.ts        # Comparison mode state
├── lib/
│   ├── types.ts                # TypeScript interfaces for all data
│   ├── colors.ts               # Theme colors, party colors, choropleth scales
│   └── utils.ts                # Formatters (numbers, percentages, currency)
├── public/
│   └── og-image.png            # Social sharing preview image
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Routing & URL Structure

File-based routing via Next.js App Router. Every view is a shareable URL.

| Route | View | Data Loaded |
|---|---|---|
| `/` | All 11 districts on map | District stats + LGD GeoJSON (bundled) |
| `/district/belfast` | Zoomed into Belfast, stats panel open | + Belfast ward data (lazy fetched) |
| `/ward/belfast/ballymacarrett` | Zoomed to ward, ward stats panel open | + Belfast ward data (lazy fetched if not cached) |

**Slug format:** Lowercase, hyphenated district/ward names (e.g., `causeway-coast-glens`, `ballymacarrett`). Generated from the existing data names.

**Navigation flow:**
- Home → click district → `/district/[slug]` (router.push, Leaflet flyToBounds)
- District view → click ward → `/ward/[lgd]/[slug]`
- Back button → router.back() + Leaflet flyToBounds to previous view
- Browser back/forward buttons work correctly via URL state

---

## Data Architecture

### Bundled at Build Time (~77KB)

- `districts.ts` — 11 district objects with ~40 typed fields each (~15KB)
- `ni-overall.ts` — NI-wide aggregate totals (~2KB)
- `geo-districts.json` — GeoJSON FeatureCollection for 11 LGD boundaries (~60KB)

### Lazy Loaded on Drill-Down (~50-90KB per district)

- `wards/[lgd-slug].json` — combined stats + GeoJSON geometry for all wards in that district
- Fetched on first navigation to `/district/[slug]`
- Cached in React context — returning to a previously visited district doesn't refetch
- Each file contains both ward statistics and ward boundary geometry (single request, no waterfall)

### TypeScript Interfaces

```typescript
interface District {
  name: string;
  slug: string;
  population: number;
  area_km2: number;
  density: number;
  median_age: number;
  age_breakdown: AgeBreakdown;
  demographics: Demographics;
  housing: Housing;
  health: Health;
  crime: Crime;
  education: Education;
  transport: Transport;
  deprivation: DeprivationSummary;
  assembly_results: PartyResult[];
}

interface Ward {
  name: string;
  slug: string;
  lgd: string;
  population: number;
  age_breakdown: AgeBreakdown;
  demographics: Demographics;
  housing: Housing;
  health: Health;
  education: Education;
  deprivation: DeprivationRanks;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

interface PartyResult {
  party: string;
  seats: number;
  first_pref_pct: number;
}
```

---

## Features

### Carried Over (Improved)

1. **Choropleth mode** — 10 metrics via dropdown. Same color scaling logic, but debounced (150ms) and style updates batched via react-leaflet's declarative API.

2. **Comparison mode** — Click "Compare" button, select 2 districts, side-by-side stats with green/red delta highlighting. Same UX, rebuilt as React components.

3. **Tabbed stats panel** — 7 tabs for districts (Overview, Demographics, Housing, Health, Crime, Education, Transport), 6 for wards (no Transport). Same data, same tab structure. Each tab is its own component.

4. **Drill-down navigation** — Click district to zoom into wards, back button to return. Smooth flyToBounds animation preserved.

5. **SVG charts** — Donut (age breakdown), bar (crime/education/health), stacked bar (demographics/housing/travel). Rebuilt with Recharts for accessibility and consistency.

### New Features

6. **Search bar** — Text input above the map. Filters districts and wards by name as user types. Typeahead dropdown shows matches, click to navigate. Works at both zoom levels. Client-side filtering over ~473 items.

7. **URL routing** — Every view is a URL (`/district/belfast`, `/ward/belfast/ballymacarrett`). Shareable, bookmarkable. Browser back/forward works. Router.push on district/ward click, router.back on back button.

8. **Hover tooltips** — Mouseover a district/ward shows a floating tooltip with name + active choropleth metric value. Positioned near cursor. Replaces the current zero-feedback-until-click behavior.

9. **Loading skeleton** — Animated placeholder shown in the stats panel and ward layer while ward data fetches on drill-down. Prevents blank screen flash.

10. **OG social preview** — Open Graph metadata per page. Static preview image (`og-image.png`) with dark map outline and title. `twitter:card = summary_large_image`.

11. **Keyboard navigation** — Tab through controls (search, choropleth dropdown, compare button, tabs). Enter to select, Escape to close panel. Visible focus indicators on all interactive elements.

12. **ARIA accessibility** — `role="tablist"` and `role="tab"` on stats tabs. `aria-label` on all buttons. Charts have `role="img"` with `aria-label` describing the data. Screen reader announces district/ward name on selection.

---

## Mobile Experience

### Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| < 640px (mobile) | Bottom sheet panel, stacked controls, 44px touch targets, search collapses to icon |
| 640–1024px (tablet) | Narrower side panel (360px), adjusted map padding |
| 1024px+ (desktop) | Full side panel (480px), all controls visible |

### Bottom Sheet (Mobile Panel)

Replaces the side panel on screens < 640px. Three snap points:

- **Peek** (~80px) — District/ward name + population. Map fully visible. Appears on area click.
- **Half** (~45vh) — Overview tab content visible. Map visible above.
- **Full** (~90vh) — All tabs accessible, scrollable. Swipe down to collapse.

Drag handle at top. CSS transitions for smooth snapping. Touch event listeners for swipe detection.

### Mobile-Specific Adjustments

- Choropleth dropdown moves to bottom of screen (above bottom sheet)
- Search bar becomes a floating search icon, expands on tap
- Compare mode: comparison panel replaces bottom sheet (not both visible)
- Minimum font size 14px across all components
- All touch targets minimum 44x44px

---

## Visual Design

### Theme

Dark theme carried over from current site, refined with Tailwind:

- Background: `#1a1a1a` (map area), `#111` (panels)
- Text: `#e0e0e0` (primary), `#888` (secondary)
- Accent: `#2980b9` (active states, highlights, selected tabs)
- Borders: `#333`
- Hover states: brightness increase + border thicken (existing behavior)

### Map

- CartoDB Dark basemap (no-labels + labels overlay) — same as current
- District boundaries: `#4a9eff` stroke, `rgba(74, 158, 255, 0.15)` fill
- Ward boundaries: lighter stroke, same fill pattern
- Choropleth: blue gradient from low (#1a1a2e) to high (#2980b9) — same scale

### Party Colors

Preserved from current site:
- Sinn Fein: `#326732`
- DUP: `#c41a1a`
- Alliance: `#e6b800`
- UUP: `#003399`
- SDLP: `#2e8b57`
- TUV: `#0c2d5e`
- PBP: `#e10000`
- Greens: `#4caf50`

---

## Social Sharing & Metadata

### Open Graph Tags (Per Page)

| Route | og:title | og:description |
|---|---|---|
| `/` | The Big Dirty NI Map | Interactive map of Northern Ireland with real stats for all 462 wards |
| `/district/[slug]` | {Name} — The Big Dirty NI Map | Population, crime, housing, deprivation and more for {Name} |
| `/ward/[lgd]/[slug]` | {Ward}, {LGD} — The Big Dirty NI Map | Ward-level stats for {Ward} |

### Additional Meta

- `twitter:card = summary_large_image`
- `og:image = /og-image.png` (static, dark background with NI map outline + title)
- `theme-color: #1a1a1a` (dark browser chrome on mobile)
- Favicon: simple NI map outline or map pin icon

---

## State Management

Three custom hooks manage all application state:

### useMapState

```typescript
{
  currentView: 'districts' | 'district-detail' | 'ward-detail';
  selectedDistrict: string | null;
  selectedWard: string | null;
  wardData: Map<string, WardData>;      // cache of fetched ward data
  isLoadingWards: boolean;
}
```

### useChoropleth

```typescript
{
  metric: ChoroplethMetric | null;       // null = no coloring
  ranges: { min: number; max: number };  // recalculated per metric + view level
}
```

### useComparison

```typescript
{
  isComparing: boolean;
  selections: [string?, string?];        // max 2 district slugs
}
```

All three provided via a single `MapProvider` context wrapping the app. No prop drilling.

---

## Performance Budget

| Metric | Target |
|---|---|
| Initial bundle (JS) | < 200KB gzipped |
| First Contentful Paint | < 1.5s on 4G |
| Largest Contentful Paint | < 2.5s on 4G |
| Ward data fetch | < 100KB per district |
| Time to Interactive | < 3s on 4G |

### Optimizations

- Ward data split into 11 files, lazy loaded on drill-down
- Leaflet + react-leaflet loaded via `next/dynamic` with `ssr: false` (no server-side rendering for the map)
- Recharts tree-shaken (import only used chart types)
- Tailwind purges unused CSS at build time
- GeoJSON district boundaries bundled (small, needed immediately)
- Images optimized via next/image if any are added later

---

## Accessibility

### WCAG 2.1 AA Targets

- All interactive elements keyboard accessible (Tab, Enter, Escape)
- Visible focus indicators (2px outline, offset) on all focusable elements
- `role="tablist"`, `role="tab"`, `role="tabpanel"` on stats panel tabs
- `aria-label` on all buttons (back, compare, close, search)
- `aria-live="polite"` region announces selected district/ward name
- Charts: `role="img"` with descriptive `aria-label` (e.g., "Age breakdown: 0-15 years 19%, 16-64 years 64%, 65+ years 17%")
- Minimum font size 14px
- Color contrast ratio ≥ 4.5:1 (dark background + light text already meets this)
- Choropleth: legend text labels supplement color-only encoding

---

## Error Handling

- Ward data fetch failure: show error state in panel ("Couldn't load ward data. Tap to retry.") with retry button
- Missing ward in data: show "No data available" in stats panel rather than crash
- GeoJSON parse error: fall back to district view with error toast
- Invalid URL slug: redirect to `/` with a brief toast notification
