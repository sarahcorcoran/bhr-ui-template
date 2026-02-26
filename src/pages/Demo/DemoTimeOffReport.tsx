import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingDown, CalendarX2, ChevronRight } from 'lucide-react';
import { Icon } from '../../components/Icon';
import { scene2TableData, scene2InsightCards } from '../../data/demoScriptData';
import type { InsightCard } from '../../data/demoScriptData';

function getStatusStyle(status: string): string {
  switch (status) {
    case 'Low':
    case 'Near Cap':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'Maxed':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-[var(--text-neutral-medium)]';
  }
}

const insightIconMap: Record<InsightCard['icon'], React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  'warning': AlertTriangle,
  'trend-down': TrendingDown,
  'calendar': CalendarX2,
};

export function DemoTimeOffReport() {
  const navigate = useNavigate();

  const thinkingTextMap: Record<string, string> = {
    'pto-cap-risk': 'Analyzing PTO balances...',
    'low-usage': 'Comparing department usage...',
    'coverage-gap': 'Reviewing coverage patterns...',
  };

  const handleInsightCardClick = (card: InsightCard) => {
    localStorage.setItem('bhr-demo-preseed-message', JSON.stringify({
      userMessage: card.userMessage,
      aiResponse: card.askPreSeededMessage,
      cardId: card.id,
      thinkingText: thinkingTextMap[card.id] || 'Analyzing time off data...',
    }));
    localStorage.setItem('bhr-chat-panel-open', 'true');
  };

  return (
    <div className="flex flex-col h-full bg-[var(--surface-neutral-xx-weak)]">
      {/* Header area */}
      <div className="px-10 pt-8 pb-6">
        {/* Back link */}
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--text-neutral-medium)] hover:text-[var(--text-neutral-strong)] transition-colors mb-3"
        >
          <Icon name="chevron-left" size={12} />
          Back
        </button>

        {/* Title row */}
        <div className="flex items-center justify-between">
          <h2
            className="text-[26px] font-semibold text-[var(--color-primary-strong)]"
            style={{ fontFamily: 'Fields, system-ui, sans-serif', lineHeight: '34px' }}
          >
            Time Off
          </h2>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-medium)] rounded-[var(--radius-full)] text-[var(--text-neutral-strong)] hover:bg-[var(--surface-neutral-xx-weak)] transition-colors">
              <Icon name="user-group" size={16} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-medium)] rounded-[var(--radius-full)] text-[var(--text-neutral-strong)] hover:bg-[var(--surface-neutral-xx-weak)] transition-colors">
              <Icon name="ellipsis" size={16} />
            </button>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-[14px] text-[var(--text-neutral-medium)] mt-1">
          PTO balances and usage for all employees
        </p>
      </div>

      {/* Full-width content area */}
      <div className="flex-1 px-10 pb-10 overflow-y-auto">
        {/* Insights section */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-3">
            {scene2InsightCards.map((card) => {
              const IconComponent = insightIconMap[card.icon];
              return (
                <div
                  key={card.id}
                  className="rounded-[var(--radius-small)] border border-[var(--border-neutral-medium)] transition-all hover:shadow-md cursor-pointer"
                  onClick={() => handleInsightCardClick(card)}
                >
                  <div className="flex items-center gap-3 p-4 bg-[var(--surface-neutral-white)] rounded-[calc(var(--radius-small)-1px)]">
                    {/* Icon */}
                    <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--surface-neutral-xx-weak)]">
                      <IconComponent size={18} className="text-[var(--text-neutral-strong)]" strokeWidth={1.75} />
                    </div>
                    {/* Title + Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--text-neutral-xx-strong)] leading-[20px]">
                        {card.cardTitle}
                      </p>
                      <p className="text-[13px] text-[var(--text-neutral-medium)] leading-[18px] mt-0.5">
                        {card.cardDescription}
                      </p>
                    </div>
                    {/* Chevron */}
                    <ChevronRight size={16} className="shrink-0 text-[var(--icon-neutral-medium)]" strokeWidth={2} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter bar (visual only) */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 h-10 px-4 bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-medium)] rounded-[var(--radius-small)]">
              <span className="text-[14px] text-[var(--text-neutral-strong)]">01/27/2026</span>
              <Icon name="calendar" size={14} className="text-[var(--icon-neutral-strong)]" />
            </div>
            <span className="text-[14px] text-[var(--text-neutral-medium)]">–</span>
            <div className="flex items-center gap-2 h-10 px-4 bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-medium)] rounded-[var(--radius-small)]">
              <span className="text-[14px] text-[var(--text-neutral-strong)]">02/10/2026</span>
              <Icon name="calendar" size={14} className="text-[var(--icon-neutral-strong)]" />
            </div>
          </div>
          <div className="flex items-center gap-2 h-10 px-4 bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-medium)] rounded-[var(--radius-small)]">
            <span className="text-[14px] text-[var(--text-neutral-strong)]">All Employees</span>
            <Icon name="caret-down" size={12} className="text-[var(--icon-neutral-strong)]" />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-4 h-4 rounded-[3px] border border-[var(--border-neutral-medium)] bg-[var(--surface-neutral-white)]" />
          <span className="text-[14px] text-[var(--text-neutral-strong)]">Show only paid time off categories</span>
        </div>

        {/* Data Table */}
        <div className="bg-[var(--surface-neutral-white)] rounded-[var(--radius-small)] border border-[var(--border-neutral-x-weak)] overflow-hidden">
          <div className="px-6 py-6">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--surface-neutral-xx-weak)]">
                  <th className="px-6 py-4 text-left text-[15px] font-semibold text-[var(--text-neutral-x-strong)] rounded-tl-[8px] rounded-bl-[8px]">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-[15px] font-semibold text-[var(--text-neutral-x-strong)]">
                    Department
                  </th>
                  <th className="px-6 py-4 text-right text-[15px] font-semibold text-[var(--text-neutral-x-strong)]">
                    PTO Used
                  </th>
                  <th className="px-6 py-4 text-right text-[15px] font-semibold text-[var(--text-neutral-x-strong)]">
                    PTO Remaining
                  </th>
                  <th className="px-6 py-4 text-right text-[15px] font-semibold text-[var(--text-neutral-x-strong)]">
                    Accrual Rate
                  </th>
                  <th className="px-6 py-4 text-left text-[15px] font-semibold text-[var(--text-neutral-x-strong)] rounded-tr-[8px] rounded-br-[8px]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-neutral-x-weak)]">
                {scene2TableData.map((row) => (
                  <tr key={row.employee} className="hover:bg-[var(--surface-neutral-xx-weak)] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[15px] font-medium text-[var(--text-neutral-xx-strong)]">
                        {row.employee}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[15px] text-[var(--text-neutral-strong)]">
                        {row.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[15px] text-[var(--text-neutral-strong)]">
                        {row.ptoUsed}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[15px] text-[var(--text-neutral-strong)]">
                        {row.ptoRemaining}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[15px] text-[var(--text-neutral-medium)]">
                        {row.accrualRate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {row.status === 'Normal' ? (
                        <span className="text-[15px] text-[var(--text-neutral-medium)]">
                          {row.status}
                        </span>
                      ) : (
                        <span className={`inline-flex px-2.5 py-0.5 text-[13px] font-medium rounded-full border ${getStatusStyle(row.status)}`}>
                          {row.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoTimeOffReport;
