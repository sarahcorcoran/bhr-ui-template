import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { departments, formatCurrency, type Job } from '../../data/compensationData';

interface BenchmarksOverviewProps {
  onSelectJob: (job: Job) => void;
}

function PayRangeBar({ job }: { job: Job }) {
  const allPays = job.employees.map(e => e.annualizedPayRate);
  const min = Math.min(job.payRangeMin, ...allPays);
  const max = Math.max(job.payRangeMax, ...allPays);
  const padding = (max - min) * 0.1;
  const scaleMin = Math.floor((min - padding) / 10000) * 10000;
  const scaleMax = Math.ceil((max + padding) / 10000) * 10000;
  const range = scaleMax - scaleMin;

  const getPercent = (val: number) => ((val - scaleMin) / range) * 100;

  // Generate tick marks
  const ticks: number[] = [];
  for (let v = scaleMin; v <= scaleMax; v += 10000) {
    ticks.push(v);
  }

  // Group nearby employees to avoid overlapping dots
  const sortedEmps = [...job.employees].sort((a, b) => a.annualizedPayRate - b.annualizedPayRate);
  const groups: { position: number; employees: typeof sortedEmps }[] = [];
  const threshold = range * 0.04; // 4% of range

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
    <div className="comp-range-bar-container">
      <div className="comp-range-bar-scale">
        {ticks.map(t => (
          <span key={t} className="comp-range-bar-tick">
            {formatCurrency(t, true)}
          </span>
        ))}
      </div>
      <div className="comp-range-bar-track">
        {/* Pay range fill */}
        <div
          className="comp-range-bar-fill"
          style={{
            left: `${getPercent(job.payRangeMin)}%`,
            width: `${getPercent(job.payRangeMax) - getPercent(job.payRangeMin)}%`,
          }}
        />
        {/* Midline */}
        <div
          className="comp-range-bar-midline"
          style={{ left: `${getPercent(job.payBandMid)}%` }}
        />
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
              style={{ left: `${pct}%` }}
              title={`${group.employees.length} employees`}
            >
              {group.employees.length}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BenchmarksOverview({ onSelectJob }: BenchmarksOverviewProps) {
  const totalJobs = departments.reduce((sum, d) => sum + d.jobs.length, 0);

  return (
    <div className="comp-benchmarks">
      {/* Breadcrumb */}
      <div className="comp-breadcrumb">
        <Icon name="chevron-left" size={12} />
        Home
      </div>

      {/* Page Header */}
      <div className="comp-page-header">
        <h1 className="comp-page-title">Compensation Benchmarks</h1>
        <div className="comp-page-actions">
          <Button variant="standard" icon="magnifying-glass">
            Search Mercer
          </Button>
          <Button variant="standard" icon="arrow-up-from-bracket">
            Upload Benchmarks
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="comp-controls">
        <div className="comp-controls-left">
          <span className="comp-jobs-count">
            Jobs <span>({totalJobs})</span>
          </span>
          <span className="comp-label">Group by</span>
          <button className="comp-dropdown">
            <Icon name="user-group" size={14} />
            Department
            <Icon name="caret-down" size={10} />
          </button>
        </div>
        <div className="comp-controls-right">
          <span className="comp-label">Show</span>
          <button className="comp-dropdown">
            All Employees
            <Icon name="caret-down" size={10} />
          </button>
          <span className="comp-label">in</span>
          <button className="comp-dropdown">
            Filled Roles
            <Icon name="caret-down" size={10} />
          </button>
        </div>
      </div>

      {/* Department Groups */}
      {departments.map(dept => (
        <div key={dept.name} className="comp-dept-group">
          <div className="comp-dept-header">
            <span className="comp-dept-name">{dept.name}</span>
            <span className="comp-dept-region">{dept.region}</span>
          </div>

          <table className="comp-job-table">
            <thead>
              <tr>
                <th style={{ width: '200px' }}>Job Title / Level</th>
                <th style={{ width: '120px' }}>Location</th>
                <th style={{ width: '120px' }}>
                  <span className="comp-pay-rate-header">
                    Pay Rate
                    <Icon name="circle-info" size={12} className="text-[var(--text-neutral-weak)]" />
                    <Icon name="arrow-down-to-line" size={12} className="text-[var(--text-neutral-weak)]" />
                  </span>
                </th>
                <th>{/* Pay Range Bar - spans remaining width */}</th>
              </tr>
            </thead>
            <tbody>
              {dept.jobs.map(job => (
                <tr key={job.id} onClick={() => onSelectJob(job)}>
                  <td>
                    <div className="comp-job-title-cell">
                      <span
                        className="comp-job-title-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectJob(job);
                        }}
                      >
                        {job.title}
                      </span>
                      <span className="comp-job-level">{job.level}</span>
                    </div>
                  </td>
                  <td>{job.location}</td>
                  <td>${job.payRate.toLocaleString()} / Year</td>
                  <td>
                    <PayRangeBar job={job} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
