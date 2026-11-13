# Earth Jukebox 🌍🎵
**The Earth Information Jukebox — NASA Space Apps Challenge**

An interactive, production-ready web application that pairs NASA Earth environmental data with real-time harmonic sonification and dynamic visuals, empowering people who are blind, low-vision, or sighted to explore multi-decadal climate and environmental trends by listening.

![NASA Space Apps Challenge](https://img.shields.io/badge/NASA%20Space%20Apps-The%20Earth%20Information%20Jukebox-0284c7?style=for-the-badge)
![Zero Backend](https://img.shields.io/badge/Architecture-100%25%20Client--Side-10b981?style=for-the-badge)
![Web Audio API](https://img.shields.io/badge/Audio-Pure%20Web%20Audio%20API-f97316?style=for-the-badge)
![WCAG AAA](https://img.shields.io/badge/Accessibility-WCAG%20AAA%20Compliant-a855f7?style=for-the-badge)

---

## 🌟 Key Features

### 1. Visual Frames & Synchronized Animation
- **Historical Timeline (1990 – 2023)**: Animated scrubbable timeline with play, pause, step forward/backward, and playback speed controls (0.5x, 1x, 1.5x, 2x).
- **Chart.js Visualizer**: Time-series curve with a moving vertical cursor synchronized with the audio frame, dashed linear regression trendline, and all-time record high/low badges.
- **Leaflet Map with Dynamic Heat Overlays**: Click anywhere on Earth to inspect coordinates or choose presets (Zagazig, Alexandria, Cairo, Aswan). A real-time pulsing heat overlay expands and shifts color (cool cyan to fiery red) frame-by-frame as data values change.

### 2. Pure Web Audio API Sonification (No Sound Files, No Libraries)
- **Pentatonic Musical Scale Mapping**: Maps raw environmental values to frequencies using a consonant C-major/A-minor pentatonic scale spanning 3 octaves (C3 ~130.8 Hz to C6 ~1046.5 Hz). All notes sound musical, harmonious, and pleasant.
- **Microtonal Continuous Pitch Option**: Toggle between scale-snapped discrete musical notes or smooth continuous microtonal frequencies.
- **Synthesized Instruments**:
  - `Pure Sine`: Clean, ethereal tone.
  - `Warm Triangle`: Rich ambient woodwind tone with overtone harmonics.
  - `Soft Pluck`: Synthesized acoustic string pluck with snappy attack and dynamic low-pass filter decay.
- **Record High / Low Audio Signatures**:
  - *Record High*: Bright ascending two-tone celestial chime arpeggio.
  - *Record Low*: Deep resonant gong tone.
- **Stereo Spatial Sonification (Compare Two Locations Mode)**:
  - Location A is panned to the **Left Channel** (`StereoPannerNode` = -0.75).
  - Location B is panned to the **Right Channel** (`StereoPannerNode` = +0.75).
  - Listeners hear regional climate divergence in stereo space simultaneously!
- **Secondary Variable Layer**: Modulates master volume or tone dynamics using a second variable (e.g., precipitation or humidity).
- **Browser Autoplay Compliance**: Suspends AudioContext until explicit user interaction, with visible audio state badge and prompt.

### 3. Spoken Climate Summaries (Web Speech API)
- Real-time text-to-speech synthesis using `window.speechSynthesis`.
- Automatically speaks concise summaries in **English** and **Arabic**, for example:
  > *"Temperature in Zagazig rose 0.43°C per decade since 1990, a statistically significant change. The all-time record high of 23.4°C was reached in 2018."*
  > *"ارتفعت درجة الحرارة في الزقازيق بمعدل 0.43 م° لكل عقد منذ عام 1990، وهو تغير دال إحصائياً."*

### 4. Climate Statistics & Significance Testing in Plain JS
- **Linear Regression Slope ($m$) & Intercept ($b$)** computed from scratch.
- **Change per Decade**: $m \times 10$.
- **Percent Change**: Relative to baseline fitted start value.
- **Student's t-Statistic & Two-Tailed p-Value**: Implemented via Lanczos log-gamma and regularized incomplete beta continued fractions ($df = N - 2$). Automatically flags trends as **Statistically Significant ($p < 0.05$)**.

### 5. Accessibility (Top Priority)
- **100% Keyboard Operable**:
  - <kbd>Space</kbd>: Play / Pause playback
  - <kbd>←</kbd> / <kbd>→</kbd>: Step 1 year backward / forward
  - <kbd>↑</kbd> / <kbd>↓</kbd>: Cycle playback speed
  - <kbd>M</kbd>: Toggle Mute
  - <kbd>H</kbd>: Open Keyboard Shortcuts help modal
  - <kbd>Esc</kbd>: Close modal dialogs
- **Screen Reader Announcements**: Live `aria-live="polite"` region continuously announces year, variable, value, and record events.
- **High Contrast Mode**: Toggle ultra-high contrast palette (pure `#000000` dark background, `#ffffff` text, vivid `#ffff00` borders) exceeding WCAG AAA (> 7:1) contrast ratios.
- **Large Text Mode**: Increases base font sizes and interactive button touch targets to $\ge 48\text{px}$.
- **Prefers-Reduced-Motion**: Respects system animation preferences.
- **Semantic Data Table**: Accessible alternative to the chart with `<table>`, `<caption>`, and `<th scope="col">` elements, plus one-click CSV download.
- **Skip-to-Content Link**: Direct keyboard navigation to main content.

### 6. Bilingual Support (English & Arabic RTL)
- Complete dictionary for English and Arabic.
- Dynamic `dir="rtl"` and `lang="ar"` switching with CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline-start`).

---

## 🛰️ NASA Data Sources & Methodology

### A. Temperature & Climate Mode (NASA POWER API + GIBS)
Data is obtained from the **NASA POWER API (Prediction Of Worldwide Energy Resources)** provided by the NASA Langley Research Center:
- **API Endpoint**: `https://power.larc.nasa.gov/api/temporal/monthly/point`
- **Supported Variables**:
  - `T2M`: Temperature at 2 Meters (°C)
  - `PRECTOTCORR`: Precipitation Corrected (mm/day)
  - `RH2M`: Relative Humidity at 2 Meters (%)
  - `ALLSKY_SFC_SW_DWN`: All Sky Surface Shortwave Downward Irradiance (kW-hr/m²/day)
- **Temperature View GIBS Layers**: `MODIS_Terra_Land_Surface_Temp_Day`, `MODIS_Terra_CorrectedReflectance_TrueColor`, `IMERG_Precipitation_Rate`, `MODIS_Terra_NDVI_8Day`.
- **Temporal Range**: 1990 to 2025 (latest full calendar year).

### B. Pollution Stages Mode (3 Stages × 3 Verified NASA GIBS Animations)
Every dataset ID, TileMatrixSet, colormap XML, and date range below was verified live against NASA GIBS WMTS `GetCapabilities` and NASA POWER `/api/system/manager/parameters`:

#### Stage 1: Air Pollution
1. **Aerosol Optical Depth (PM2.5 Proxy)** — `MERRA2_Aerosol_Optical_Depth_Analysis_Monthly` (`NASA GMAO / MERRA-2`, `1980-01-01` → `2026-08-01`, `AOD`), paired with NASA POWER `AOD_55`. Clearly labeled as a **PM2.5 Proxy (AOD)**.
2. **Total Column Ozone (O₃)** — `OMI_Ozone_DOAS_Total_Column` (`NASA Aura / OMI`, `2004-10-01` → `2026-11-09`, `DU`), paired with NASA POWER `TO3`.
3. **Carbon Monoxide (CO at 500 hPa)** — `AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Monthly_Day` (`NASA JPL / Aqua AIRS`, `2002-09-01` → `2026-09-01`, `ppbv`).

#### Stage 2: Water Pollution
4. **Chlorophyll-a (Algal Blooms)** — `MODIS_Aqua_L2_Chlorophyll_A` (`NASA OBPG / Aqua MODIS`, `2002-07-04` → `2026-11-12`, `mg/m³`).
5. **Sea Surface Temperature (Thermal Stress)** — `MODIS_Aqua_L3_SST_Thermal_4km_Day_Monthly` (`NASA OBPG / PO.DAAC`, `2002-07-01` → `2026-04-01`, `°C`).
6. **Ocean Color & Coastal Turbidity Proxy** — `MODIS_Aqua_CorrectedReflectance_TrueColor` (`NASA LANCE / Aqua MODIS`, `2002-07-03` → present, `% Luminance`). Clearly labeled as an **Optical Turbidity / Ocean Color Proxy**.

#### Stage 3: Soil Pollution (Labeled Honestly as Soil Condition Indicators)
7. **Surface Soil Moisture** — `SMAP_L4_Analyzed_Surface_Soil_Moisture` (`NASA GSFC GMAO / SMAP L4`, `2015-03-31` → `2026-11-10`, `m³/m³`), paired with NASA POWER `GWETTOP` & `GWETROOT`.
8. **Vegetation Health Index (NDVI)** — `MODIS_Terra_L3_NDVI_Monthly` (`NASA LP DAAC / Terra MODIS`, `2000-03-01` → `2026-10-01`, skipping GIBS gap `2025-04-01`, `NDVI`).
9. **Land Surface Temperature (Soil Heat Stress)** — `MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day` (`NASA LP DAAC / Terra MODIS`, `2000-03-01` → `2026-10-01`, Kelvin converted to `°C`), paired with NASA POWER `TS`.

### C. Pixel-to-Sound Pipeline & Scientific Limitations
- **Offscreen Canvas Sampling**: Coordinates `(lat, lon)` map to Web Mercator tile `(z, y, x)` and pixel `(px, py)` loaded with `crossOrigin="anonymous"`.
- **Colormap XML Lookup**: RGB is matched via Euclidean distance against NASA GIBS v1.3 Colormap XMLs (with Kelvin-to-Celsius conversion where applicable), or perceived luminance (`0.299R + 0.587G + 0.114B`) for true-color imagery.
- **Game Export**: Browser-side composite export via `JSZip` (PNG sequence + `frames_metadata.json`), HTML5 `canvas.captureStream()` + `MediaRecorder` (`.webm`), and JSON time-series export.
- **Limitations**: Satellite sensors cannot directly detect chemical soil toxins (heavy metals/pesticides); AOD (~50 km) is a column proxy rather than breathing-height PM2.5; true-color brightness includes clouds; optical layers (Chlorophyll-a, NDVI) can show cloud/orbital swath gaps; coarse grids (4–50 km) smooth hyper-local variations.

---

## 🎵 How Sonification Works

The sound synthesis is built directly with the browser's **Web Audio API**:

$$\text{Normalized Value } u = \frac{\text{Value} - \text{Min}}{\text{Max} - \text{Min}}$$

1. **Pitch Quantization**: The normalized value $u \in [0, 1]$ maps across 16 discrete notes of a **Major Pentatonic Scale** ($C_3$ to $C_6$):
   $$\text{Frequencies: } [130.81, 146.83, 164.81, 196.00, 220.00, \dots, 1046.50]\text{ Hz}$$
   Because pentatonic scales contain no harsh semitones or tritones, every note combination and sequence sounds melodic and pleasant to human ears. Higher pollution or indicator values map to higher musical pitches.
2. **Audio Nodes Topology**:
   ```
   OscillatorNode ──► BiquadFilter ──► GainNode (Envelope) ──► StereoPannerNode ──► AudioDestination
   ```
3. **Stereo Spatial Separation**: In comparison mode, `StereoPannerNode` separates the two regions into distinct ears ($L = -0.75$, $R = +0.75$). Listeners perceive environmental discrepancies as pitch intervals across stereo space.
4. **Record Cues**:
   - *Record High*: Triggers a high-frequency three-tone ascending arpeggio ($A_5 \to D_6 \to A_6$) with shimmering envelope.
   - *Record Low*: Triggers a decaying sub-bass triangle tone ($G_2 \to C_2$).

---

## 🚀 Getting Started

### Prerequisites
- Node.js $\ge 18.0.0$
- npm or pnpm

### Installation & Local Run
```bash
# 1. Clone or navigate into the repository
cd Nasa

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser:
# http://localhost:3000
```

### Production Build
```bash
# Build optimized static distribution
npm run build

# Preview production build locally
npm run preview
```

The resulting `dist/` folder is 100% self-contained and ready for instant deployment to **Vercel**, **GitHub Pages**, or **Netlify** with zero backend configuration.

---

## 📂 Project Architecture

```
Nasa/
├── index.html                    # Root HTML with skip link, fonts & meta
├── package.json                  # Dependencies: react, leaflet, chart.js, lucide-react
├── vite.config.js                # Optimized rollup chunking
├── README.md                     # Documentation & NASA Space Apps notes
└── src/
    ├── main.jsx                  # React application entry point
    ├── App.jsx                   # Master state container & layout
    ├── components/
    │   ├── Header.jsx            # Brand, NASA badge, language/contrast/audio toggles
    │   ├── MapPicker.jsx         # Leaflet interactive map, presets, heat overlay
    │   ├── TimelineChart.jsx     # Chart.js line chart with animated year cursor
    │   ├── TimelineControls.jsx  # Play/pause, scrub slider, speed, loop
    │   ├── AudioControls.jsx     # Volume, instrument timbre, scale, 2nd layer
    │   ├── InsightsPanel.jsx     # Plain language summaries, statistics, TTS speech
    │   ├── DataTable.jsx         # Semantic, accessible table view & CSV export
    │   ├── KeyboardShortcutsModal.jsx # Accessible shortcuts dialog
    │   └── AboutModal.jsx        # Project context, data sources, methodology
    ├── hooks/
    │   ├── useNasaPower.js       # NASA POWER data fetching, caching, stats
    │   ├── useSonification.js    # Web Audio API engine & synchronized playback
    │   ├── useSpeechSummary.js   # Web Speech API (TTS) in English & Arabic
    │   └── useKeyboardShortcuts.js # Global accessible keyboard handlers
    ├── services/
    │   └── nasaApi.js            # NASA POWER endpoint, parameters, fallback dataset
    ├── utils/
    │   ├── statistics.js         # Linear regression, t-test, p-value in plain JS
    │   ├── audioUtils.js         # Pentatonic scale, Web Audio synthesizers, panning
    │   ├── translations.js       # English and Arabic bilingual dictionaries
    │   └── __tests__/
    │       └── verify_math.js    # Math and statistical verification test suite
    └── styles/
        └── index.css             # Cosmic theme, WCAG AAA contrast, RTL logical styles
```

---

## 🏆 NASA Space Apps Challenge Alignment

- **Challenge**: The Earth Information Jukebox
- **Objective**: Translate Earth science data into auditory and multisensory experiences to make environmental change understandable and accessible to all audiences, particularly individuals with visual impairments.
- **Impact**: Demonstrates how NASA POWER open science data can be transformed into accessible musical stories that bridge science, accessibility, and art.

---

## 📄 License
MIT License. Created for the NASA Space Apps Challenge.
