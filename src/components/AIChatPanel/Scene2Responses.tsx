// ============================================================
// Scene 2 Visual Response Components
// Rich card responses for insight card-triggered conversations
// ============================================================

interface ResponseProps {
  onAction: (text: string) => void;
}

// --- Shared helpers ---

function Avatar({ initials, className = '' }: { initials: string; className?: string }) {
  return (
    <div className={`w-8 h-8 rounded-full bg-[var(--surface-neutral-x-weak)] flex items-center justify-center shrink-0 ${className}`}>
      <span className="text-[12px] font-semibold text-[var(--text-neutral-strong)]">{initials}</span>
    </div>
  );
}

function DeptBadge({ dept }: { dept: string }) {
  return (
    <span className="text-[12px] px-2 py-0.5 rounded-full bg-[var(--surface-neutral-xx-weak)] text-[var(--text-neutral-medium)] whitespace-nowrap">
      {dept}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Low: 'text-amber-700 bg-amber-50 border-amber-200',
    'Near Cap': 'text-red-700 bg-red-50 border-red-200',
    Maxed: 'text-red-700 bg-red-50 border-red-200',
    Normal: 'text-[var(--text-neutral-medium)] bg-[var(--surface-neutral-xx-weak)] border-[var(--border-neutral-weak)]',
  };
  return (
    <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${styles[status] || styles.Normal}`}>
      {status}
    </span>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="self-start mt-4 px-4 py-2 text-[14px] font-medium text-[var(--text-neutral-strong)] bg-transparent border border-[var(--border-neutral-medium)] rounded-[var(--radius-full)] hover:bg-[var(--surface-neutral-xx-weak)] transition-colors cursor-pointer"
    >
      {label}
    </button>
  );
}

function ProgressBar({ used, total, color }: { used: number; total: number; color: 'amber' | 'red' | 'green' }) {
  const pct = Math.min((used / total) * 100, 100);
  const colorMap = {
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    green: 'bg-emerald-500',
  };
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 rounded-full bg-[var(--surface-neutral-xx-weak)] overflow-hidden">
        <div
          className={`h-full rounded-full ${colorMap[color]} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[13px] text-[var(--text-neutral-medium)] tabular-nums whitespace-nowrap">
        {used}/{total} days
      </span>
    </div>
  );
}

// ============================================================
// 1. PTO Cap Risk Response
// ============================================================

function PTOCapRiskResponse({ onAction }: ResponseProps) {
  const employees = [
    { name: 'Cdam Ahristensen', initials: 'CA', dept: 'Engineering', used: 12, total: 15, status: 'Low' as const, color: 'amber' as const },
    { name: 'Mara Tartell', initials: 'MT', dept: 'Customer Success', used: 14, total: 15, status: 'Near Cap' as const, color: 'red' as const },
    { name: 'Pyan Racker', initials: 'PR', dept: 'Engineering', used: 13, total: 15, status: 'Near Cap' as const, color: 'red' as const },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[14px] font-semibold text-[var(--text-neutral-x-strong)]">
        Employees Approaching PTO Cap
      </p>

      <div className="flex flex-col gap-2">
        {employees.map((emp) => (
          <div
            key={emp.name}
            className="flex flex-col gap-2 p-3 rounded-[var(--radius-small)] bg-[var(--surface-neutral-xx-weak)]"
          >
            <div className="flex items-center gap-2">
              <Avatar initials={emp.initials} />
              <span className="text-[14px] font-medium text-[var(--text-neutral-xx-strong)]">
                {emp.name}
              </span>
              <DeptBadge dept={emp.dept} />
              <div className="ml-auto">
                <StatusBadge status={emp.status} />
              </div>
            </div>
            <div className="pl-10">
              <ProgressBar used={emp.used} total={emp.total} color={emp.color} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[13px] text-[var(--text-neutral-medium)] mt-1">
        These employees will hit their PTO cap before Q2 if they don't take time off soon.
      </p>

      <ActionButton
        label="Draft reminder to managers"
        onClick={() => onAction('Draft a reminder to their managers about PTO')}
      />
    </div>
  );
}

// ============================================================
// 2. Low Usage Response
// ============================================================

function LowUsageResponse({ onAction }: ResponseProps) {
  const bars = [
    { label: 'Marketing', value: 4.8, max: 15, color: 'bg-[var(--surface-neutral-x-weak)]' },
    { label: 'Company Avg', value: 8.2, max: 15, color: 'bg-emerald-500' },
  ];

  const employees = [
    { name: 'Lave Desue', initials: 'LD', used: 2, total: 15, status: 'Normal' },
    { name: 'Randy Mounkles', initials: 'RM', used: 15, total: 15, status: 'Maxed' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[14px] font-semibold text-[var(--text-neutral-x-strong)]">
        Marketing PTO Usage vs Company Average
      </p>

      {/* Comparison bars */}
      <div className="flex flex-col gap-3 p-3 rounded-[var(--radius-small)] bg-[var(--surface-neutral-xx-weak)]">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="text-[13px] text-[var(--text-neutral-strong)] w-[90px] shrink-0">
              {bar.label}
            </span>
            <div className="flex-1 h-5 rounded-full bg-[var(--surface-neutral-white)] overflow-hidden">
              <div
                className={`h-full rounded-full ${bar.color} transition-all`}
                style={{ width: `${(bar.value / bar.max) * 100}%` }}
              />
            </div>
            <span className="text-[13px] font-medium text-[var(--text-neutral-strong)] tabular-nums w-[60px] text-right">
              {bar.value} days
            </span>
          </div>
        ))}
      </div>

      {/* Marketing team breakdown */}
      <p className="text-[13px] font-semibold text-[var(--text-neutral-strong)] mt-1">
        Marketing Team Breakdown
      </p>

      <div className="flex flex-col gap-2">
        {employees.map((emp) => (
          <div
            key={emp.name}
            className="flex items-center gap-2 p-3 rounded-[var(--radius-small)] bg-[var(--surface-neutral-xx-weak)]"
          >
            <Avatar initials={emp.initials} />
            <span className="text-[14px] font-medium text-[var(--text-neutral-xx-strong)]">
              {emp.name}
            </span>
            <span className="text-[13px] text-[var(--text-neutral-medium)] tabular-nums">
              {emp.used}/{emp.total} days used
            </span>
            <div className="ml-auto">
              <StatusBadge status={emp.status} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[13px] text-[var(--text-neutral-medium)] mt-1">
        Marketing's low usage is common in high-growth teams where people feel they can't step away.
      </p>

      <ActionButton
        label="Show full usage breakdown"
        onClick={() => onAction('Show me the full PTO usage breakdown')}
      />
    </div>
  );
}

// ============================================================
// 3. Coverage Gap Response
// ============================================================

function CoverageGapResponse({ onAction }: ResponseProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const ptoRequests = [
    { name: 'Bark Mallard', initials: 'BM', days: [true, true, true, false, false] },
    { name: 'Crian Brofts', initials: 'CB', days: [true, true, true, true, true] },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[14px] font-semibold text-[var(--text-neutral-x-strong)]">
        Spring Break Coverage Risk — Week of March 24
      </p>

      {/* Timeline grid */}
      <div className="rounded-[var(--radius-small)] bg-[var(--surface-neutral-xx-weak)] p-3 overflow-hidden">
        {/* Day headers */}
        <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
          <div /> {/* spacer */}
          {days.map((day) => (
            <div key={day} className="text-center text-[12px] font-medium text-[var(--text-neutral-medium)]">
              {day}
            </div>
          ))}
        </div>

        {/* Employee rows */}
        {ptoRequests.map((req) => (
          <div key={req.name} className="grid gap-1 mb-1.5" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
            <div className="flex items-center gap-1.5">
              <Avatar initials={req.initials} className="w-5 h-5 text-[10px]" />
              <span className="text-[12px] text-[var(--text-neutral-strong)] truncate">
                {req.name.split(' ')[0]}
              </span>
            </div>
            {req.days.map((isOut, i) => (
              <div
                key={i}
                className={`h-6 rounded-[3px] ${
                  isOut
                    ? 'bg-amber-300'
                    : 'bg-[var(--surface-neutral-white)]'
                }`}
              />
            ))}
          </div>
        ))}

        {/* Team capacity row */}
        <div className="grid gap-1 mt-2 pt-2 border-t border-[var(--border-neutral-x-weak)]" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
          <span className="text-[11px] text-[var(--text-neutral-medium)]">Capacity</span>
          {[60, 60, 60, 80, 80].map((pct, i) => (
            <div key={i} className="flex items-center justify-center">
              <span className={`text-[11px] font-medium ${pct < 70 ? 'text-amber-600' : 'text-[var(--text-neutral-medium)]'}`}>
                {pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat callout */}
      <div className="flex items-center gap-2 p-3 rounded-[var(--radius-small)] bg-amber-50 border border-amber-200">
        <span className="text-[13px] text-amber-800">
          Last year, <span className="font-semibold">40% of Engineering</span> was out the week of March 24. 2 requests are already in for this year.
        </span>
      </div>

      <ActionButton
        label="Show coverage forecast"
        onClick={() => onAction('Show me the full coverage forecast for late March')}
      />
    </div>
  );
}

// ============================================================
// Dispatcher Component
// ============================================================

export function Scene2ResponseCard({ cardId, onAction }: { cardId: string; onAction: (text: string) => void }) {
  switch (cardId) {
    case 'pto-cap-risk':
      return <PTOCapRiskResponse onAction={onAction} />;
    case 'low-usage':
      return <LowUsageResponse onAction={onAction} />;
    case 'coverage-gap':
      return <CoverageGapResponse onAction={onAction} />;
    default:
      return null;
  }
}
