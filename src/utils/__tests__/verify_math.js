import { computeTimeSeriesStatistics, studentTPValue } from '../statistics.js';
import { mapValueToFrequency, PENTATONIC_FREQUENCIES, MIN_FREQ, MAX_FREQ } from '../audioUtils.js';

console.log('--- Testing Statistical Engine & Sonification Math ---');

// Test 1: Simple linear series
const testData = [];
for (let y = 1990; y <= 2000; y++) {
  testData.push({ year: y, value: 2 * (y - 1990) + 10 });
}

const stats = computeTimeSeriesStatistics(testData);
console.log('Test 1 - Slope:', stats.slope);
console.log('Test 1 - Change per decade:', stats.changePerDecade);
console.log('Test 1 - R-squared:', stats.rSquared);
console.log('Test 1 - p-value:', stats.pValue);
console.log('Test 1 - Is Significant:', stats.isSignificant);

if (Math.abs(stats.slope - 2) > 1e-4) throw new Error('Slope failed');
if (Math.abs(stats.changePerDecade - 20) > 1e-4) throw new Error('Change/decade failed');
if (!stats.isSignificant) throw new Error('Significance failed');

// Test 2: Real-world noisy climate warming trend (34 years: 1990 to 2023)
const noisyData = [];
for (let y = 1990; y <= 2023; y++) {
  const t = y - 1990;
  // warming trend of 0.04 deg/yr (0.4 deg/decade) plus pseudo-random noise
  const noise = (Math.sin(y * 12.345) * 0.3);
  noisyData.push({ year: y, value: 22.0 + 0.04 * t + noise });
}

const noisyStats = computeTimeSeriesStatistics(noisyData);
console.log('Test 2 - Warming slope:', noisyStats.slope.toFixed(4));
console.log('Test 2 - Change per decade:', noisyStats.changePerDecade.toFixed(3), '°C/decade');
console.log('Test 2 - p-value:', noisyStats.pValue);
console.log('Test 2 - Is Significant (p < 0.05):', noisyStats.isSignificant);
console.log('Test 2 - Percent change:', noisyStats.percentChange.toFixed(2), '%');
console.log('Test 2 - Record High year:', noisyStats.recordHigh.year, 'val:', noisyStats.recordHigh.value);

if (noisyStats.changePerDecade <= 0) throw new Error('Expected positive trend');
if (!noisyStats.isSignificant) throw new Error('Strong warming trend should be statistically significant');

// Test 3: Audio mapping tests
const freqMin = mapValueToFrequency(10, 10, 40, true);
const freqMax = mapValueToFrequency(40, 10, 40, true);
const freqMid = mapValueToFrequency(25, 10, 40, true);

if (Math.abs(freqMin - MIN_FREQ) > 0.01) throw new Error('Min freq failed');
if (Math.abs(freqMax - MAX_FREQ) > 0.01) throw new Error('Max freq failed');

console.log('✓ All 3 test suites passed completely!');
