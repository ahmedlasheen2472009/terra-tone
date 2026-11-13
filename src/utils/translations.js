/**
 * Complete English and Arabic translations for Earth Jukebox
 */

export const translations = {
  en: {
    appTitle: 'Earth Jukebox',
    tagline: 'NASA Earth Environmental Data Sonification & Visual Explorer',
    badgeNasa: 'NASA Space Apps',
    skipToContent: 'Skip to main content',

    // Nav & Top Bar
    langToggle: 'العربية',
    highContrast: 'High Contrast',
    largeText: 'Large Text',
    shortcutsBtn: 'Shortcuts (H)',
    mute: 'Mute',
    unmute: 'Unmute',
    audioReady: 'Audio Active',
    audioBlocked: 'Click to Enable Audio',
    announceToggle: 'Speech During Play',
    announceOn: 'Announce: Every 5th Year',
    announceOff: 'Announce: Manual Only',

    // Onboarding 3 Steps
    onboardingTitle: 'Try This: 3 Steps to Listen to Earth',
    step1Title: '1. Pick a Location or GPS',
    step1Desc: 'Click preset Egyptian cities (Zagazig, Alexandria, Cairo, Aswan), click your GPS, or tap anywhere on Earth.',
    step2Title: '2. Explore Satellite Frames',
    step2Desc: 'Toggle real NASA GIBS satellite imagery: Land Surface Temp, True Color, Rainfall, or NDVI Vegetation.',
    step3Title: '3. Listen to the Frame',
    step3Desc: 'Click "Sonify Point" to hear the pixel under the marker, or click "Scan the Frame" to hear an audio sweep across the map!',
    dismiss: 'Got it',

    // NASA GIBS Satellite Frames
    gibsSectionHeading: 'NASA GIBS Satellite Frame Viewer',
    gibsLayerSelect: 'Satellite Imagery Layer:',
    gibsDate: 'Frame Date',
    gibsPlay: 'Animate Frames',
    gibsPause: 'Pause Frames',
    gibsOpacity: 'Opacity',
    sonifyPixelBtn: 'Sonify Point from Frame',
    scanFrameBtn: 'Scan the Frame',
    scanning: 'Scanning Frame...',
    framePixelSampled: 'Sampled from Frame',
    luminanceNotice: 'Derived from pixel luminance (RGB true color / colormap unmapped)',
    colormapNotice: 'Derived via calibrated NASA GIBS colormap',
    legend: 'Layer Legend',
    toggleLegend: 'Toggle Legend',
    pixelValueLabel: 'Pixel value at marker:',

    // Variable Selection & Dynamic Range
    variableLabel: 'Earth Variable:',
    selectVariableAria: 'Select climate variable to visualize and sonify',
    secondaryLayerLabel: 'Second Layer (Volume Modulation):',
    secondaryNone: 'None (Single Variable)',
    pitchMappingLabel: 'Dynamic Pitch Mapping:',

    // Presets & Locations
    locationPresetLabel: 'Location Presets & GPS:',
    gpsBtn: 'Detect GPS Location',
    gpsLoading: 'Acquiring GPS...',
    gpsError: 'GPS access denied or unavailable',
    returnToChart: 'Back to Chart View',
    customLocation: 'Custom Point',
    compareModeLabel: 'Compare Two Locations',
    locationA: 'Location A (Left Channel)',
    locationB: 'Location B (Right Channel)',
    clickMapToSelect: 'Click anywhere on the map to set coordinates',
    coordinates: 'Lat: {lat}, Lon: {lon}',

    // Timeline Controls
    timelineHeading: 'Timeline & Audio Playback',
    year: 'Year',
    currentYearLabel: 'Current Year: {year}',
    play: 'Play',
    pause: 'Pause',
    stepBack: 'Previous Year (Left Arrow)',
    stepForward: 'Next Year (Right Arrow)',
    speed: 'Speed',
    loop: 'Loop Playback',
    yearSliderAria: 'Scrub timeline year',

    // Audio Controls
    audioHeading: 'Sonification Controls',
    volume: 'Volume',
    instrument: 'Instrument',
    instrumentSine: 'Pure Sine',
    instrumentTriangle: 'Warm Triangle',
    instrumentPluck: 'Soft Pluck',
    musicalScale: 'Pentatonic Scale',
    scaleOn: 'Scale Snapped',
    scaleOff: 'Continuous Pitch',
    spatialStereo: 'Stereo Spatial Sonification',
    recordCueTip: 'High & low record chimes enabled',

    // Chart & Visuals
    chartHeading: 'Historical Trend ({range})',
    dataSubheading: 'NASA POWER Ground-Level Observations',
    chartAriaLabel: 'Line chart depicting historical data with trendline and moving cursor',
    dataTableView: 'Data Table',
    chartView: 'Chart View',
    trendline: 'Linear Trendline',
    recordHigh: 'Record High',
    recordLow: 'Record Low',
    runningRecordHigh: 'New High Record',
    runningRecordLow: 'New Low Record',

    // Insights Panel
    insightsHeading: 'Plain Language Climate Insights',
    changePerDecade: 'Change per Decade',
    totalTrendChange: 'Total Period Change',
    percentChange: 'Percent Change',
    significanceTest: 'Statistical Significance',
    significant: 'Statistically Significant (p < 0.05)',
    notSignificant: 'Not Statistically Significant (p ≥ 0.05)',
    pValueLabel: 'p-value: {p}',
    readSummaryBtn: 'Spoken Summary (TTS)',
    stopSpeakingBtn: 'Stop Speech',
    speakingState: 'Speaking...',
    historicalRange: 'Baseline to Latest Observations',

    // Data Table
    tableCaption: 'Annual values and historical anomalies for selected location',
    colYear: 'Year',
    colValue: 'Value',
    colAnomaly: 'Anomaly (Diff from baseline)',
    colRecords: 'Records & Notes',
    downloadCsv: 'Download CSV',

    // About & Data Sources
    aboutHeading: 'About The Earth Information Jukebox',
    aboutMission: 'Earth Jukebox was built for the NASA Space Apps Challenge "The Earth Information Jukebox". It makes multi-decadal NASA Earth science data accessible to everyone, especially people who are blind, visually impaired, or neurodivergent, through real-time harmonic sonification synchronized with spatial and chart visuals.',
    howSonificationWorks: 'How Sonification Works:',
    sonificationExplanation: 'Data values and satellite pixel readings are mapped to pitch using a harmonious pentatonic scale (C3 to C6). In Point Mode, the pixel RGB under the map marker is extracted from the NASA GIBS satellite frame and decoded via calibrated colormaps or luminance. In Scan Mode, a sweep across 40 columns sonifies the visible geography from west to east in real time. When comparing two locations, Location A is positioned in the left stereo ear and Location B in the right stereo ear, allowing you to hear climatic divergence in stereo space. Distinct bell and chime cues alert listeners when historical records are broken.',
    dataCrediting: 'Data Sources: NASA GIBS (Global Imagery Browse Services) WMTS API and NASA POWER API (Prediction Of Worldwide Energy Resources) via NASA Langley Research Center.',
    keyboardHelpHeading: 'Keyboard Shortcuts',
    shortcutSpace: 'Play / Pause timeline playback',
    shortcutArrowsLR: 'Step backward / forward by 1 year',
    shortcutArrowsUD: 'Increase / decrease playback speed',
    shortcutM: 'Mute / Unmute audio',
    shortcutH: 'Open this keyboard shortcuts dialog',
    shortcutClose: 'Close Modal',

    // Status messages for screen reader (aria-live)
    statusAnnounce: 'Year {year}, {variable}: {value} {unit}. {recordNotice}',
    statusCompareAnnounce: 'Year {year}: {locA} is {valA} {unit}, {locB} is {valB} {unit}.',
    statusPlaybackStarted: 'Timeline playback started at {speed}x speed.',
    statusPlaybackPaused: 'Timeline playback paused at year {year}.',
    statusLocationChanged: 'Location changed to {name} at latitude {lat}, longitude {lon}.',

    // Stage Selector Mode Tabs
    modeTemperatureTab: 'Temperature & Climate (NASA POWER)',
    modeAirTab: 'Stage 1: Air Pollution',
    modeWaterTab: 'Stage 2: Water Pollution',
    modeSoilTab: 'Stage 3: Soil Pollution'
  },

  ar: {
    appTitle: 'إيرث جيوك بوكس (Earth Jukebox)',
    tagline: 'المستكشف السمعي والبصري لبيانات وإطارات الأقمار الصناعية لوكالة ناسا',
    badgeNasa: 'تحدي ناسا لتطبيقات الفضاء',
    skipToContent: 'الانتقال إلى المحتوى الرئيسي',

    // Nav & Top Bar
    langToggle: 'English',
    highContrast: 'تباين عالي',
    largeText: 'خط كبير',
    shortcutsBtn: 'اختصارات لوحة المفاتيح (H)',
    mute: 'كتم الصوت',
    unmute: 'تشغيل الصوت',
    audioReady: 'الصوت نشط',
    audioBlocked: 'اضغط لتفعيل الصوت',
    announceToggle: 'النطق أثناء التشغيل',
    announceOn: 'الإعلانات: كل 5 سنوات',
    announceOff: 'الإعلانات: يدوي فقط',

    // Onboarding 3 Steps
    onboardingTitle: 'جرّب هذا: 3 خطوات للاستماع إلى كوكب الأرض',
    step1Title: '1. اختر موقعاً أو حدد GPS',
    step1Desc: 'انقر على مدن مصرية جاهزة (الزقازيق، الإسكندرية، القاهرة، أسوان)، أو اضغط على موقعك عبر GPS أو أي نقطة على الخريطة.',
    step2Title: '2. استكشف إطارات الأقمار الصناعية',
    step2Desc: 'اختر صور أقمار ناسا الحقيقية (NASA GIBS): حرارة سطح الأرض، الألوان الطبيعية، هطول الأمطار، أو مؤشر الغطاء النباتي.',
    step3Title: '3. استمع إلى بيانات الإطار الفضائي',
    step3Desc: 'اضغط "تحويل النقطة لصوت" لسماع قيمة البكسل تحت العلامة، أو "مسح الإطار" لسماع مسح صوتي مجسم للمنطقة الظاهرة كاملة!',
    dismiss: 'فهمت ذلك',

    // NASA GIBS Satellite Frames
    gibsSectionHeading: 'عارض إطارات الأقمار الصناعية (NASA GIBS)',
    gibsLayerSelect: 'طبقة القمر الصناعي:',
    gibsDate: 'تاريخ الإطار الفضائي',
    gibsPlay: 'تشغيل حركة الإطارات',
    gibsPause: 'إيقاف حركة الإطارات',
    gibsOpacity: 'الشفافية',
    sonifyPixelBtn: 'تحويل النقطة من الإطار لصوت',
    scanFrameBtn: 'مسح الإطار صوتياً',
    scanning: 'جاري مسح الإطار...',
    framePixelSampled: 'العينة المأخوذة من الإطار',
    luminanceNotice: 'مستنتج من سطوع البكسل (ألوان طبيعية / بدون خريطة ألوان)',
    colormapNotice: 'مستخرج عبر خريطة ألوان ناسا المعايرة',
    legend: 'دليل الألوان والوحدات',
    toggleLegend: 'إظهار/إخفاء دليل الألوان',
    pixelValueLabel: 'قيمة البكسل عند العلامة:',

    // Variable Selection & Dynamic Range
    variableLabel: 'المتغير البيئي:',
    selectVariableAria: 'اختر المتغير المناخي للعرض والتحويل السمعي',
    secondaryLayerLabel: 'الطبقة الصوتية الثانية (تعديل مستوى الصوت):',
    secondaryNone: 'بدون (متغير فردي)',
    pitchMappingLabel: 'نطاق درجات النغمات الموسيقية:',

    // Presets & Locations
    locationPresetLabel: 'المواقع الجاهزة وتحديد GPS:',
    gpsBtn: 'تحديد موقعي عبر GPS',
    gpsLoading: 'جاري تحديد موقعك...',
    gpsError: 'تعذر الوصول إلى نظام GPS',
    returnToChart: 'العودة إلى الرسم البياني',
    customLocation: 'نقطة مخصصة',
    compareModeLabel: 'مقارنة موقعين معاً',
    locationA: 'الموقع أ (القناة اليسرى)',
    locationB: 'الموقع ب (القناة اليمنى)',
    clickMapToSelect: 'انقر على الخريطة لتحديد الإحداثيات',
    coordinates: 'خط العرض: {lat}، خط الطول: {lon}',

    // Timeline Controls
    timelineHeading: 'الخط الزمني والتشغيل الصوتي',
    year: 'السنة',
    currentYearLabel: 'السنة الحالية: {year}',
    play: 'تشغيل',
    pause: 'إيقاف مؤقت',
    stepBack: 'السنة السابقة (السهم الأيسر)',
    stepForward: 'السنة التالية (السهم الأيمن)',
    speed: 'السرعة',
    loop: 'تكرار التشغيل',
    yearSliderAria: 'شريط التنقل عبر السنوات',

    // Audio Controls
    audioHeading: 'إعدادات التحويل الصوتي (Sonification)',
    volume: 'مستوى الصوت',
    instrument: 'الآلة الموسيقية',
    instrumentSine: 'نغمة جيبية نقية (Sine)',
    instrumentTriangle: 'مثلثية دافئة (Triangle)',
    instrumentPluck: 'عزف أوتار ناعم (Soft Pluck)',
    musicalScale: 'السلم الموسيقي الخماسي (Pentatonic)',
    scaleOn: 'مطابق للسلم',
    scaleOff: 'تردد متصل حر',
    spatialStereo: 'توزيع صوتي مجسم (Stereo)',
    recordCueTip: 'نغمات التنبيه للقيم القياسية مفعلة',

    // Chart & Visuals
    chartHeading: 'المسار التاريخي ({range})',
    dataSubheading: 'أرصاد وكالة ناسا باور (NASA POWER) الأرضية',
    chartAriaLabel: 'مخطط بياني يوضح البيانات التاريخية مع خط الاتجاه ومؤشر متحرك',
    dataTableView: 'جدول البيانات',
    chartView: 'الرسم البياني',
    trendline: 'خط الاتجاه الخطي',
    recordHigh: 'أعلى رقم قياسي',
    recordLow: 'أدنى رقم قياسي',
    runningRecordHigh: 'رقم قياسي مرتفع جديد',
    runningRecordLow: 'رقم قياسي منخفض جديد',

    // Insights Panel
    insightsHeading: 'تحليلات المناخ بلغة واضحة',
    changePerDecade: 'التغير لكل عقد (10 سنوات)',
    totalTrendChange: 'إجمالي التغير خلال الفترة',
    percentChange: 'نسبة التغير المئوية',
    significanceTest: 'الدلالة الإحصائية',
    significant: 'تغير دال إحصائياً (p < 0.05)',
    notSignificant: 'تغير غير دال إحصائياً (p ≥ 0.05)',
    pValueLabel: 'القيمة الاحتمالية p: {p}',
    readSummaryBtn: 'قراءة الملخص صوتياً (TTS)',
    stopSpeakingBtn: 'إيقاف القراءة',
    speakingState: 'جاري القراءة...',
    historicalRange: 'من خط الأساس حتى أحدث الأرصاد',

    // Data Table
    tableCaption: 'القيم السنوية والانحرافات التاريخية للموقع المحدد',
    colYear: 'السنة',
    colValue: 'القيمة',
    colAnomaly: 'الانحراف (الفرق عن خط الأساس)',
    colRecords: 'الأرقام القياسية والملاحظات',
    downloadCsv: 'تنزيل ملف CSV',

    // About & Data Sources
    aboutHeading: 'حول مشروع صندوق موسيقى الأرض (Earth Jukebox)',
    aboutMission: 'تم تصميم Earth Jukebox لتحدي ناسا لتطبيقات الفضاء "صندوق معلومات الأرض"، بهدف إتاحة بيانات علوم الأرض والصور الفضائية الصادرة عن ناسا للجميع، وخاصة المكفوفين وضعاف البصر، عبر التحويل الصوتي المتناغم والمتزامن مع الخرائط والرسوم البيانية.',
    howSonificationWorks: 'كيف يعمل التحويل الصوتي (Sonification):',
    sonificationExplanation: 'تُحوَّل قيم البيانات وقراءات بكسلات الأقمار الصناعية إلى طبقات نغمية باستخدام السلم الموسيقي الخماسي المتناغم (من C3 حتى C6). في نمط النقطة، يتم قراءة بكسل RGB من إطار قمر ناسا الفضائي أسفل العلامة المحددة وتحويله إلى قيمة فيزيائية باستخدام خريطة الألوان المعايرة أو السطوع. وفي نمط المسح، يتم مسح 40 عموداً عبر الخريطة للاستماع لتضاريس المنطقة المعروضة كاملة. وعند مقارنة موقعين، يُوجَّه الموقع الأول للأذن اليسرى والموقع الثاني للأذن اليمنى للاستماع للاختلافات المناخية في فضاء ستيريو مجسم.',
    dataCrediting: 'مصادر البيانات: واجهة إطارات الأقمار الصناعية (NASA GIBS WMTS API) وواجهة ناسا باور (NASA POWER API) من مركز لانغلي للأبحاث التابع لناسا.',
    keyboardHelpHeading: 'اختصارات لوحة المفاتيح',
    shortcutSpace: 'تشغيل / إيقاف مؤقت للخط الزمني',
    shortcutArrowsLR: 'الانتقال سنة للخلف / للأمام',
    shortcutArrowsUD: 'زيادة / تقليل سرعة التشغيل',
    shortcutM: 'كتم / تشغيل الصوت',
    shortcutH: 'فتح نافذة اختصارات لوحة المفاتيح',
    shortcutClose: 'إغلاق النافذة',

    // Status messages for screen reader (aria-live)
    statusAnnounce: 'سنة {year}، {variable}: {value} {unit}. {recordNotice}',
    statusCompareAnnounce: 'سنة {year}: {locA} بقيمة {valA} {unit}، و{locB} بقيمة {valB} {unit}.',
    statusPlaybackStarted: 'بدأ تشغيل الخط الزمني بسرعة {speed}x.',
    statusPlaybackPaused: 'تم إيقاف تشغيل الخط الزمني عند سنة {year}.',
    statusLocationChanged: 'تم تغيير الموقع إلى {name} عند خط عرض {lat}، وخط طول {lon}.',

    // Stage Selector Mode Tabs
    modeTemperatureTab: 'الحرارة والمناخ (NASA POWER)',
    modeAirTab: 'المرحلة 1: تلوث الهواء',
    modeWaterTab: 'المرحلة 2: تلوث المياه',
    modeSoilTab: 'المرحلة 3: تلوث التربة'
  }
};
