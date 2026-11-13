import React, { useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { VARIABLES } from '../services/nasaApi';
import { translations } from '../utils/translations';
import { TrendingUp, Table, BarChart2 } from 'lucide-react';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function TimelineChart({
  lang = 'en',
  dataA = [],
  dataB = [],
  statsA = null,
  statsB = null,
  currentYear = 1990,
  primaryVariable = 'T2M',
  locationA = null,
  locationB = null,
  isCompareMode = false,
  showTable = false,
  onToggleTable = () => {}
}) {
  const t = translations[lang] || translations.en;
  const varMeta = VARIABLES[primaryVariable] || VARIABLES.T2M;
  const chartRef = useRef(null);

  // Extract years
  const years = useMemo(() => {
    return dataA.map(d => d.year);
  }, [dataA]);

  // Chart Data Configuration
  const chartData = useMemo(() => {
    if (!dataA || dataA.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = years;
    const valuesA = dataA.map(d => d.value);

    // Dynamic point sizes and colors: emphasize currentYear, recordHigh, recordLow
    const pointRadiiA = dataA.map(d => {
      if (d.year === currentYear) return 8;
      if (statsA?.recordsMap?.[d.year]?.isAllTimeMax || statsA?.recordsMap?.[d.year]?.isAllTimeMin) return 6;
      return 3;
    });

    const pointBgA = dataA.map(d => {
      if (d.year === currentYear) return '#ffffff';
      if (statsA?.recordsMap?.[d.year]?.isAllTimeMax) return '#ef4444'; // Red for record high
      if (statsA?.recordsMap?.[d.year]?.isAllTimeMin) return '#3b82f6'; // Blue for record low
      return '#38bdf8'; // Cyan
    });

    const datasets = [
      // Primary Data Line: Location A
      {
        label: `${lang === 'ar' ? (locationA?.nameAr || locationA?.nameEn) : locationA?.nameEn} (${varMeta.unitEn})`,
        data: valuesA,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderWidth: 2.5,
        pointBackgroundColor: pointBgA,
        pointBorderColor: '#0b0f19',
        pointBorderWidth: 1.5,
        pointRadius: pointRadiiA,
        pointHoverRadius: 9,
        tension: 0.25,
        fill: true
      }
    ];

    // Trendline for Location A
    if (statsA?.trendline && statsA.trendline.length > 0) {
      datasets.push({
        label: `${t.trendline} (Loc A)`,
        data: statsA.trendline.map(tl => parseFloat(tl.fitted.toFixed(2))),
        borderColor: 'rgba(56, 189, 248, 0.65)',
        borderWidth: 2,
        borderDash: [6, 5],
        pointRadius: 0,
        fill: false
      });
    }

    // Comparison Series: Location B
    if (isCompareMode && dataB && dataB.length > 0) {
      const valuesB = dataB.map(d => d.value);
      const pointRadiiB = dataB.map(d => (d.year === currentYear ? 8 : 3));
      const pointBgB = dataB.map(d => (d.year === currentYear ? '#ffffff' : '#f97316'));

      datasets.push({
        label: `${lang === 'ar' ? (locationB?.nameAr || locationB?.nameEn) : locationB?.nameEn} (${varMeta.unitEn})`,
        data: valuesB,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: pointBgB,
        pointBorderColor: '#0b0f19',
        pointBorderWidth: 1.5,
        pointRadius: pointRadiiB,
        pointHoverRadius: 9,
        tension: 0.25,
        fill: true
      });

      // Trendline for Location B
      if (statsB?.trendline && statsB.trendline.length > 0) {
        datasets.push({
          label: `${t.trendline} (Loc B)`,
          data: statsB.trendline.map(tl => parseFloat(tl.fitted.toFixed(2))),
          borderColor: 'rgba(249, 115, 22, 0.65)',
          borderWidth: 2,
          borderDash: [6, 5],
          pointRadius: 0,
          fill: false
        });
      }
    }

    return { labels, datasets };
  }, [dataA, dataB, statsA, statsB, years, currentYear, locationA, locationB, isCompareMode, varMeta, lang, t]);

  // Chart Custom Plugins: Vertical Cursor Line for current playing year
  const cursorPlugin = useMemo(() => {
    return {
      id: 'verticalCursorPlugin',
      afterDatasetsDraw(chart) {
        if (!currentYear) return;
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;

        const yearIndex = years.indexOf(currentYear);
        if (yearIndex === -1) return;

        const xPos = xAxis.getPixelForTick(yearIndex);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xPos, yAxis.top);
        ctx.lineTo(xPos, yAxis.bottom);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([4, 4]);
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 8;
        ctx.stroke();

        // Pulsing Year Tag at top
        ctx.fillStyle = '#38bdf8';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(xPos, yAxis.top, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    };
  }, [currentYear, years]);

  // Chart Options
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 250 // smooth transitions during playback
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#e2e8f0',
            font: {
              family: lang === 'ar' ? 'Cairo, sans-serif' : 'Inter, sans-serif',
              size: 13,
              weight: '600'
            },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#38bdf8',
          bodyColor: '#f8fafc',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: (items) => `${t.year}: ${items[0]?.label}`,
            label: (item) => `${item.dataset.label}: ${item.parsed.y} ${varMeta.unitEn}`
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(51, 65, 85, 0.35)',
            borderColor: 'rgba(51, 65, 85, 0.6)'
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'JetBrains Mono, monospace',
              size: 12
            },
            maxTicksLimit: 14
          }
        },
        y: {
          grid: {
            color: 'rgba(51, 65, 85, 0.35)',
            borderColor: 'rgba(51, 65, 85, 0.6)'
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'JetBrains Mono, monospace',
              size: 12
            },
            callback: (val) => `${val} ${varMeta.unitEn}`
          }
        }
      }
    };
  }, [lang, t, varMeta]);

  const startYear = years[0] || 1990;
  const endYear = years[years.length - 1] || (new Date().getFullYear() - 1);
  const headingText = (t.chartHeading || 'Historical Trend ({range})').replace('{range}', `${startYear} – ${endYear}`);

  return (
    <section className="card chart-card" aria-labelledby="chart-section-heading">
      <div className="card-header">
        <div className="card-title-group">
          <TrendingUp className="section-icon" aria-hidden="true" />
          <div>
            <h2 id="chart-section-heading" className="card-title">{headingText}</h2>
            <p className="card-sub">
              {t.dataSubheading} • {lang === 'ar' ? varMeta.nameAr : varMeta.nameEn}
            </p>
          </div>
        </div>

        {/* View Toggle: Chart vs Accessible Data Table */}
        <div className="view-toggle-wrap">
          <button
            type="button"
            className={`btn-toggle-view ${!showTable ? 'active' : ''}`}
            onClick={() => onToggleTable(false)}
            aria-pressed={!showTable}
          >
            <BarChart2 className="icon-sm" aria-hidden="true" />
            <span>{t.chartView}</span>
          </button>
          <button
            type="button"
            className={`btn-toggle-view ${showTable ? 'active' : ''}`}
            onClick={() => onToggleTable(true)}
            aria-pressed={showTable}
          >
            <Table className="icon-sm" aria-hidden="true" />
            <span>{t.dataTableView}</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="chart-canvas-wrapper" role="img" aria-label={t.chartAriaLabel}>
        <Line
          ref={chartRef}
          data={chartData}
          options={chartOptions}
          plugins={[cursorPlugin]}
        />
      </div>

      {/* Chart Highlights Row */}
      <div className="chart-highlights">
        <div className="highlight-pill highlight-current">
          <span className="dot dot-white"></span>
          <span className="label">{t.currentYearLabel.replace('{year}', currentYear)}</span>
        </div>
        {statsA?.recordHigh && (
          <div className="highlight-pill highlight-high">
            <span className="dot dot-red"></span>
            <span className="label">
              {t.recordHigh}: {statsA.recordHigh.value} {varMeta.unitEn} ({statsA.recordHigh.year})
            </span>
          </div>
        )}
        {statsA?.recordLow && (
          <div className="highlight-pill highlight-low">
            <span className="dot dot-blue"></span>
            <span className="label">
              {t.recordLow}: {statsA.recordLow.value} {varMeta.unitEn} ({statsA.recordLow.year})
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
