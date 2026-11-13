import React from 'react';
import { Download, Table, BarChart2, ArrowLeft, ArrowRight } from 'lucide-react';
import { VARIABLES } from '../services/nasaApi';
import { translations } from '../utils/translations';

export function DataTable({
  lang = 'en',
  dataA = [],
  dataB = [],
  statsA = null,
  statsB = null,
  primaryVariable = 'T2M',
  locationA = null,
  locationB = null,
  isCompareMode = false,
  currentYear = 1990,
  showTable = true,
  onToggleTable = () => {}
}) {
  const t = translations[lang] || translations.en;
  const varMeta = VARIABLES[primaryVariable] || VARIABLES.T2M;

  const baselineA = dataA[0]?.value || 0;
  const baselineB = dataB[0]?.value || 0;

  // Export CSV
  const handleDownloadCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (isCompareMode) {
      csvContent += `Year,${locationA?.nameEn || 'Loc A'} (${varMeta.unitEn}),${locationA?.nameEn || 'Loc A'} Anomaly,${locationB?.nameEn || 'Loc B'} (${varMeta.unitEn}),${locationB?.nameEn || 'Loc B'} Anomaly,Records\n`;
      dataA.forEach((rowA) => {
        const rowB = dataB.find(b => b.year === rowA.year);
        const anomA = (rowA.value - baselineA).toFixed(2);
        const valB = rowB ? rowB.value : '';
        const anomB = rowB ? (rowB.value - baselineB).toFixed(2) : '';
        const recMeta = statsA?.recordsMap?.[rowA.year];
        const recordTag = recMeta?.isAllTimeMax ? 'Record High' : (recMeta?.isAllTimeMin ? 'Record Low' : '');
        csvContent += `${rowA.year},${rowA.value},${anomA},${valB},${anomB},${recordTag}\n`;
      });
    } else {
      csvContent += `Year,${locationA?.nameEn || 'Location'} (${varMeta.unitEn}),Anomaly (Diff from 1990),Records\n`;
      dataA.forEach((row) => {
        const anom = (row.value - baselineA).toFixed(2);
        const recMeta = statsA?.recordsMap?.[row.year];
        const recordTag = recMeta?.isAllTimeMax ? 'Record High' : (recMeta?.isAllTimeMin ? 'Record Low' : '');
        csvContent += `${row.year},${row.value},${anom},${recordTag}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `earth_jukebox_${primaryVariable}_${locationA?.id || 'data'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="card table-card" aria-labelledby="table-section-heading">
      <div className="card-header">
        <div className="card-title-group">
          <Table className="section-icon" aria-hidden="true" />
          <div>
            <h2 id="table-section-heading" className="card-title">{t.dataTableView}</h2>
            <p className="card-sub">{t.tableCaption}</p>
          </div>
        </div>

        <div className="table-header-actions">
          {/* View Toggle: Chart View vs Data Table */}
          <div className="view-toggle-wrap">
            <button
              type="button"
              className={`btn-toggle-view ${!showTable ? 'active' : ''}`}
              onClick={() => onToggleTable(false)}
              aria-pressed={!showTable}
              title={t.chartView}
            >
              <BarChart2 className="icon-sm" aria-hidden="true" />
              <span>{t.chartView}</span>
            </button>
            <button
              type="button"
              className={`btn-toggle-view ${showTable ? 'active' : ''}`}
              onClick={() => onToggleTable(true)}
              aria-pressed={showTable}
              title={t.dataTableView}
            >
              <Table className="icon-sm" aria-hidden="true" />
              <span>{t.dataTableView}</span>
            </button>
          </div>

          <button
            type="button"
            className="btn-download-csv"
            onClick={handleDownloadCsv}
            aria-label={t.downloadCsv}
          >
            <Download className="icon-sm" aria-hidden="true" />
            <span>{t.downloadCsv}</span>
          </button>
        </div>
      </div>

      {/* Prominent Banner / Quick Action to Return to Chart View */}
      <div className="return-chart-banner">
        <button
          type="button"
          className="btn-return-chart"
          onClick={() => onToggleTable(false)}
          aria-label={t.returnToChart}
        >
          {lang === 'ar' ? (
            <ArrowRight className="icon-sm" aria-hidden="true" />
          ) : (
            <ArrowLeft className="icon-sm" aria-hidden="true" />
          )}
          <span>{t.returnToChart}</span>
        </button>
      </div>

      <div className="table-responsive-container">
        <table className="accessible-data-table" aria-label={t.tableCaption}>
          <caption className="sr-only">{t.tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{t.colYear}</th>
              <th scope="col">
                {lang === 'ar' ? (locationA?.nameAr || locationA?.nameEn) : locationA?.nameEn} ({varMeta.unitEn})
              </th>
              <th scope="col">{t.colAnomaly}</th>
              {isCompareMode && (
                <>
                  <th scope="col">
                    {lang === 'ar' ? (locationB?.nameAr || locationB?.nameEn) : locationB?.nameEn} ({varMeta.unitEn})
                  </th>
                  <th scope="col">{t.colAnomaly} (B)</th>
                </>
              )}
              <th scope="col">{t.colRecords}</th>
            </tr>
          </thead>
          <tbody>
            {dataA.map((row) => {
              const isCurrent = row.year === currentYear;
              const anomalyA = row.value - baselineA;
              const rowB = isCompareMode ? dataB.find(b => b.year === row.year) : null;
              const anomalyB = rowB ? rowB.value - baselineB : 0;
              const recMeta = statsA?.recordsMap?.[row.year];

              return (
                <tr key={row.year} className={isCurrent ? 'row-active-year' : ''}>
                  <th scope="row" className="cell-year">
                    {row.year}
                    {isCurrent && <span className="active-cursor-tag">●</span>}
                  </th>
                  <td className="cell-value">{row.value} {varMeta.unitEn}</td>
                  <td className={`cell-anomaly ${anomalyA >= 0 ? 'pos' : 'neg'}`}>
                    {anomalyA > 0 ? `+${anomalyA.toFixed(2)}` : anomalyA.toFixed(2)}
                  </td>
                  {isCompareMode && (
                    <>
                      <td className="cell-value">{rowB ? `${rowB.value} ${varMeta.unitEn}` : '—'}</td>
                      <td className={`cell-anomaly ${anomalyB >= 0 ? 'pos' : 'neg'}`}>
                        {rowB ? (anomalyB > 0 ? `+${anomalyB.toFixed(2)}` : anomalyB.toFixed(2)) : '—'}
                      </td>
                    </>
                  )}
                  <td className="cell-records">
                    {recMeta?.isAllTimeMax && (
                      <span className="record-badge record-high">{t.recordHigh}</span>
                    )}
                    {recMeta?.isAllTimeMin && (
                      <span className="record-badge record-low">{t.recordLow}</span>
                    )}
                    {recMeta?.isRecordHigh && !recMeta?.isAllTimeMax && (
                      <span className="record-badge record-running-high">{t.runningRecordHigh}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
