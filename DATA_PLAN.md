# DATA_PLAN.md — Verified NASA Datasets for Earth Jukebox Pollution Stages

This document records the research and live API verification performed before extending **Earth Jukebox** with the 3-stage **Pollution Stages** module (9 animated NASA data views for Air, Water, and Soil).

Every layer ID, tile matrix set, date range, colormap XML, legend SVG, and NASA POWER parameter listed below was verified directly against live NASA endpoints. No synthetic or mock datasets are used anywhere.

---

## 1. Reference Documentation & Verification Endpoints

| Resource | URL | Verified Purpose |
|---|---|---|
| NASA Space Apps Challenge ("The Earth Information Jukebox") | `https://www.spaceappschallenge.org/` | Challenge brief: pair NASA Earth visuals with real-time sonification for accessibility and multi-sensory exploration. |
| NASA Earth Information Center (EIC) | `https://earth.gov/` | EIC themes covering Air Quality, Water Resources, Agriculture/Land, and Climate Indicators. |
| NASA GIBS API Documentation | `https://nasa-gibs.github.io/gibs-api-docs/` | WMTS RESTful tile template, EPSG:3857 Web Mercator matrix sets, Colormaps v1.3, and Legends. |
| NASA GIBS WMTS GetCapabilities | `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&request=GetCapabilities` | Authoritative registry of 1,000+ GIBS layer IDs, formats, tile matrix sets, date intervals, and colormap links. |
| NASA POWER API Documentation | `https://power.larc.nasa.gov/docs/services/api/` | Monthly & point time-series REST API specification. |
| NASA POWER Parameters Registry | `https://power.larc.nasa.gov/api/system/manager/parameters?community=AG&temporal=monthly` | Verified parameter IDs (`T2M`, `PRECTOTCORR`, `RH2M`, `ALLSKY_SFC_SW_DWN`, `AOD_55`, `TO3`, `GWETTOP`, `GWETROOT`, `TS`). |

---

## 2. Stage 1 — Air Pollution (3 Animations)

### 1.1 Aerosol Optical Depth (PM2.5 Proxy)
- **Role in Game / Stage**: Air Pollution — Animation 1 (Fine Particulate Matter / Haze & Smoke Proxy)
- **Honest Proxy Note**: NASA GIBS does not provide an ongoing multi-year global surface PM2.5 time-series layer (the GIBS `Particulate_Matter_Below_2.5micrometers_*` layers are static multi-year averages for 2001–2010 and 2010–2012 with no time dimension, and `MERRA2_Dust_Surface_Mass_Concentration_PM25_Monthly` covers only mineral dust). Therefore, **MERRA-2 Total Aerosol Optical Depth (550 nm)** is used as the standard satellite proxy for column aerosol loading / PM2.5 pollution, and is explicitly labeled as a **PM2.5 Proxy (Column AOD)** in the UI.
- **GIBS Layer ID**: `MERRA2_Aerosol_Optical_Depth_Analysis_Monthly`
- **GIBS Title**: Aerosol Optical Depth (Analysis, Monthly, MERRA2)
- **Provider**: NASA GMAO (Global Modeling and Assimilation Office) / MERRA-2 via NASA EOSDIS GIBS
- **Variable & Unit**: Column Aerosol Optical Depth at 550 nm (dimensionless; colormap range `0.000` to `0.900+`)
- **Tile Format & Matrix Set**: `image/png`, `GoogleMapsCompatible_Level6` (native zoom 0–6)
- **Real Available Date Range (GetCapabilities)**: `1980-01-01` to `2026-08-01` (`P1M` monthly)
- **Time-Lapse Default Cadence**: Monthly steps (`YYYY-MM-01`) or Yearly July peak (`YYYY-07-01`)
- **Colormap v1.3**: `https://gibs.earthdata.nasa.gov/colormaps/v1.3/MERRA2_Aerosol_Optical_Depth_Analysis_Monthly.xml`
- **Legend SVG**: `https://gibs.earthdata.nasa.gov/legends/MERRA2_Aerosol_Optical_Depth_Analysis_Monthly_H.svg`
- **Paired NASA POWER Parameter**: `AOD_55` (*Aerosol Optical Depth 55*, dimensionless, verified 2001–2024 in POWER monthly point API)
- **Verification URLs**:
  - `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&request=GetCapabilities`
  - `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MERRA2_Aerosol_Optical_Depth_Analysis_Monthly/default/2024-07-01/GoogleMapsCompatible_Level6/4/6/9.png` (HTTP 200, `Access-Control-Allow-Origin: *`)

### 1.2 Total Column Ozone (O₃)
- **Role in Game / Stage**: Air Pollution — Animation 2 (Atmospheric Ozone)
- **GIBS Layer ID**: `OMI_Ozone_DOAS_Total_Column`
- **GIBS Title**: Ozone (DOAS, v3, Standard, OMI, Aura)
- **Provider**: NASA Aura / OMI (Ozone Monitoring Instrument) via NASA EOSDIS GIBS
- **Variable & Unit**: Total Column Ozone in Dobson Units (`DU`; colormap range `100.00` to `500.00+ DU`)
- **Tile Format & Matrix Set**: `image/png`, `GoogleMapsCompatible_Level6` (native zoom 0–6)
- **Real Available Date Range (GetCapabilities)**: `2004-10-01` to `2026-11-09` (`P1D` daily; sampled monthly on the 15th `YYYY-MM-15` for smooth multi-year/monthly time-lapse)
- **Colormap v1.3**: `https://gibs.earthdata.nasa.gov/colormaps/v1.3/OMI_Ozone_DOAS_Total_Column.xml`
- **Legend SVG**: `https://gibs.earthdata.nasa.gov/legends/OMI_Ozone_DOAS_Total_Column_H.svg`
- **Paired NASA POWER Parameter**: `TO3` (*Total Column Ozone*, `Dobsons`, verified 2000–2024 in POWER monthly point API)
- **Scientific Limitation Note**: Column ozone measures the full atmospheric column (mostly stratospheric ozone shield + tropospheric ozone), not ground-level urban smog alone.
- **Verification URLs**:
  - `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/OMI_Ozone_DOAS_Total_Column/default/2024-07-15/GoogleMapsCompatible_Level6/4/6/9.png` (HTTP 200, `Access-Control-Allow-Origin: *`)

### 1.3 Carbon Monoxide (CO) Mixing Ratio
- **Role in Game / Stage**: Air Pollution — Animation 3 (Combustion & Wildfire Gas Tracer)
- **GIBS Layer ID**: `AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Monthly_Day`
- **GIBS Title**: Carbon Monoxide Volume Mixing Ratio at 500hPa (L3, Daytime/Ascending, Monthly, AIRS, Aqua)
- **Provider**: NASA JPL / Aqua AIRS (Atmospheric Infrared Sounder) via NASA EOSDIS GIBS
- **Variable & Unit**: Carbon Monoxide Volume Mixing Ratio at 500 hPa in parts per billion by volume (`ppbv`; colormap range `0.0` to `350.0+ ppbv`)
- **Tile Format & Matrix Set**: `image/png`, `GoogleMapsCompatible_Level6` (native zoom 0–6)
- **Real Available Date Range (GetCapabilities)**: `2002-09-01` to `2026-09-01` (`P1M` monthly)
- **Colormap v1.3**: `https://gibs.earthdata.nasa.gov/colormaps/v1.3/AIRS_Carbon_Monoxide_Volume_Mixing_Ratio.xml`
- **Legend SVG**: `https://gibs.earthdata.nasa.gov/legends/AIRS_Carbon_Monoxide_Volume_Mixing_Ratio_H.svg`
- **Alternative Verified Layer**: `MOPITT_CO_Monthly_Surface_Mixing_Ratio_Day` (`2000-04-01` to `2024-11-01`). AIRS L3 Monthly was selected as primary because it continues through `2026-09-01` with complete global monthly composites.
- **Verification URLs**:
  - `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Monthly_Day/default/2024-07-01/GoogleMapsCompatible_Level6/4/6/9.png` (HTTP 200, `Access-Control-Allow-Origin: *`)

---

## 3. Stage 2 — Water Pollution (3 Animations)

### 2.1 Ocean Chlorophyll-a (Algal Blooms & Eutrophication Indicator)
- **Role in Game / Stage**: Water Pollution — Animation 1 (Phytoplankton / Harmful Algal Bloom Indicator)
- **GIBS Layer ID**: `MODIS_Aqua_L2_Chlorophyll_A`
- **GIBS Title**: Chlorophyll A (L2, MODIS, Aqua)
- **Provider**: NASA OBPG (Ocean Biology Processing Group) / Aqua MODIS via NASA EOSDIS GIBS
- **Variable & Unit**: Near-surface Chlorophyll-a concentration in `mg/m³` (colormap range `0.0100` to `20.000+ mg/m³`)
- **Tile Format & Matrix Set**: `image/png`, `GoogleMapsCompatible_Level7` (native zoom 0–7)
- **Real Available Date Range (GetCapabilities)**: `2002-07-04` to `2026-11-12` (`P1D` daily; sampled monthly on the 15th `YYYY-MM-15` or yearly peak)
- **Colormap v1.3**: `https://gibs.earthdata.nasa.gov/colormaps/v1.3/MODIS_Chlorophyll.xml`
- **Legend SVG**: `https://gibs.earthdata.nasa.gov/legends/MODIS_Chlorophyll_H.svg`
- **Limitation Note**: Optical ocean-color retrievals have gaps under clouds and sun glint and only cover oceans/large coastal water bodies (not small inland rivers).
- **Verification URLs**:
  - `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L2_Chlorophyll_A/default/2024-07-15/GoogleMapsCompatible_Level7/4/6/9.png` (HTTP 200, `Access-Control-Allow-Origin: *`)

### 2.2 Sea Surface Temperature (Thermal Stress & Hypoxia Risk)
- **Role in Game / Stage**: Water Pollution — Animation 2 (Marine Thermal Stress & Oxygen Depletion Driver)
- **GIBS Layer ID**: `MODIS_Aqua_L3_SST_Thermal_4km_Day_Monthly`
- **GIBS Title**: Sea Surface Temperature (L3, Day, Monthly, Thermal, 4 km, MODIS, Aqua)
- **Provider**: NASA OBPG / PO.DAAC / Aqua MODIS via NASA EOSDIS GIBS
- **Variable & Unit**: Sea Surface Temperature in degrees Celsius (`°C`; colormap range `0.00` to `32.00+ °C`)
- **Tile Format & Matrix Set**: `image/png`, `GoogleMapsCompatible_Level6` (native zoom 0–6)
- **Real Available Date Range (GetCapabilities)**: `2002-07-01` to `2026-04-01` (`P1M` monthly)
- **Colormap v1.3**: `https://gibs.earthdata.nasa.gov/colormaps/v1.3/MODIS_Sea_Surface_Temperature.xml`
- **Legend SVG**: `https://gibs.earthdata.nasa.gov/legends/MODIS_Sea_Surface_Temperature_H.svg`
- **Limitation Note**: Note that `SMAP_L3_Sea_Surface_Salinity_CAP_Monthly` was also checked but had multi-month data gaps in 2024 (HTTP 404 for 2024-07-01), whereas `MODIS_Aqua_L3_SST_Thermal_4km_Day_Monthly` provides reliable monthly 4 km global ocean coverage from 2002 to 2026-04.
- **Verification URLs**:
  - `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3_SST_Thermal_4km_Day_Monthly/default/2024-07-01/GoogleMapsCompatible_Level6/4/6/9.png` (HTTP 200, `Access-Control-Allow-Origin: *`)

### 2.3 Ocean Color & Coastal Turbidity / Sediment Plumes (True Color Reflectance)
- **Role in Game / Stage**: Water Pollution — Animation 3 (Coastal Sediment Runoff, River Plumes & Turbidity Indicator)
- **Honest Proxy Note**: NASA GIBS GetCapabilities does not expose a dedicated long-running `Kd490` or `TSS` (Total Suspended Solids) numeric colormap layer. Instead, NASA Earth Observatory and EIC use **MODIS Aqua Corrected Reflectance (True Color)** to observe coastal sediment plumes, murky runoff, and nearshore algal discoloration. In our sonification engine, True Color pixels are converted using perceived luminance (`Y = 0.299R + 0.587G + 0.114B`, normalized 0–1) so brighter sediment-laden plumes and turbid water sound higher in pitch than deep clear ocean water. Clearly labeled as an **Optical Turbidity / Ocean Color Visual Proxy** in the UI.
- **GIBS Layer ID**: `MODIS_Aqua_CorrectedReflectance_TrueColor`
- **GIBS Title**: Corrected Reflectance (True Color, MODIS, Aqua)
- **Provider**: NASA EOSDIS GIBS / LANCE MODIS Aqua
- **Variable & Unit**: Optical Surface Reflectance / Perceived Luminance (`0–100%` normalized brightness)
- **Tile Format & Matrix Set**: `image/jpeg`, `GoogleMapsCompatible_Level9` (native zoom 0–9)
- **Real Available Date Range (GetCapabilities)**: `2002-07-03` to present (`P1D` daily; sampled monthly on the 15th `YYYY-MM-15`)
- **Colormap v1.3**: None (True Color RGB; uses luminance lookup)
- **Verification URLs**:
  - `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/2024-07-15/GoogleMapsCompatible_Level9/4/6/9.jpeg` (HTTP 200, `Access-Control-Allow-Origin: *`)

---

## 4. Stage 3 — Soil Pollution / Soil Condition Indicators (3 Animations)

> **Scientific Integrity Disclosure**: NASA satellites do **not** directly measure chemical soil contamination (heavy metals, pesticides, plastics, or industrial toxins). All three layers in Stage 3 are explicitly labeled in the UI and exports as **Soil Condition Indicators** (moisture, vegetation stress, and thermal stress) that help identify land degradation, drought stress, and ecological vulnerability.

### 3.1 Surface Soil Moisture (SMAP L4 + POWER Soil Wetness)
- **Role in Game / Stage**: Soil Condition — Animation 1 (Soil Moisture & Drought/Waterlogging Indicator)
- **GIBS Layer ID**: `SMAP_L4_Analyzed_Surface_Soil_Moisture`
- **GIBS Title**: Surface Soil Moisture (L4, 12z Instantaneous, Model Value-Added, SMAP)
- **Provider**: NASA GSFC GMAO / SMAP (Soil Moisture Active Passive) via NASA EOSDIS GIBS
- **Variable & Unit**: Volumetric Surface Soil Moisture (`m³/m³`; colormap range `0.000` to `0.700+ m³/m³`)
- **Tile Format & Matrix Set**: `image/png`, `GoogleMapsCompatible_Level6` (native zoom 0–6)
- **Real Available Date Range (GetCapabilities)**: `2015-03-31` to `2026-11-10` (`P1D` daily; sampled monthly on the 15th `YYYY-MM-15`)
- **Colormap v1.3**: `https://gibs.earthdata.nasa.gov/colormaps/v1.3/SMAP_Analyzed_Soil_Moisture.xml`
- **Legend SVG**: `https://gibs.earthdata.nasa.gov/legends/SMAP_Analyzed_Soil_Moisture_H.svg`
- **Paired NASA POWER Parameters**:
  - `GWETTOP` (*Surface Soil Wetness*, 0–5 cm, dimensionless `0..1`, verified 2000–2024 in POWER monthly point API)
  - `GWETROOT` (*Root Zone Soil Wetness*, 0–100 cm, dimensionless `0..1`, verified 2000–2024 in POWER monthly point API)
- **Verification URLs**:
  - `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Surface_Soil_Moisture/default/2024-07-15/GoogleMapsCompatible_Level6/4/6/9.png` (HTTP 200, `Access-Control-Allow-Origin: *`)
  - `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=GWETTOP,GWETROOT&community=AG&longitude=31.5020&latitude=30.5877&start=2000&end=2024&format=JSON`

### 3.2 Vegetation Health Index (NDVI)
- **Role in Game / Stage**: Soil Condition — Animation 2 (Plant Cover & Land Degradation Indicator)
- **GIBS Layer ID**: `MODIS_Terra_L3_NDVI_Monthly`
- **GIBS Title**: Vegetation Index (L3, Monthly, MODIS, Terra)
- **Provider**: NASA LP DAAC / Terra MODIS via NASA EOSDIS GIBS
- **Variable & Unit**: Normalized Difference Vegetation Index (`NDVI`, dimensionless `0.00` to `1.00`)
- **Tile Format & Matrix Set**: `image/png`, `GoogleMapsCompatible_Level7` (native zoom 0–7)
- **Real Available Date Range (GetCapabilities)**: `2000-03-01` to `2026-10-01` (`P1M` monthly; note brief gap `2025-04-01` between `2000-03-01/2025-03-01` and `2025-05-01/2026-10-01`)
- **Colormap v1.3**: `https://gibs.earthdata.nasa.gov/colormaps/v1.3/MODIS_L3_NDVI.xml`
- **Legend SVG**: `https://gibs.earthdata.nasa.gov/legends/MODIS_L3_NDVI_H.svg`
- **Sonification Polarity Note**: For NDVI, higher vegetation greenness = healthier canopy (and higher degradation/barrenness corresponds to lower NDVI). In standard sonification, higher data value = higher pitch, and UI explains clearly that drops in NDVI signal vegetation stress.
- **Verification URLs**:
  - `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_NDVI_Monthly/default/2024-07-01/GoogleMapsCompatible_Level7/4/6/9.png` (HTTP 200, `Access-Control-Allow-Origin: *`)

### 3.3 Land Surface Temperature (Soil Thermal Stress)
- **Role in Game / Stage**: Soil Condition — Animation 3 (Surface Heat Island & Soil Aridity Stress Indicator)
- **GIBS Layer ID**: `MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day`
- **GIBS Title**: Land Surface Temperature (L3, Monthly, Day, MODIS, Terra)
- **Provider**: NASA LP DAAC / Terra MODIS via NASA EOSDIS GIBS
- **Variable & Unit**: Daytime Land Surface Temperature (GIBS Colormap v1.3 stores values in Kelvin `K` `[200.0 .. 350.0+ K]`, converted in app to degrees Celsius `°C = K - 273.15`)
- **Tile Format & Matrix Set**: `image/png`, `GoogleMapsCompatible_Level6` (native zoom 0–6)
- **Real Available Date Range (GetCapabilities)**: `2000-03-01` to `2026-10-01` (`P1M` monthly)
- **Colormap v1.3**: `https://gibs.earthdata.nasa.gov/colormaps/v1.3/MODIS_Land_Surface_Temp.xml`
- **Legend SVG**: `https://gibs.earthdata.nasa.gov/legends/MODIS_Land_Surface_Temp_H.svg`
- **Paired NASA POWER Parameter**: `TS` (*Earth Skin Temperature*, `°C`, verified 2000–2024 in POWER monthly point API)
- **Verification URLs**:
  - `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day/default/2024-07-01/GoogleMapsCompatible_Level6/4/6/9.png` (HTTP 200, `Access-Control-Allow-Origin: *`)
