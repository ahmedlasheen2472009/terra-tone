/**
 * Verified NASA Pollution Stages Configuration (3 Stages x 3 Animations = 9 Views)
 * All Layer IDs, Colormaps, TileMatrixSets, and Date Ranges verified against:
 * https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&request=GetCapabilities
 * Paired NASA POWER parameters verified against:
 * https://power.larc.nasa.gov/api/system/manager/parameters?community=AG&temporal=monthly
 */

export const POLLUTION_STAGES = [
  {
    id: 'air',
    stageNumber: 1,
    titleEn: 'Stage 1: Air Pollution',
    titleAr: 'المرحلة 1: تلوث الهواء',
    shortEn: 'Air Pollution',
    shortAr: 'تلوث الهواء',
    subtitleEn: 'Atmospheric aerosols (PM2.5 proxy), total column ozone (O₃), and carbon monoxide (CO).',
    subtitleAr: 'الهباء الجوي (كمؤشر للجسيمات الدقيقة PM2.5)، وإجمالي عمود الأوزون، وأول أكسيد الكربون.',
    accentColor: '#38bdf8',
    honestyBannerEn: null,
    honestyBannerAr: null,
    presets: [
      { id: 'cairo', nameEn: 'Cairo', nameAr: 'القاهرة', lat: 30.0444, lon: 31.2357 },
      { id: 'delhi', nameEn: 'Delhi', nameAr: 'دلهي', lat: 28.6139, lon: 77.2090 },
      { id: 'beijing', nameEn: 'Beijing', nameAr: 'بكين', lat: 39.9042, lon: 116.4074 },
      { id: 'los_angeles', nameEn: 'Los Angeles', nameAr: 'لوس أنجلوس', lat: 34.0522, lon: -118.2437 }
    ],
    defaultZoom: 4,
    animations: [
      {
        id: 'air_aod',
        stageId: 'air',
        gibsLayerId: 'MERRA2_Aerosol_Optical_Depth_Analysis_Monthly',
        colormapId: 'MERRA2_Aerosol_Optical_Depth_Analysis_Monthly',
        legendUrl: 'https://gibs.earthdata.nasa.gov/legends/MERRA2_Aerosol_Optical_Depth_Analysis_Monthly_H.svg',
        tileMatrixSet: 'GoogleMapsCompatible_Level6',
        maxNativeZoom: 6,
        ext: 'png',
        titleEn: 'Aerosol Optical Depth (PM2.5 Proxy)',
        titleAr: 'العمق البصري للهباء الجوي (مؤشر PM2.5)',
        provider: 'NASA GMAO / MERRA-2',
        variableEn: 'Aerosol Optical Depth (550 nm)',
        variableAr: 'العمق البصري للهباء الجوي',
        unitEn: 'AOD',
        unitAr: 'AOD',
        isProxy: true,
        proxyBadgeEn: 'PM2.5 Proxy (AOD)',
        proxyBadgeAr: 'بديل PM2.5 (هباء جوي)',
        availableRange: { start: '1980-01-01', end: '2026-08-01' },
        cadenceType: 'monthly_first',
        defaultMonthlyStart: '2024-01-01',
        defaultMonthlyEnd: '2026-08-01',
        defaultYearlyRange: { startYear: 2012, endYear: 2026, month: '07', day: '01' },
        valueDomain: { min: 0, max: 0.9 },
        pairedPowerParam: 'AOD_55',
        whatItIsEn: 'Aerosol Optical Depth (AOD) measures how much sunlight is scattered or absorbed by airborne particles like dust, smoke, urban haze, and sulfates. Because NASA GIBS does not offer a continuously updated global surface PM2.5 time-series layer, total AOD is used here as a scientific proxy for fine particulate air pollution.',
        whatItIsAr: 'يقيس العمق البصري للهباء الجوي (AOD) مقدار حجب الجسيمات العالقة في الهواء (كالغبار والدخان والضباب الدخاني) لأشعة الشمس. ونظراً لعدم توفر طبقة محدثة يومياً للجسيمات الدقيقة PM2.5 في GIBS، يُستخدم هذا المقياس كمؤشر علمي بديل لتلوث الجسيمات الدقيقة.',
        whyItMattersEn: 'High aerosol concentrations reduce visibility and correlate with elevated PM2.5 exposure, which can trigger asthma, cardiovascular strain, and respiratory illness.',
        whyItMattersAr: 'تشير القيم المرتفعة للهباء الجوي إلى زيادة تركيز الجسيمات العالقة التي تؤثر على جودة التنفس وصحة القلب والرئتين.',
        whatTrendShowsEn: 'Seasonal spikes reveal dust storms, wildfire smoke plumes, and industrial haze peaks across cities and deserts.',
        whatTrendShowsAr: 'تُظهر الذروات الموسمية عواصف الغبار، وأعمدة دخان الحرائق، وموجات الضباب الدخاني الحضري.',
        limitationEn: 'Proxy metric: measures total atmospheric column aerosols (~50 km MERRA-2 grid), not ground-level PM2.5 µg/m³ directly.',
        limitationAr: 'مؤشر بديل: يقيس الهباء الجوي في كامل العمود الجوي بدقة ~50 كم، وليس تركيز PM2.5 على مستوى التنفس مباشرة.'
      },
      {
        id: 'air_ozone',
        stageId: 'air',
        gibsLayerId: 'OMI_Ozone_DOAS_Total_Column',
        colormapId: 'OMI_Ozone_DOAS_Total_Column',
        legendUrl: 'https://gibs.earthdata.nasa.gov/legends/OMI_Ozone_DOAS_Total_Column_H.svg',
        tileMatrixSet: 'GoogleMapsCompatible_Level6',
        maxNativeZoom: 6,
        ext: 'png',
        titleEn: 'Total Column Ozone (O₃)',
        titleAr: 'إجمالي عمود الأوزون (O₃)',
        provider: 'NASA Aura / OMI (DOAS v3)',
        variableEn: 'Total Column Ozone',
        variableAr: 'إجمالي عمود الأوزون',
        unitEn: 'DU',
        unitAr: 'وحدة دوبسون',
        isProxy: false,
        proxyBadgeEn: 'Total Column O₃',
        proxyBadgeAr: 'عمود الأوزون الكلي',
        availableRange: { start: '2004-10-01', end: '2026-10-15' },
        cadenceType: 'daily_midmonth',
        defaultMonthlyStart: '2024-01-15',
        defaultMonthlyEnd: '2026-10-15',
        defaultYearlyRange: { startYear: 2012, endYear: 2026, month: '09', day: '15' },
        valueDomain: { min: 200, max: 450 },
        pairedPowerParam: 'TO3',
        whatItIsEn: 'Total Column Ozone (measured in Dobson Units, DU) represents the total amount of ozone gas from Earth’s surface up to the top of the stratosphere, observed daily by NASA’s Aura OMI instrument.',
        whatItIsAr: 'يمثل إجمالي عمود الأوزون (بوحدة دوبسون DU) الكمية الكلية لغاز الأوزون من سطح الأرض حتى أعلى الغلاف الجوي عبر قمر أورا (Aura OMI).',
        whyItMattersEn: 'Stratospheric ozone shields life from harmful UV radiation, while excess ground-level ozone is a toxic respiratory pollutant. Tracking column changes helps monitor ozone depletion and atmospheric transport.',
        whyItMattersAr: 'يحمي أوزون الستراتوسفير الحياة من الأشعة فوق البنفسجية، بينما يضر الأوزون السطحي بالرئتين. يساعد التتبع على مراقبة التغيرات الموسمية وثقب الأوزون.',
        whatTrendShowsEn: 'Strong latitudinal bands and spring polar depletion cycles show how atmospheric circulation redistributes ozone around the globe.',
        whatTrendShowsAr: 'توضح الخرائط التوزيع عبر خطوط العرض والتغيرات الموسمية في طبقة الأوزون حول العالم.',
        limitationEn: 'Column measurement combines stratospheric (~90%) and tropospheric (~10%) ozone; daily frames may show narrow orbital gaps.',
        limitationAr: 'يقيس العمود الكلي الأوزون الستراتوسفيري والسطحي معاً، وقد تظهر فجوات مدارية بسيطة في بعض الأيام.'
      },
      {
        id: 'air_co',
        stageId: 'air',
        gibsLayerId: 'AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Monthly_Day',
        colormapId: 'AIRS_Carbon_Monoxide_Volume_Mixing_Ratio',
        legendUrl: 'https://gibs.earthdata.nasa.gov/legends/AIRS_Carbon_Monoxide_Volume_Mixing_Ratio_H.svg',
        tileMatrixSet: 'GoogleMapsCompatible_Level6',
        maxNativeZoom: 6,
        ext: 'png',
        titleEn: 'Carbon Monoxide (CO at 500 hPa)',
        titleAr: 'أول أكسيد الكربون (CO عند 500 هكتوباسكال)',
        provider: 'NASA JPL / Aqua AIRS (L3 Monthly)',
        variableEn: 'Carbon Monoxide Mixing Ratio',
        variableAr: 'نسبة مزج أول أكسيد الكربون',
        unitEn: 'ppbv',
        unitAr: 'جزء/مليار',
        isProxy: false,
        proxyBadgeEn: 'Combustion Tracer',
        proxyBadgeAr: 'مؤشر الاحتراق والحرائق',
        availableRange: { start: '2002-09-01', end: '2026-09-01' },
        skipDates: ['2025-05-01', '2025-06-01'],
        cadenceType: 'monthly_first',
        defaultMonthlyStart: '2024-01-01',
        defaultMonthlyEnd: '2026-09-01',
        defaultYearlyRange: { startYear: 2012, endYear: 2026, month: '08', day: '01' },
        valueDomain: { min: 40, max: 250 },
        pairedPowerParam: null,
        whatItIsEn: 'Carbon monoxide (CO) is a colorless, toxic gas produced by incomplete burning of fossil fuels, biomass, and wildfires. Aqua AIRS tracks mid-tropospheric CO concentrations globally every month in parts per billion by volume (ppbv).',
        whatItIsAr: 'أول أكسيد الكربون غاز سام ينتج عن الاحتراق غير الكامل للوقود الأحفوري وحرائق الغابات، ويرصده مسبار AIRS على القمر أكوا شهرياً بوحدة جزء في المليار (ppbv).',
        whyItMattersEn: 'CO persists for weeks in the atmosphere, travelling across oceans to degrade downwind air quality and contributing to ground-level ozone formation.',
        whyItMattersAr: 'يبقى الغاز لأسابيع في الجو وينتقل عبر القارات مسبباً تدهور جودة الهواء وتكوّن الأوزون السطحي الضار.',
        whatTrendShowsEn: 'Plumes highlight major wildfire seasons (Amazon, Central Africa, boreal forests) and urban/industrial combustion corridors.',
        whatTrendShowsAr: 'تُبرز الأعمدة المرتفعة مواسم حرائق الغابات الكبرى وممرات الانبعاثات الصناعية.',
        limitationEn: 'Measured at 500 hPa (~5.5 km altitude), capturing transported plumes rather than direct street-level exhaust.',
        limitationAr: 'يُقاس على مستوى ضغط 500 هكتوباسكال (~5.5 كم ارتفاعاً)، مما يعكس انتقال السحب الملوثة أكثر من عوادم الشوارع المباشرة.'
      }
    ]
  },
  {
    id: 'water',
    stageNumber: 2,
    titleEn: 'Stage 2: Water Pollution',
    titleAr: 'المرحلة 2: تلوث المياه',
    shortEn: 'Water Pollution',
    shortAr: 'تلوث المياه',
    subtitleEn: 'Ocean chlorophyll-a (algal blooms), sea surface temperature stress, and coastal turbidity/ocean color.',
    subtitleAr: 'الكلوروفيل-أ (الازدهار الطحلبي)، وحرارة سطح البحر، ولون المحيط وعكارة الرواسب الساحلية.',
    accentColor: '#10b981',
    honestyBannerEn: null,
    honestyBannerAr: null,
    presets: [
      { id: 'nile_delta_sea', nameEn: 'Nile Delta Coast', nameAr: 'ساحل دلتا النيل', lat: 31.65, lon: 31.10 },
      { id: 'gulf_mexico', nameEn: 'Gulf of Mexico', nameAr: 'خليج المكسيك', lat: 28.80, lon: -89.40 },
      { id: 'baltic_sea', nameEn: 'Baltic Sea', nameAr: 'بحر البلطيق', lat: 57.50, lon: 19.50 },
      { id: 'red_sea', nameEn: 'Red Sea', nameAr: 'البحر الأحمر', lat: 24.50, lon: 36.20 }
    ],
    defaultZoom: 5,
    animations: [
      {
        id: 'water_chlorophyll',
        stageId: 'water',
        gibsLayerId: 'MODIS_Aqua_L2_Chlorophyll_A',
        colormapId: 'MODIS_Chlorophyll',
        legendUrl: 'https://gibs.earthdata.nasa.gov/legends/MODIS_Chlorophyll_H.svg',
        tileMatrixSet: 'GoogleMapsCompatible_Level7',
        maxNativeZoom: 7,
        ext: 'png',
        titleEn: 'Chlorophyll-a (Algal Blooms)',
        titleAr: 'الكلوروفيل-أ (الازدهار الطحلبي)',
        provider: 'NASA OBPG / Aqua MODIS (L2)',
        variableEn: 'Chlorophyll-a Concentration',
        variableAr: 'تركيز الكلوروفيل-أ',
        unitEn: 'mg/m³',
        unitAr: 'ملغم/م³',
        isProxy: false,
        proxyBadgeEn: 'Algal Bloom Indicator',
        proxyBadgeAr: 'مؤشر ازدهار الطحالب',
        availableRange: { start: '2002-07-04', end: '2026-10-15' },
        cadenceType: 'daily_midmonth',
        defaultMonthlyStart: '2024-01-15',
        defaultMonthlyEnd: '2026-10-15',
        defaultYearlyRange: { startYear: 2012, endYear: 2026, month: '07', day: '15' },
        valueDomain: { min: 0.01, max: 10 },
        pairedPowerParam: null,
        whatItIsEn: 'Chlorophyll-a measures the concentration of microscopic marine algae (phytoplankton) in surface ocean and coastal waters, retrieved by NASA’s Aqua MODIS sensor.',
        whatItIsAr: 'يقيس الكلوروفيل-أ تركيز العوالق النباتية والطحالب الدقيقة في المياه السطحية للبحار والسواحل عبر القمر الصناعي أكوا (MODIS).',
        whyItMattersEn: 'Excess fertilizer and sewage runoff trigger massive algal blooms (eutrophication). When blooms die and decay, they strip oxygen from water and create marine dead zones.',
        whyItMattersAr: 'يؤدي تسرب الأسمدة ومياه الصرف إلى انفجار نمو الطحالب (التخثث)، وعند تحللها تستهلك الأكسجين مسببة مناطق ميتة تقتل الأسماك.',
        whatTrendShowsEn: 'Bright green/yellow coastal hotspots near river deltas and enclosed seas reveal nutrient runoff and seasonal bloom outbreaks.',
        whatTrendShowsAr: 'تُظهر البقع الساحلية المرتفعة عند مصبات الأنهار والبحار المغلقة تركيزات التغذية الزائدة ومواسم الازدهار الطحلبي.',
        limitationEn: 'Optical sensor cannot see through clouds or sun glint; blank/missing coastal pixels occur on cloudy sample dates.',
        limitationAr: 'تتأثر القياسات الضوئية بالسحب وانعكاس الشمس، وقد تظهر فراغات في الأيام الغائمة، ولا تغطي الأنهار الصغيرة.'
      },
      {
        id: 'water_sst',
        stageId: 'water',
        gibsLayerId: 'MODIS_Aqua_L3_SST_Thermal_4km_Day_Monthly',
        colormapId: 'MODIS_Sea_Surface_Temperature',
        legendUrl: 'https://gibs.earthdata.nasa.gov/legends/MODIS_Sea_Surface_Temperature_H.svg',
        tileMatrixSet: 'GoogleMapsCompatible_Level6',
        maxNativeZoom: 6,
        ext: 'png',
        titleEn: 'Sea Surface Temperature (Thermal Stress)',
        titleAr: 'درجة حرارة سطح البحر (الإجهاد الحراري)',
        provider: 'NASA OBPG / PO.DAAC / Aqua MODIS (L3 Monthly)',
        variableEn: 'Sea Surface Temperature',
        variableAr: 'درجة حرارة سطح البحر',
        unitEn: '°C',
        unitAr: 'م°',
        isProxy: false,
        proxyBadgeEn: 'Thermal & Hypoxia Risk',
        proxyBadgeAr: 'الإجهاد الحراري ونقص الأكسجين',
        availableRange: { start: '2002-07-01', end: '2026-04-01' },
        skipDates: ['2022-11-01', '2022-12-01', '2023-06-01', '2023-10-01', '2025-12-01'],
        cadenceType: 'monthly_first',
        defaultMonthlyStart: '2024-01-01',
        defaultMonthlyEnd: '2026-04-01',
        defaultYearlyRange: { startYear: 2012, endYear: 2025, month: '08', day: '01' },
        valueDomain: { min: 0, max: 32 },
        pairedPowerParam: null,
        whatItIsEn: 'Monthly 4 km Sea Surface Temperature (SST) measures the thermal energy of the top millimeter of ocean water in degrees Celsius.',
        whatItIsAr: 'تقيس هذه الطبقة الشهرية بدقة 4 كم درجة حرارة الطبقة السطحية للمحيطات والبحار بالدرجة المئوية.',
        whyItMattersEn: 'Warmer waters hold less dissolved oxygen, amplify thermal pollution near coastal outflows, accelerate harmful algal blooms, and trigger coral bleaching.',
        whyItMattersAr: 'تحتفظ المياه الأكثر دفئاً بكمية أقل من الأكسجين المذاب، مما يفاقم التلوث الحراري ويسرّع ازدهار الطحالب السامة وابيضاض الشعاب المرجانية.',
        whatTrendShowsEn: 'Warming coastal seas and summer marine heatwaves shift acoustic pitch higher during peak thermal stress months.',
        whatTrendShowsAr: 'توضح الموجات الحرارية البحرية وارتفاع حرارة السواحل صيفاً، حيث ترتفع النغمة الصوتية مع ارتفاع الحرارة.',
        limitationEn: 'Covers oceans and large seas (4 km grid); inland rivers and small lakes are masked out.',
        limitationAr: 'تغطي المحيطات والبحار الكبيرة فقط بدقة 4 كم، ولا تشمل الأنهار أو البحيرات الصغيرة.'
      },
      {
        id: 'water_turbidity',
        stageId: 'water',
        gibsLayerId: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
        colormapId: null,
        legendUrl: null,
        tileMatrixSet: 'GoogleMapsCompatible_Level9',
        maxNativeZoom: 9,
        ext: 'jpeg',
        useLuminance: true,
        titleEn: 'Ocean Color & Coastal Turbidity Proxy',
        titleAr: 'لون المحيط وعكارة الرواسب الساحلية',
        provider: 'NASA LANCE / EOSDIS Aqua MODIS',
        variableEn: 'Optical Water Reflectance (Luminance)',
        variableAr: 'الانعكاس الضوئي الساحلي (السطوع)',
        unitEn: '% Luminance',
        unitAr: '٪ سطوع',
        isProxy: true,
        proxyBadgeEn: 'Optical Turbidity Proxy',
        proxyBadgeAr: 'مؤشر بصري للعكارة والرواسب',
        availableRange: { start: '2002-07-03', end: '2026-10-15' },
        cadenceType: 'daily_midmonth',
        defaultMonthlyStart: '2024-01-15',
        defaultMonthlyEnd: '2026-10-15',
        defaultYearlyRange: { startYear: 2012, endYear: 2026, month: '07', day: '15' },
        valueDomain: { min: 0, max: 100 },
        pairedPowerParam: null,
        whatItIsEn: 'True-color optical satellite imagery from Aqua MODIS reveals murky coastal sediment plumes, muddy river discharge, and green surface blooms directly in natural color. Brightness (luminance) is converted into sound because GIBS does not offer a dedicated multi-decade Kd490 turbidity colormap layer.',
        whatItIsAr: 'صور الألوان الطبيعية الحقيقية من القمر أكوا تُظهر أعمدة الرواسب والطمي المصبوبة من الأنهار والعكارة الساحلية مباشرة، وتُحوّل درجة السطوع الضوئي إلى صوت لعدم توفر طبقة عكارة رقمية طويلة المدى في GIBS.',
        whyItMattersEn: 'Turbid runoff carries suspended soils, microplastics, agricultural nutrients, and pollutants from watersheds into coastal fisheries.',
        whyItMattersAr: 'تحمل أعمدة العكارة والرواسب الساحلية التربة المنجرفة والملوثات والمغذيات الزراعية من الأنهار إلى المناطق البحرية.',
        whatTrendShowsEn: 'Brighter tan/green reflectance along coastlines and deltas produces higher audio pitches than deep clear blue ocean water.',
        whatTrendShowsAr: 'تُنتج المياه العكرة الفاتحة عند الدلتا والسواحل نغمات أعلى مقارنة بالمياه العميقة الصافية الداكنة.',
        limitationEn: 'Visual proxy: clouds also appear bright white and elevate luminance; inspect the map image alongside the sound.',
        limitationAr: 'مؤشر بصري غير معاير رقمياً: السحب البيضاء ترفع السطوع أيضاً، لذا يُنصح بمقارنة النغمة مع الصورة.'
      }
    ]
  },
  {
    id: 'soil',
    stageNumber: 3,
    titleEn: 'Stage 3: Soil Pollution (Condition Indicators)',
    titleAr: 'المرحلة 3: تلوث التربة (مؤشرات حالة التربة)',
    shortEn: 'Soil Indicators',
    shortAr: 'مؤشرات التربة',
    subtitleEn: 'Soil moisture (SMAP + POWER), vegetation health (NDVI), and land surface heat stress.',
    subtitleAr: 'رطوبة التربة (SMAP وناسا باور)، وصحة الغطاء النباتي (NDVI)، والإجهاد الحراري لسطح الأرض.',
    accentColor: '#fbbf24',
    honestyBannerEn: 'Scientific Transparency Note: NASA satellites do not directly measure chemical soil contamination (heavy metals, pesticides, or toxins). These three animations provide physical Soil Condition Indicators—moisture, vegetation vitality, and surface heat—to track land degradation and vulnerability.',
    honestyBannerAr: 'تنويه علمي صادق: لا تقيس أقمار ناسا التلوث الكيميائي المباشر للتربة (كالمعادن الثقيلة أو المبيدات). تُظهر هذه المرحلة مؤشرات حالة التربة الفيزيائية (الرطوبة، صحة النبات، وحرارة السطح) لرصد تدهور الأراضي وإجهادها.',
    presets: [
      { id: 'zagazig', nameEn: 'Zagazig (Nile Delta)', nameAr: 'الزقازيق (دلتا النيل)', lat: 30.5877, lon: 31.5020 },
      { id: 'central_valley', nameEn: 'Central Valley (USA)', nameAr: 'الوادي الأوسط (أمريكا)', lat: 36.7468, lon: -119.7726 },
      { id: 'sahel_mali', nameEn: 'Sahel Belt (Mali)', nameAr: 'الساحل الأفريقي (مالي)', lat: 14.5000, lon: -4.2000 },
      { id: 'amazon_basin', nameEn: 'Amazon Basin', nameAr: 'حوض الأمازون', lat: -3.4653, lon: -62.2159 }
    ],
    defaultZoom: 5,
    animations: [
      {
        id: 'soil_moisture',
        stageId: 'soil',
        gibsLayerId: 'SMAP_L4_Analyzed_Surface_Soil_Moisture',
        colormapId: 'SMAP_Analyzed_Soil_Moisture',
        legendUrl: 'https://gibs.earthdata.nasa.gov/legends/SMAP_Analyzed_Soil_Moisture_H.svg',
        tileMatrixSet: 'GoogleMapsCompatible_Level6',
        maxNativeZoom: 6,
        ext: 'png',
        titleEn: 'Surface Soil Moisture (SMAP + POWER)',
        titleAr: 'رطوبة التربة السطحية (SMAP وناسا باور)',
        provider: 'NASA GSFC GMAO / SMAP L4 & NASA POWER',
        variableEn: 'Volumetric Soil Moisture',
        variableAr: 'رطوبة التربة الحجمية',
        unitEn: 'm³/m³',
        unitAr: 'م³/م³',
        isProxy: true,
        proxyBadgeEn: 'Soil Condition Indicator',
        proxyBadgeAr: 'مؤشر حالة التربة (غير كيميائي)',
        availableRange: { start: '2015-03-31', end: '2026-10-15' },
        skipDates: ['2025-10-15', '2025-11-15', '2026-08-15'],
        cadenceType: 'daily_midmonth',
        defaultMonthlyStart: '2024-01-15',
        defaultMonthlyEnd: '2026-10-15',
        defaultYearlyRange: { startYear: 2015, endYear: 2026, month: '07', day: '15' },
        valueDomain: { min: 0.02, max: 0.6 },
        pairedPowerParam: 'GWETTOP',
        pairedPowerSecondaryParam: 'GWETROOT',
        whatItIsEn: 'SMAP Level-4 Surface Soil Moisture tracks the volume of water per volume of soil (m³/m³) in the top 5 cm globally, paired here with NASA POWER GWETTOP (surface wetness 0–5 cm) and GWETROOT (root-zone wetness 0–100 cm).',
        whatItIsAr: 'تقيس طبقة SMAP L4 حجم المياه في أعلى 5 سم من التربة عالمياً (م³/م³)، وتقترن هنا بمعاملات ناسا باور GWETTOP (رطوبة السطح) وGWETROOT (رطوبة منطقة الجذور حتى عمق 100 سم).',
        whyItMattersEn: 'Severe soil drying accelerates desertification and dust erosion, while waterlogging increases agricultural runoff and salinity buildup—key physical stressors on soil ecosystems.',
        whyItMattersAr: 'يؤدي جفاف التربة الشديد إلى التصحر وتآكلها، بينما يسبب التشبع المائي المفرط تملح التربة وجرف المغذيات والملوثات.',
        whatTrendShowsEn: 'Seasonal irrigation, monsoon wetting, and multi-year droughts shift soil moisture levels and pitch across agricultural basins.',
        whatTrendShowsAr: 'تعكس البيانات دورات الري والمواسم المطرية وموجات الجفاف الممتدة في الأحواض الزراعية.',
        limitationEn: 'Soil Condition Indicator only: measures water content (9 km L4 assimilation), not heavy metals, pesticides, or chemical toxicity.',
        limitationAr: 'مؤشر حالة فيزيائية فقط: يقيس المحتوى المائي بدقة ~9 كم ولا يرصد التلوث الكيميائي أو السموم.'
      },
      {
        id: 'soil_ndvi',
        stageId: 'soil',
        gibsLayerId: 'MODIS_Terra_L3_NDVI_Monthly',
        colormapId: 'MODIS_L3_NDVI',
        legendUrl: 'https://gibs.earthdata.nasa.gov/legends/MODIS_L3_NDVI_H.svg',
        tileMatrixSet: 'GoogleMapsCompatible_Level7',
        maxNativeZoom: 7,
        ext: 'png',
        titleEn: 'Vegetation Health Index (NDVI)',
        titleAr: 'مؤشر صحة الغطاء النباتي (NDVI)',
        provider: 'NASA LP DAAC / Terra MODIS (L3 Monthly)',
        variableEn: 'Normalized Difference Vegetation Index',
        variableAr: 'مؤشر الغطاء النباتي الطبيعي',
        unitEn: 'NDVI',
        unitAr: 'NDVI',
        isProxy: true,
        proxyBadgeEn: 'Soil Condition Indicator',
        proxyBadgeAr: 'مؤشر حالة التربة (غير كيميائي)',
        availableRange: { start: '2000-03-01', end: '2026-10-01' },
        skipDates: ['2025-04-01'],
        cadenceType: 'monthly_first',
        defaultMonthlyStart: '2024-01-01',
        defaultMonthlyEnd: '2026-10-01',
        defaultYearlyRange: { startYear: 2012, endYear: 2026, month: '07', day: '01' },
        valueDomain: { min: 0.05, max: 0.9 },
        pairedPowerParam: null,
        whatItIsEn: 'NDVI (0.0 to 1.0) measures plant chlorophyll greenness and canopy density from Terra MODIS monthly composites. Healthy soils generally sustain denser, greener vegetation.',
        whatItIsAr: 'يقيس مؤشر NDVI (من 0 إلى 1) كثافة وصحة الكلوروفيل النباتي شهرياً عبر القمر تيرا، وتدعم التربة السليمة غطاءً نباتياً أكثر خضرة وكثافة.',
        whyItMattersEn: 'Declining NDVI can signal soil degradation, salinization, deforestation, drought stress, or land-use damage that leaves soil exposed to erosion.',
        whyItMattersAr: 'قد يشير تراجع المؤشر إلى تدهور التربة أو تملحها أو إزالة الغابات أو الإجهاد المائي الذي يعرّض التربة للتعرية.',
        whatTrendShowsEn: 'Green agricultural valleys and forests produce high musical pitches, while barren land or stressed crops drop to lower pitches.',
        whatTrendShowsAr: 'تُنتج الوديان الخضراء والغابات نغمات مرتفعة، بينما تنخفض النغمات في الأراضي القاحلة أو المتدهورة.',
        limitationEn: 'Soil Condition Indicator only: low NDVI cannot distinguish chemical soil toxicity from drought, urban paving, or seasonal harvest.',
        limitationAr: 'مؤشر حالة فيزيائية فقط: انخفاض الغطاء النباتي لا يميز بين التلوث الكيميائي والجفاف أو مواسم الحصاد أو العمران.'
      },
      {
        id: 'soil_lst',
        stageId: 'soil',
        gibsLayerId: 'MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day',
        colormapId: 'MODIS_Land_Surface_Temp',
        legendUrl: 'https://gibs.earthdata.nasa.gov/legends/MODIS_Land_Surface_Temp_H.svg',
        tileMatrixSet: 'GoogleMapsCompatible_Level6',
        maxNativeZoom: 6,
        ext: 'png',
        isKelvin: true,
        titleEn: 'Land Surface Temperature (Soil Heat Stress)',
        titleAr: 'حرارة سطح الأرض (الإجهاد الحراري للتربة)',
        provider: 'NASA LP DAAC / Terra MODIS (L3 Monthly)',
        variableEn: 'Daytime Land Surface Temperature',
        variableAr: 'درجة حرارة سطح الأرض نهاراً',
        unitEn: '°C',
        unitAr: 'م°',
        isProxy: true,
        proxyBadgeEn: 'Soil Condition Indicator',
        proxyBadgeAr: 'مؤشر حالة التربة (غير كيميائي)',
        availableRange: { start: '2000-03-01', end: '2026-10-01' },
        cadenceType: 'monthly_first',
        defaultMonthlyStart: '2024-01-01',
        defaultMonthlyEnd: '2026-10-01',
        defaultYearlyRange: { startYear: 2012, endYear: 2026, month: '07', day: '01' },
        valueDomain: { min: 0, max: 55 },
        pairedPowerParam: 'TS',
        whatItIsEn: 'Monthly Daytime Land Surface Temperature measures how hot the bare soil, crops, or urban ground skin actually gets under sunlight (converted from Kelvin to °C), paired with NASA POWER Earth Skin Temperature (TS).',
        whatItIsAr: 'تقيس حرارة سطح الأرض الشهرية نهاراً مدى سخونة التربة المكشوفة أو المحاصيل تحت الشمس (محوَّلة من كلفن إلى مئوية)، وتقترن بمعامل حرارة الجلد الأرضي (TS) من ناسا باور.',
        whyItMattersEn: 'Extreme soil surface temperatures bake organic matter, accelerate moisture loss, stress soil microbes, and intensify urban and agricultural heat islands.',
        whyItMattersAr: 'تُسرّع الحرارة السطحية المفرطة تبخر رطوبة التربة وتضر بالمادة العضوية والكائنات الدقيقة وتفاقم جزر الحرارة.',
        whatTrendShowsEn: 'Summer heating peaks and bare-soil heat islands drive sharp upward climbs in pitch compared to irrigated or vegetated land.',
        whatTrendShowsAr: 'تُظهر ذروات الصيف والأراضي المكشوفة ارتفاعاً واضحاً في النغمة مقارنة بالأراضي المروية والمغطاة بالنبات.',
        limitationEn: 'Soil Condition Indicator only: reflects daytime thermal skin stress rather than chemical soil contaminants.',
        limitationAr: 'مؤشر حالة فيزيائية فقط: يعكس الإجهاد الحراري للسطح نهاراً ولا يقيس الملوثات الكيميائية في التربة.'
      }
    ]
  }
];

export const ALL_POLLUTION_ANIMATIONS = POLLUTION_STAGES.flatMap(s => s.animations);

/**
 * Generates an ordered array of real verified YYYY-MM-DD frame dates for an animation.
 * Strictly respects verified GIBS availableRange and skips known gaps (e.g. 2025-04-01 for Terra Monthly NDVI).
 */
export function buildAnimationDates(anim, cadence = 'monthly') {
  if (!anim) return [];
  const skipSet = new Set(anim.skipDates || []);
  const dates = [];

  if (cadence === 'yearly') {
    const { startYear, endYear, month, day } = anim.defaultYearlyRange;
    for (let yr = startYear; yr <= endYear; yr++) {
      const d = `${yr}-${month}-${day}`;
      if (d >= anim.availableRange.start && d <= anim.availableRange.end && !skipSet.has(d)) {
        dates.push(d);
      }
    }
    return dates;
  }

  // Monthly cadence from defaultMonthlyStart to defaultMonthlyEnd
  const startParts = anim.defaultMonthlyStart.split('-').map(Number);
  const endParts = anim.defaultMonthlyEnd.split('-').map(Number);
  const dayStr = anim.cadenceType === 'daily_midmonth' ? '15' : '01';

  let yr = startParts[0];
  let mo = startParts[1];
  const endYr = endParts[0];
  const endMo = endParts[1];

  while (yr < endYr || (yr === endYr && mo <= endMo)) {
    const moStr = mo < 10 ? `0${mo}` : `${mo}`;
    const d = `${yr}-${moStr}-${dayStr}`;
    if (d >= anim.availableRange.start && d <= anim.availableRange.end && !skipSet.has(d)) {
      dates.push(d);
    }
    mo++;
    if (mo > 12) {
      mo = 1;
      yr++;
    }
  }

  return dates;
}
