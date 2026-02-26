import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import {
  type Job,
  type Benchmark,
  allJobs,
  formatCurrency,
  formatCurrencyK,
} from '../../data/compensationData';

interface JobDetailProps {
  job: Job;
  onBack: () => void;
  onAddBenchmark: () => void;
  newBenchmark?: Benchmark | null;
}

function BenchmarkBar({ benchmark }: { benchmark: Benchmark }) {
  const vals = benchmark.values.map(v => v.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const padding = (max - min) * 0.15;
  const scaleMin = min - padding;
  const scaleMax = max + padding;
  const range = scaleMax - scaleMin;

  const getPercent = (val: number) => ((val - scaleMin) / range) * 100;

  return (
    <div className="comp-benchmark-bar-area">
      <div className="comp-benchmark-bar-labels">
        {benchmark.values.map((v, i) => (
          <div
            key={v.label}
            className="comp-benchmark-bar-label"
            style={{
              position: 'absolute',
              left: `${getPercent(v.value)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="comp-benchmark-bar-label-text">{v.label}</span>
            <span className="comp-benchmark-bar-label-value">{formatCurrencyK(v.value)}</span>
          </div>
        ))}
      </div>
      <div className="comp-benchmark-bar-track" style={{ marginTop: '40px' }}>
        <div
          className="comp-benchmark-bar-line"
          style={{
            left: `${getPercent(vals[0])}%`,
            width: `${getPercent(vals[vals.length - 1]) - getPercent(vals[0])}%`,
            background: benchmark.color,
          }}
        />
        {/* End caps */}
        <div
          className="comp-benchmark-bar-end"
          style={{
            left: `${getPercent(vals[0])}%`,
            background: benchmark.color,
          }}
        />
        <div
          className="comp-benchmark-bar-end"
          style={{
            left: `${getPercent(vals[vals.length - 1])}%`,
            background: benchmark.color,
          }}
        />
        {/* Mid marker(s) */}
        {vals.slice(1, -1).map((v, i) => (
          <div
            key={i}
            className="comp-benchmark-bar-marker"
            style={{
              left: `${getPercent(v)}%`,
              borderColor: benchmark.color,
              background: 'white',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function CompanyPayBand({ job }: { job: Job }) {
  const allPays = job.employees.map(e => e.annualizedPayRate);
  const minVal = Math.min(job.payBandMin, ...allPays);
  const maxVal = Math.max(job.payBandMax, ...allPays);
  const padding = (maxVal - minVal) * 0.1;
  const scaleMin = minVal - padding;
  const scaleMax = maxVal + padding;
  const range = scaleMax - scaleMin;

  const getPercent = (val: number) => ((val - scaleMin) / range) * 100;

  // Group nearby employees
  const sortedEmps = [...job.employees].sort((a, b) => a.annualizedPayRate - b.annualizedPayRate);
  const groups: { position: number; employees: typeof sortedEmps }[] = [];
  const threshold = range * 0.03;

  for (const emp of sortedEmps) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && Math.abs(emp.annualizedPayRate - lastGroup.position) < threshold) {
      lastGroup.employees.push(emp);
      lastGroup.position = (lastGroup.position * (lastGroup.employees.length - 1) + emp.annualizedPayRate) / lastGroup.employees.length;
    } else {
      groups.push({ position: emp.annualizedPayRate, employees: [emp] });
    }
  }

  return (
    <div className="comp-payband-section">
      <div className="comp-payband-label">
        <div className="comp-payband-color-bar" />
        <div>
          <div className="comp-payband-title">Pineapple Inc</div>
          <div className="comp-payband-subtitle">{job.title}</div>
          <div className="comp-payband-info">Pay Band</div>
        </div>
      </div>
      <div style={{ position: 'relative', marginTop: '8px' }}>
        {/* Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', height: '36px' }}>
          <div style={{ position: 'absolute', left: `${getPercent(job.payBandMin)}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-neutral-weak)', display: 'block' }}>Min</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-neutral-x-strong)' }}>{formatCurrencyK(job.payBandMin)}</span>
          </div>
          <div style={{ position: 'absolute', left: `${getPercent(job.payBandMid)}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-neutral-weak)', display: 'block' }}>Mid</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-neutral-x-strong)' }}>{formatCurrencyK(job.payBandMid)}</span>
          </div>
          <div style={{ position: 'absolute', left: `${getPercent(job.payBandMax)}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-neutral-weak)', display: 'block' }}>Max</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-neutral-x-strong)' }}>{formatCurrencyK(job.payBandMax)}</span>
          </div>
        </div>
        {/* Bar */}
        <div style={{ position: 'relative', height: '32px', marginTop: '4px' }}>
          {/* Track */}
          <div style={{
            position: 'absolute',
            left: `${getPercent(job.payBandMin)}%`,
            width: `${getPercent(job.payBandMax) - getPercent(job.payBandMin)}%`,
            top: '12px',
            height: '8px',
            background: '#c6c2bf',
            borderRadius: '4px',
          }} />
          {/* Employee dots */}
          {groups.map((group, i) => {
            const pct = getPercent(group.position);
            if (group.employees.length === 1) {
              const emp = group.employees[0];
              return (
                <div
                  key={i}
                  className="comp-employee-dot"
                  style={{
                    left: `${pct}%`,
                    top: '16px',
                    backgroundColor: emp.avatar,
                  }}
                  title={`${emp.name}: ${formatCurrency(emp.annualizedPayRate)}`}
                >
                  {emp.name.split(' ').map(n => n[0]).join('')}
                </div>
              );
            }
            return (
              <div
                key={i}
                className="comp-employee-dot-group"
                style={{ left: `${pct}%`, top: '16px' }}
                title={`${group.employees.length} employees`}
              >
                {group.employees.length}
              </div>
            );
          })}
          {/* Dotted line extending beyond band for outliers */}
          {job.employees.some(e => e.annualizedPayRate > job.payBandMax) && (
            <div style={{
              position: 'absolute',
              left: `${getPercent(job.payBandMax)}%`,
              width: `${getPercent(Math.max(...allPays)) - getPercent(job.payBandMax) + 2}%`,
              top: '15px',
              height: '2px',
              borderTop: '2px dashed #c6c2bf',
            }} />
          )}
        </div>
        {/* Scale */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          {(() => {
            const ticks: number[] = [];
            const step = Math.ceil(range / 5 / 10000) * 10000;
            for (let v = Math.ceil(scaleMin / step) * step; v <= scaleMax; v += step) {
              ticks.push(v);
            }
            return ticks.map(t => (
              <span key={t} style={{ fontSize: '11px', color: 'var(--text-neutral-weak)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {formatCurrencyK(t)}
              </span>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

function MiniPayBand({ employee }: { employee: Job['employees'][0] }) {
  const { payBandMin, payBandMax, annualizedPayRate } = employee;
  const range = payBandMax - payBandMin;
  const position = ((annualizedPayRate - payBandMin) / range) * 100;
  const clampedPos = Math.max(0, Math.min(100, position));

  let dotColor = '#41B3A3'; // green - in range
  if (annualizedPayRate < payBandMin || annualizedPayRate > payBandMax) {
    dotColor = '#E27D60'; // red/orange - out of range
  } else if (position < 20 || position > 80) {
    dotColor = '#D4A843'; // amber - near edge
  }

  return (
    <div className="comp-mini-payband">
      <span>{formatCurrency(payBandMin, true)}</span>
      <div className="comp-mini-payband-track">
        <div className="comp-mini-payband-fill" style={{ left: '0%', width: '100%' }} />
        <div
          className="comp-mini-payband-dot"
          style={{
            left: `${clampedPos}%`,
            background: dotColor,
          }}
        />
      </div>
      <span>{formatCurrency(payBandMax, true)}</span>
    </div>
  );
}

export function JobDetail({ job, onBack, onAddBenchmark, newBenchmark }: JobDetailProps) {
  const jobIndex = allJobs.findIndex(j => j.id === job.id);
  const totalJobs = allJobs.length;
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const displayBenchmarks = newBenchmark
    ? [...job.benchmarks, newBenchmark]
    : job.benchmarks;

  return (
    <div className="comp-benchmarks">
      {/* Breadcrumb */}
      <div className="comp-breadcrumb" onClick={onBack}>
        <Icon name="chevron-left" size={12} />
        Compensation Benchmarks
      </div>

      {/* Header */}
      <div className="comp-detail-header">
        <div className="comp-detail-title-row">
          <h1 className="comp-detail-title">{job.title}</h1>
          <span className="comp-detail-location">{job.location}</span>
        </div>
        <div className="comp-detail-right">
          <div className="comp-pagination">
            <span>{jobIndex + 1} of {totalJobs}</span>
            <span className="comp-pagination-link">&lsaquo; Previous</span>
            <span className="comp-pagination-separator">|</span>
            <span className="comp-pagination-link">Next &rsaquo;</span>
          </div>
          <Button variant="standard" icon="circle-plus" onClick={onAddBenchmark}>
            Add New Benchmark
          </Button>
        </div>
      </div>

      {/* Pay Data & Benchmarks Section */}
      <h2 className="comp-section-header">Pay Data & Benchmarks</h2>

      <div className="comp-benchmark-section">
        {displayBenchmarks.map(bm => (
          <div key={bm.id} className="comp-benchmark-row">
            <div className="comp-benchmark-info">
              <div className="comp-benchmark-source-line">
                <div className="comp-benchmark-color-bar" style={{ background: bm.color }} />
                <span className="comp-benchmark-source-name">{bm.source}</span>
                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                  <button
                    className="comp-modal-close"
                    style={{ width: '28px', height: '28px', border: 'none', background: 'none' }}
                    onClick={() => setMenuOpen(menuOpen === bm.id ? null : bm.id)}
                  >
                    <Icon name="ellipsis" size={14} />
                  </button>
                  {menuOpen === bm.id && (
                    <div className="comp-action-menu">
                      <button className="comp-action-menu-item" onClick={() => setMenuOpen(null)}>
                        <Icon name="pen" size={14} /> Edit
                      </button>
                      <button className="comp-action-menu-item" onClick={() => setMenuOpen(null)}>
                        <Icon name="trash-can" size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="comp-benchmark-matched-title">{bm.matchedTitle}</div>
              <div className="comp-benchmark-age">
                <Icon name="clock" size={12} variant="regular" />
                {bm.age}
              </div>
            </div>
            <BenchmarkBar benchmark={bm} />
          </div>
        ))}

        {/* Company Pay Band */}
        <CompanyPayBand job={job} />
      </div>

      {/* Employees Table */}
      <div style={{ marginTop: '32px' }}>
        <div className="comp-employees-section">
          <div className="comp-employees-header">
            <div>
              <span className="comp-employees-title">Employees With This Job Title</span>
              <span className="comp-employees-count">({job.employees.length})</span>
            </div>
            <Button variant="standard" icon="arrow-down-to-line" size="small">
              Export
            </Button>
          </div>

          <table className="comp-emp-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Annualized Pay Rate</th>
                <th>Compa Ratio</th>
                <th>Range Penetration</th>
                <th>YOE</th>
                <th>Pay Band</th>
              </tr>
            </thead>
            <tbody>
              {job.employees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="comp-emp-name-cell">
                      <div className="comp-emp-avatar" style={{ background: emp.avatar }}>
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="comp-emp-name-link">{emp.name}</span>
                    </div>
                  </td>
                  <td>{emp.location}</td>
                  <td>{formatCurrency(emp.annualizedPayRate)}</td>
                  <td>{emp.compaRatio.toFixed(2)}</td>
                  <td>{emp.rangePenetration}%</td>
                  <td>{emp.yoe}</td>
                  <td>
                    <MiniPayBand employee={emp} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
