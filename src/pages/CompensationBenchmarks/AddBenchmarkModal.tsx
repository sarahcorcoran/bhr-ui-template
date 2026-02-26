import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import {
  type Job,
  type MercerResult,
  type Benchmark,
  type FilterMatch,
  mercerResults,
  getMercerResultsForJob,
  formatCurrency,
} from '../../data/compensationData';
import mercerLogoSrc from '../../assets/images/mercer-logo.jpg';

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface AddBenchmarkModalProps {
  job: Job;
  onClose: () => void;
  onSave: (benchmark: Benchmark) => void;
}

type ModalState = 'thinking' | 'result';

// ---- Confidence Ring SVG ----
function ConfidenceRing({ value }: { value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  let ringColor = '#8fad85'; // muted sage green (90-100%)
  if (value < 70) {
    ringColor = '#b0ada8'; // muted gray
  } else if (value < 90) {
    ringColor = '#c8a96e'; // muted warm amber
  }

  const bgColor = value >= 90 ? '#e8f0e6' : value >= 70 ? '#f5eedd' : '#eeedeb';

  return (
    <div className="comp-confidence-ring">
      <svg className="comp-confidence-svg" viewBox="0 0 88 88">
        {/* Background circle */}
        <circle
          cx="44" cy="44" r={radius}
          fill={bgColor}
          stroke="#e4e3e0"
          strokeWidth="4"
        />
        {/* Progress ring */}
        <circle
          cx="44" cy="44" r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
        {/* Percentage text */}
        <text
          x="44" y="48"
          textAnchor="middle"
          className="comp-confidence-text"
        >
          {value}%
        </text>
      </svg>
      <span className="comp-confidence-label">Match</span>
    </div>
  );
}

// ---- Filter Match Breakdown ----
function FilterMatchBreakdown({ matches }: { matches: FilterMatch }) {
  const filters = [
    { key: 'description', label: 'Description', matched: matches.description },
    { key: 'location', label: 'Location', matched: matches.location },
    { key: 'companySize', label: 'Company Size', matched: matches.companySize },
    { key: 'industry', label: 'Industry', matched: matches.industry },
    { key: 'level', label: 'Exact Level', matched: matches.level },
  ];

  return (
    <div className="comp-filter-breakdown">
      {filters.map((f, i) => (
        <span key={f.key} className="comp-filter-breakdown-item">
          {i > 0 && <span className="comp-filter-breakdown-sep">&middot;</span>}
          <span className={f.matched ? 'comp-filter-match' : 'comp-filter-miss'}>
            {f.matched ? '✓' : '✗'}
          </span>
          <span className={f.matched ? 'comp-filter-match-label' : 'comp-filter-miss-label'}>
            {f.label}
          </span>
        </span>
      ))}
    </div>
  );
}

// ---- Matched Pay Range ----
function MatchedPayRange({
  result,
  currentPay,
}: {
  result: MercerResult;
  currentPay: number;
}) {
  const min = result.basePay25;
  const max = result.basePay75;
  const range = max - min;
  const padding = range * 0.25;
  const scaleMin = min - padding;
  const scaleMax = max + padding;
  const totalRange = scaleMax - scaleMin;

  const getPercent = (val: number) => ((val - scaleMin) / totalRange) * 100;

  const payPct = getPercent(currentPay);
  const payInRange = currentPay >= min && currentPay <= max;
  const percentile = Math.round(((currentPay - min) / range) * 50 + 25);
  const dotColor = payInRange ? '#8fad85' : '#c8a96e';

  return (
    <div className="comp-matched-range">
      <div style={{ position: 'relative', height: '36px' }}>
        <div style={{ position: 'absolute', left: `${getPercent(result.basePay25)}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
          <span className="comp-matched-range-label-text">25th %</span>
          <span className="comp-matched-range-label-value">{formatCurrency(result.basePay25)}</span>
        </div>
        <div style={{ position: 'absolute', left: `${getPercent(result.basePay50)}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
          <span className="comp-matched-range-label-text">50th %</span>
          <span className="comp-matched-range-label-value">{formatCurrency(result.basePay50)}</span>
        </div>
        <div style={{ position: 'absolute', left: `${getPercent(result.basePay75)}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
          <span className="comp-matched-range-label-text">75th %</span>
          <span className="comp-matched-range-label-value">{formatCurrency(result.basePay75)}</span>
        </div>
      </div>
      <div className="comp-matched-range-track">
        {/* Line */}
        <div
          className="comp-matched-range-line"
          style={{
            left: `${getPercent(result.basePay25)}%`,
            width: `${getPercent(result.basePay75) - getPercent(result.basePay25)}%`,
          }}
        />
        {/* End caps */}
        <div className="comp-matched-range-end-cap" style={{ left: `${getPercent(result.basePay25)}%`, background: '#0051A8' }} />
        <div className="comp-matched-range-end-cap" style={{ left: `${getPercent(result.basePay75)}%`, background: '#0051A8' }} />
        {/* Mid marker */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${getPercent(result.basePay50)}%`,
            transform: 'translate(-50%, -50%)',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            border: '2px solid #0051A8',
            background: 'white',
          }}
        />
        {/* Current pay dot */}
        <div
          className="comp-matched-range-dot"
          style={{
            left: `${payPct}%`,
            background: dotColor,
          }}
          title={`Current pay: ${formatCurrency(currentPay)}`}
        />
      </div>
      <div className="comp-matched-range-annotation" style={{ color: !payInRange ? '#8a6d3b' : undefined }}>
        Current pay ({formatCurrency(currentPay)}) is at the {ordinal(Math.max(1, percentile))} percentile of this benchmark
      </div>
    </div>
  );
}

// ---- Job Description Drawer ----
function JobDescriptionDrawer({
  result,
  onClose,
}: {
  result: MercerResult;
  onClose: () => void;
}) {
  return (
    <div className="comp-drawer-overlay" onClick={onClose}>
      <div className="comp-drawer" onClick={e => e.stopPropagation()}>
        <div className="comp-drawer-header">
          <div>
            <div className="comp-drawer-title">{result.title}</div>
            <div className="comp-drawer-subtitle">{result.level} &middot; {result.source} &middot; {result.year}</div>
          </div>
          <button className="comp-modal-close" onClick={onClose}>
            <Icon name="xmark" size={14} />
          </button>
        </div>
        <div className="comp-drawer-body">
          <div className="comp-drawer-description">
            <p style={{ marginBottom: '16px' }}>
              <strong>Job Summary</strong>
            </p>
            <p style={{ marginBottom: '12px' }}>
              {result.description}
            </p>
            <p style={{ marginBottom: '16px' }}>
              <strong>Key Responsibilities</strong>
            </p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Develop and execute comprehensive sourcing strategies to attract qualified candidates for technical positions</li>
              <li>Conduct initial screening interviews and technical phone screens to assess candidate qualifications</li>
              <li>Partner with hiring managers to understand team needs, role requirements, and organizational culture fit</li>
              <li>Manage the full recruitment lifecycle from job posting through offer negotiation and onboarding</li>
              <li>Maintain accurate records in applicant tracking systems and generate recruiting metrics reports</li>
              <li>Build and maintain talent pipelines for current and future hiring needs across the organization</li>
            </ul>
            <p style={{ marginTop: '16px', marginBottom: '16px' }}>
              <strong>Typical Requirements</strong>
            </p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Bachelor's degree in Human Resources, Business Administration, or related field</li>
              <li>3-5 years of recruiting experience, preferably in technical/engineering roles</li>
              <li>Experience with ATS platforms (Greenhouse, Lever, or similar)</li>
              <li>Strong understanding of technical roles and industry compensation trends</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddBenchmarkModal({ job, onClose, onSave }: AddBenchmarkModalProps) {
  const [modalState, setModalState] = useState<ModalState>('thinking');
  const [thinkingStep, setThinkingStep] = useState(0);
  const [selectedResult, setSelectedResult] = useState<MercerResult | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [drawerResult, setDrawerResult] = useState<MercerResult | null>(null);
  const [displayResults, setDisplayResults] = useState<MercerResult[]>([]);
  const [showConfidenceTooltip, setShowConfidenceTooltip] = useState(false);
  const [showHeaderTooltip, setShowHeaderTooltip] = useState(false);
  const [hoveredConfidenceId, setHoveredConfidenceId] = useState<string | null>(null);

  const results = job.id === 'po-recruiter' ? mercerResults : getMercerResultsForJob(job.id);
  const topResult = results[0];

  // Determine if low confidence
  const isLowConfidence = topResult && topResult.confidence < 70;

  const thinkingSteps = [
    `Analyzing job description for ${job.title}…`,
    'Identifying key skills: full-cycle recruiting, sourcing, screening…',
    'Searching Mercer database across all job levels…',
    'Comparing 23 potential matches by description similarity…',
    'Best match found.',
  ];

  // Thinking animation
  useEffect(() => {
    if (modalState !== 'thinking') return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    thinkingSteps.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setThinkingStep(i + 1);
        }, (i + 1) * 500)
      );
    });

    // Transition to result
    timers.push(
      setTimeout(() => {
        setModalState('result');
        setSelectedResult(topResult);
        setDisplayResults(results);
        // Auto-expand for low confidence
        if (isLowConfidence) {
          setShowWhy(true);
        }
      }, thinkingSteps.length * 500 + 800)
    );

    return () => timers.forEach(clearTimeout);
  }, [modalState]);

  const handleSave = useCallback(() => {
    if (!selectedResult) return;

    const newBenchmark: Benchmark = {
      id: `mercer-new-${Date.now()}`,
      source: 'Mercer',
      matchedTitle: selectedResult.title,
      color: '#0051A8',
      age: 'Just now',
      rangeType: 'percentile',
      values: [
        { label: '25th %', value: selectedResult.basePay25 },
        { label: '50th %', value: selectedResult.basePay50 },
        { label: '75th %', value: selectedResult.basePay75 },
      ],
    };

    onSave(newBenchmark);
  }, [selectedResult, onSave]);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setDisplayResults(results);
    }, 1000);
  };

  // Confidence score display helper
  function confidenceBadge(confidence: number) {
    let className = 'comp-confidence-badge';
    if (confidence >= 90) className += ' comp-confidence-badge--high';
    else if (confidence >= 70) className += ' comp-confidence-badge--medium';
    else className += ' comp-confidence-badge--low';
    return <span className={className}>{confidence}%</span>;
  }

  return (
    <div className="comp-modal-overlay" onClick={onClose}>
      <div className="comp-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="comp-modal-header">
          <h2 className="comp-modal-title">Add Mercer Benchmark</h2>
          <div className="comp-modal-header-right">
            <div className="comp-mercer-badge">
              <span>Benchmarks powered by</span>
              <img
                src={mercerLogoSrc}
                alt="Mercer"
                className="comp-mercer-logo"
              />
            </div>
            <button className="comp-modal-close" onClick={onClose}>
              <Icon name="xmark" size={14} />
            </button>
          </div>
        </div>

        {/* Job Context Bar */}
        <div className="comp-job-context">
          <div className="comp-job-context-label">Pineapple Inc Job Title</div>
          <div className="comp-job-context-title">{job.title}</div>
          <div className="comp-job-context-meta">
            <span className="comp-job-context-meta-item">
              <Icon name="location-dot" size={14} /> {job.location}
            </span>
            <span className="comp-job-context-meta-item">
              <Icon name="user-group" size={14} /> {job.employees.length}
            </span>
            <span className="comp-job-context-meta-item">
              <Icon name="circle-dollar" size={14} /> {formatCurrency(job.payRate)}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="comp-modal-body">
          {/* ---- THINKING STATE ---- */}
          {modalState === 'thinking' && (
            <div className="comp-thinking-container">
              <div className="comp-thinking-header">Finding your best match…</div>
              {thinkingSteps.map((step, i) => {
                const isComplete = i < thinkingStep;
                const isActive = i === thinkingStep - 1 && thinkingStep <= thinkingSteps.length;
                const isPending = i >= thinkingStep;

                return (
                  <div
                    key={i}
                    className={`comp-thinking-step ${isComplete ? 'complete' : ''} ${isActive ? 'active' : ''}`}
                    style={{
                      opacity: isPending ? 0.4 : 1,
                      transition: 'opacity 0.3s',
                    }}
                  >
                    <div className="comp-thinking-icon">
                      {isComplete && !isActive ? (
                        <Icon name="check" size={14} className="comp-thinking-check" />
                      ) : isActive ? (
                        <div className="comp-thinking-pulse" />
                      ) : (
                        <div className="comp-thinking-pending" />
                      )}
                    </div>
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ---- RESULT STATE ---- */}
          {modalState === 'result' && selectedResult && (
            <>
              {/* 1. Best Match Card (with "Why this match?" inside) */}
              <div className="comp-matched-card">
                <div className="comp-matched-card-inner">
                  <div
                    className="comp-confidence-ring-wrapper"
                    onMouseEnter={() => setShowConfidenceTooltip(true)}
                    onMouseLeave={() => setShowConfidenceTooltip(false)}
                  >
                    <ConfidenceRing value={selectedResult.confidence} />
                    {showConfidenceTooltip && (
                      <div className="comp-confidence-tooltip">
                        <div style={{ marginBottom: '8px' }}>
                          Match confidence is based on how closely this result aligns with your job's filters.
                        </div>
                        <FilterMatchBreakdown matches={selectedResult.filterMatches} />
                      </div>
                    )}
                  </div>
                  <div className="comp-matched-card-details">
                    <div className="comp-matched-title-row">
                      <span className="comp-matched-title">{selectedResult.title}</span>
                      <span className="comp-level-badge">{selectedResult.level}</span>
                    </div>
                    <div className="comp-matched-meta">
                      {selectedResult.source} &middot; {selectedResult.year} &middot; {selectedResult.location} &middot; {selectedResult.industry}
                    </div>
                    <div className="comp-matched-survey">
                      {selectedResult.companiesSurveyed} companies &middot; {selectedResult.employeesSurveyed.toLocaleString()} employees surveyed
                    </div>
                    <MatchedPayRange result={selectedResult} currentPay={job.payRate} />
                  </div>
                </div>

                {/* Low confidence note */}
                {isLowConfidence && (
                  <div className="comp-low-confidence-note">
                    <Icon name="circle-info" size={14} style={{ color: '#8a6d3b', marginTop: '2px', flexShrink: 0 }} />
                    <span>This was the closest match available. You may want to adjust the filters below.</span>
                  </div>
                )}

                {/* Why this match? — INSIDE the card */}
                <button
                  className="comp-why-toggle"
                  onClick={() => setShowWhy(!showWhy)}
                >
                  <Icon name={showWhy ? 'chevron-down' : 'chevron-right'} size={12} />
                  Why this match?
                </button>

                {showWhy && (
                  <div className="comp-why-content">
                    <div className="comp-why-filter-summary">
                      <FilterMatchBreakdown matches={selectedResult.filterMatches} />
                    </div>
                    <div className="comp-why-reasoning">
                      <div className="comp-why-item">
                        <span className="comp-why-item-label">Job description alignment (high): </span>
                        Both roles focus on full-cycle technical recruiting — sourcing, screening, and hiring technology professionals. The core responsibilities overlap significantly.
                      </div>
                      <div className="comp-why-item">
                        <span className="comp-why-item-label">Level match ({selectedResult.level}): </span>
                        Based on the scope of the role (independent contributor, partners with hiring managers), {selectedResult.level} Specialist/Professional is the appropriate level.
                      </div>
                      <div className="comp-why-item">
                        <span className="comp-why-item-label">Location: </span>
                        {selectedResult.location} data is the closest available metro match for {job.location} within the same labor market.
                      </div>
                      <div className="comp-why-item">
                        <span className="comp-why-item-label">Company size & industry: </span>
                        Filtered to SMB dataset (500–1,000 employees). All-industries data selected for broader, more stable results.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Filter Controls — always visible below card */}
              <div className="comp-filters-section">
                <div className="comp-filters-row">
                  <div className="comp-filter-group">
                    <label className="comp-filter-label">Location</label>
                    <select className="comp-filter-select" defaultValue="salt-lake-city">
                      <option value="salt-lake-city">Salt Lake City, UT</option>
                      <option value="provo">Provo, UT</option>
                      <option value="national">National</option>
                    </select>
                  </div>
                  <div className="comp-filter-group">
                    <label className="comp-filter-label">Company Size</label>
                    <select className="comp-filter-select" defaultValue="smb">
                      <option value="smb">SMB (500-1000)</option>
                      <option value="mid">Mid-Market (1000-5000)</option>
                      <option value="enterprise">Enterprise (5000+)</option>
                    </select>
                  </div>
                  <div className="comp-filter-group">
                    <label className="comp-filter-label">Industry</label>
                    <select className="comp-filter-select" defaultValue="all">
                      <option value="all">All Industries</option>
                      <option value="tech">Technology</option>
                      <option value="healthcare">Healthcare</option>
                    </select>
                  </div>
                  <div className="comp-filter-group">
                    <label className="comp-filter-label">Job Level</label>
                    <select className="comp-filter-select" defaultValue="all">
                      <option value="all">All Levels</option>
                      <option value="p3">P3</option>
                      <option value="p4">P4</option>
                      <option value="p5">P5</option>
                    </select>
                  </div>
                  <div style={{ paddingTop: '18px' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleSearch}
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </div>

              {/* Search loading */}
              {isSearching && (
                <div className="comp-research-loading">
                  <div className="comp-research-spinner" />
                  Searching with updated filters…
                </div>
              )}

              {/* 3. Results Table — always visible */}
              {!isSearching && displayResults.length > 0 && (
                <div className="comp-results-section">
                  <div className="comp-results-header">
                    Search Results ({displayResults.length} matching jobs)
                  </div>
                  <table className="comp-results-table">
                    <thead>
                      <tr>
                        <th style={{ width: '36px' }}></th>
                        <th>Job Title</th>
                        <th>Level</th>
                        <th>
                          <div className="comp-confidence-header">
                            Confidence
                            <span
                              className="comp-confidence-info-icon"
                              onMouseEnter={() => setShowHeaderTooltip(true)}
                              onMouseLeave={() => setShowHeaderTooltip(false)}
                            >
                              <Icon name="circle-info" size={12} />
                              {showHeaderTooltip && (
                                <div className="comp-confidence-tooltip">
                                  Match confidence is based on how closely this result aligns with your job's filters: description similarity, location, company size, industry, and job level.
                                </div>
                              )}
                            </span>
                          </div>
                        </th>
                        <th>Base Pay 25th %</th>
                        <th>Base Pay 50th %</th>
                        <th>Base Pay 75th %</th>
                        <th>Companies</th>
                        <th>Employees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayResults.map(r => (
                        <tr
                          key={r.id}
                          className={selectedResult.id === r.id ? 'selected' : ''}
                          onClick={() => setSelectedResult(r)}
                        >
                          <td>
                            <div className={`comp-radio ${selectedResult.id === r.id ? 'selected' : ''}`}>
                              {selectedResult.id === r.id && <div className="comp-radio-dot" />}
                            </div>
                          </td>
                          <td>
                            <div>
                              <div style={{ fontWeight: 500 }}>{r.title}</div>
                              <span
                                className="comp-view-desc-link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDrawerResult(r);
                                }}
                              >
                                View Job Description
                              </span>
                            </div>
                          </td>
                          <td>{r.level}</td>
                          <td>
                            <div
                              className="comp-confidence-badge-wrapper"
                              onMouseEnter={() => setHoveredConfidenceId(r.id)}
                              onMouseLeave={() => setHoveredConfidenceId(null)}
                            >
                              {confidenceBadge(r.confidence)}
                              {hoveredConfidenceId === r.id && (
                                <div className="comp-badge-tooltip">
                                  <FilterMatchBreakdown matches={r.filterMatches} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td>{formatCurrency(r.basePay25)}</td>
                          <td>{formatCurrency(r.basePay50)}</td>
                          <td>{formatCurrency(r.basePay75)}</td>
                          <td>{r.companiesSurveyed}</td>
                          <td>{r.employeesSurveyed.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* No results edge case */}
          {modalState === 'result' && !selectedResult && (
            <div className="comp-no-results">
              <div className="comp-no-results-title">No benchmark data found for this job.</div>
              <div className="comp-no-results-text">Try searching with different filters below.</div>
            </div>
          )}

        </div>

        {/* Drawer - outside modal-body to avoid overflow clipping */}
        {drawerResult && (
          <JobDescriptionDrawer
            result={drawerResult}
            onClose={() => setDrawerResult(null)}
          />
        )}

        {/* Footer — sticky at bottom */}
        {modalState === 'result' && (
          <div className="comp-modal-footer">
            <Button variant="primary" onClick={handleSave}>
              Save Benchmark
            </Button>
            <Button variant="text" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
