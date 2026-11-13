/**
 * Statistical calculations for environmental time series analysis
 * Implements linear regression, change per decade, percent change,
 * t-statistic, and p-value calculation for significance testing (p < 0.05).
 */

/**
 * Log-gamma function Lanczos approximation
 * @param {number} z 
 * @returns {number} ln(Gamma(z))
 */
function logGamma(z) {
  const c = [
    57.1562356658629235,
    -59.5979603554754912,
    14.1360979747417471,
    -0.491913816097620199,
    0.339946499848118887e-4,
    0.465236289270485756e-4,
    -0.983744753048795646e-4,
    0.158088703224379462e-3,
    -0.210264410829562723e-3,
    0.217439618115212643e-3,
    -0.16431810653676389e-3,
    0.844182239838527433e-4,
    -0.261908384015814087e-4,
    0.368991826595316234e-5,
  ];
  let sum = 0.99999999999999709182;
  for (let i = 0; i < c.length; i++) {
    sum += c[i] / (z + i + 1);
  }
  const t = z + 5.2421875; // g = 4.7421875 + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}

/**
 * Regularized incomplete beta function I_x(a, b) using continued fraction
 * @param {number} x (0 <= x <= 1)
 * @param {number} a (> 0)
 * @param {number} b (> 0)
 * @returns {number}
 */
function incompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Symmetry transformation
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - incompleteBeta(1 - x, b, a);
  }

  const factor = Math.exp(
    a * Math.log(x) + b * Math.log(1 - x) - logGamma(a) - logGamma(b) + logGamma(a + b)
  ) / a;

  // Lentz's method for continued fraction
  const maxIter = 200;
  const epsilon = 1e-12;
  let c = 1;
  let d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let f = d;

  for (let m = 1; m <= maxIter; m++) {
    // Even step: m = 2k
    let numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    f *= c * d;

    // Odd step: m = 2k + 1
    numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = c * d;
    f *= delta;

    if (Math.abs(delta - 1) < epsilon) break;
  }

  return factor * f;
}

/**
 * Compute two-tailed p-value for Student's t-distribution
 * @param {number} tVal Student's t statistic
 * @param {number} df Degrees of freedom
 * @returns {number} p-value (0 to 1)
 */
export function studentTPValue(tVal, df) {
  if (df <= 0) return 1;
  if (!isFinite(tVal) || isNaN(tVal)) return 1;
  const t = Math.abs(tVal);
  if (t === 0) return 1;
  
  const x = df / (df + t * t);
  const p = incompleteBeta(x, df / 2, 0.5);
  return Math.min(1, Math.max(0, p));
}

/**
 * Computes linear regression trend, change per decade, percent change,
 * record highs/lows, and hypothesis testing significance for a time series.
 * 
 * @param {Array<{year: number, value: number}>} dataPoints
 * @returns {Object} Comprehensive statistical summary
 */
export function computeTimeSeriesStatistics(dataPoints) {
  if (!dataPoints || dataPoints.length < 2) {
    return {
      n: dataPoints?.length || 0,
      slope: 0,
      intercept: 0,
      changePerDecade: 0,
      percentChange: 0,
      totalChange: 0,
      rSquared: 0,
      tStat: 0,
      pValue: 1,
      isSignificant: false,
      mean: 0,
      min: 0,
      max: 0,
      recordHigh: null,
      recordLow: null,
      trendline: [],
      recordsMap: {}
    };
  }

  const validPoints = dataPoints.filter(p => p.value !== null && !isNaN(p.value));
  const n = validPoints.length;

  if (n < 2) {
    return computeTimeSeriesStatistics([]);
  }

  let sumX = 0;
  let sumY = 0;
  let minVal = Infinity;
  let maxVal = -Infinity;
  let recordHigh = null;
  let recordLow = null;

  for (let i = 0; i < n; i++) {
    const { year, value } = validPoints[i];
    sumX += year;
    sumY += value;

    if (value > maxVal) {
      maxVal = value;
      recordHigh = { year, value };
    }
    if (value < minVal) {
      minVal = value;
      recordLow = { year, value };
    }
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;

  for (let i = 0; i < n; i++) {
    const { year, value } = validPoints[i];
    const dx = year - meanX;
    const dy = value - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }

  // Linear regression slope and intercept: y = slope * x + intercept
  const slope = sxx !== 0 ? sxy / sxx : 0;
  const intercept = meanY - slope * meanX;

  // Change per decade = slope * 10 years
  const changePerDecade = slope * 10;

  // Trendline values and Residual Sum of Squares (RSS)
  let rss = 0;
  const trendline = validPoints.map(p => {
    const fitted = slope * p.year + intercept;
    const residual = p.value - fitted;
    rss += residual * residual;
    return {
      year: p.year,
      fitted
    };
  });

  // Coefficient of determination (R^2)
  const rSquared = syy !== 0 ? Math.max(0, Math.min(1, 1 - rss / syy)) : 0;

  // Statistical significance test: t = slope / SE(slope)
  const df = n - 2;
  let seSlope = 0;
  let tStat = 0;
  let pValue = 1;

  if (df > 0 && sxx > 0) {
    const residualVariance = rss / df;
    seSlope = Math.sqrt(residualVariance / sxx);
    if (seSlope > 0) {
      tStat = slope / seSlope;
      pValue = studentTPValue(tStat, df);
    } else if (Math.abs(slope) > 1e-9) {
      // Perfect collinear fit with non-zero slope
      tStat = Infinity;
      pValue = 0;
    } else {
      tStat = 0;
      pValue = 1;
    }
  }

  const isSignificant = pValue < 0.05;

  // Total change from fitted start to fitted end
  const firstYear = validPoints[0].year;
  const lastYear = validPoints[n - 1].year;
  const fittedStart = slope * firstYear + intercept;
  const fittedEnd = slope * lastYear + intercept;
  const totalChange = fittedEnd - fittedStart;

  // Percent change relative to baseline (safeguard near-zero baseline)
  let percentChange = 0;
  const baseline = Math.abs(fittedStart) > 0.01 ? Math.abs(fittedStart) : Math.abs(meanY);
  if (baseline > 0.0001) {
    percentChange = (totalChange / baseline) * 100;
  }

  // Running record map (for sound cues and visual markers during scrubbing)
  let runningMax = -Infinity;
  let runningMin = Infinity;
  const recordsMap = {};

  for (let i = 0; i < n; i++) {
    const { year, value } = validPoints[i];
    let isRecordHigh = false;
    let isRecordLow = false;

    if (value > runningMax) {
      runningMax = value;
      // Mark as record high if it's not just the very first year
      if (i > 0) isRecordHigh = true;
    }
    if (value < runningMin) {
      runningMin = value;
      if (i > 0) isRecordLow = true;
    }

    recordsMap[year] = {
      isRecordHigh,
      isRecordLow,
      isAllTimeMax: value === maxVal,
      isAllTimeMin: value === minVal
    };
  }

  return {
    n,
    slope,
    intercept,
    changePerDecade,
    percentChange,
    totalChange,
    rSquared,
    tStat,
    pValue,
    isSignificant,
    mean: meanY,
    min: minVal,
    max: maxVal,
    recordHigh,
    recordLow,
    trendline,
    recordsMap
  };
}
