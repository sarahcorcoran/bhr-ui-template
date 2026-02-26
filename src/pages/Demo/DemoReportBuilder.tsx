import { Fragment, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { useDemo } from '../../contexts/DemoContext';
import { useStreamingText } from '../../hooks/useStreamingText';
import {
  scene3AgentPlan,
  scene3GenerationSteps,
  scene3HeadcountData,
  scene3InactiveHeadcountData,
  scene3SummaryMessage,
  scene3EditIntents,
  scene3EditFallback,
  scene3FilterAcknowledgments,
} from '../../data/demoScriptData';
import type { EditIntent, HeadcountRow } from '../../data/demoScriptData';

// --- Types ---

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'thinking' | 'checklist';
  text: string;
}

interface FilterPill {
  id: string;
  label: string;
  options: string[];
  selectedIndex: number;
}

type GenerationPhase = 'idle' | 'planning' | 'generating' | 'complete';

// --- Constants ---

const REPORT_BUILDER_PROMPT_KEY = 'bhr-report-builder-prompt';

const INITIAL_FILTERS: FilterPill[] = [
  { id: 'status', label: 'Active Employees', options: ['Active Employees', 'All Employees', 'Inactive Employees'], selectedIndex: 0 },
  { id: 'group1', label: 'Department', options: ['Department', 'Location', 'Job Title', 'None'], selectedIndex: 0 },
  { id: 'group2', label: 'Location', options: ['Location', 'Department', 'Start Date', 'None'], selectedIndex: 0 },
];

// Scripted tenure data per department
const TENURE_DATA: Record<string, string> = {
  Engineering: '1.8 yrs',
  Product: '2.4 yrs',
  Marketing: '3.1 yrs',
  Sales: '2.9 yrs',
  'Customer Success': '2.2 yrs',
  Finance: '4.5 yrs',
  HR: '3.8 yrs',
  IT: '2.6 yrs',
  Executive: '5.2 yrs',
};

// Dataset counts by status filter
const DATASET_COUNTS: Record<number, number> = { 0: 187, 1: 203, 2: 16 };
const DATASET_LABELS: Record<number, string> = { 0: 'Active Employees', 1: 'All Employees', 2: 'Inactive Employees' };

// --- Helper: group headcount data by department ---

function groupByDepartment(data: HeadcountRow[]) {
  const groups: { groupLabel: string; rows: HeadcountRow[]; total: number }[] = [];
  const deptOrder: string[] = [];
  const deptMap = new Map<string, HeadcountRow[]>();

  for (const row of data) {
    if (!deptMap.has(row.department)) {
      deptOrder.push(row.department);
      deptMap.set(row.department, []);
    }
    deptMap.get(row.department)!.push(row);
  }

  for (const dept of deptOrder) {
    const rows = deptMap.get(dept)!;
    groups.push({ groupLabel: dept, rows, total: rows.reduce((s, r) => s + r.headcount, 0) });
  }

  return groups;
}

// --- Helper: group headcount data by location ---

function groupByLocation(data: HeadcountRow[]) {
  const groups: { groupLabel: string; rows: HeadcountRow[]; total: number }[] = [];
  const locOrder: string[] = [];
  const locMap = new Map<string, HeadcountRow[]>();

  for (const row of data) {
    if (!locMap.has(row.location)) {
      locOrder.push(row.location);
      locMap.set(row.location, []);
    }
    locMap.get(row.location)!.push(row);
  }

  for (const loc of locOrder) {
    const rows = locMap.get(loc)!;
    groups.push({ groupLabel: loc, rows, total: rows.reduce((s, r) => s + r.headcount, 0) });
  }

  return groups;
}

// --- Helper: merge active + inactive headcount data ---

function mergeHeadcountData(active: HeadcountRow[], inactive: HeadcountRow[]): HeadcountRow[] {
  const merged = new Map<string, HeadcountRow>();
  for (const row of active) {
    const key = `${row.department}-${row.location}`;
    merged.set(key, { ...row });
  }
  for (const row of inactive) {
    const key = `${row.department}-${row.location}`;
    const existing = merged.get(key);
    if (existing) {
      existing.headcount += row.headcount;
    } else {
      merged.set(key, { ...row });
    }
  }
  return Array.from(merged.values());
}

// --- Helper: match edit intents (same algorithm as DemoContext) ---

function matchEditIntent(input: string, intents: EditIntent[]): EditIntent | null {
  const lowerInput = input.toLowerCase();
  let bestIntent: EditIntent | null = null;
  let bestScore = 0;

  for (const intent of intents) {
    let score = 0;
    for (const keyword of intent.keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    if (score >= 2 && score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return bestIntent;
}

// ============================================================
// COMPONENT
// ============================================================

export function DemoReportBuilder() {
  const navigate = useNavigate();
  const { demoResetCounter } = useDemo();

  // --- Chat state ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [chatInputValue, setChatInputValue] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // --- Canvas state ---
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showDataset, setShowDataset] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showSummaryRow, setShowSummaryRow] = useState(false);
  const [reportTitle, setReportTitle] = useState('New Report');
  const [contextPillLabel, setContextPillLabel] = useState('New Report');

  // --- Filter pills ---
  const [filterPills, setFilterPills] = useState<FilterPill[]>(INITIAL_FILTERS);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // --- Extra columns (edit intents) ---
  const [extraColumns, setExtraColumns] = useState<string[]>([]);

  // --- Dataset badge ---
  const [datasetCount, setDatasetCount] = useState(187);
  const [datasetLabel, setDatasetLabel] = useState('Active Employees');

  // --- Table loading shimmer ---
  const [tableLoading, setTableLoading] = useState(false);
  const shimmerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Input multiline detection ---
  const [isMultiline, setIsMultiline] = useState(false);

  // --- Streaming state ---
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingFullText, setStreamingFullText] = useState('');
  const { displayText: streamedText, isStreaming } = useStreamingText(
    streamingFullText,
    streamingMessageId !== null,
  );

  // Auto-clear streaming when done
  useEffect(() => {
    if (streamingMessageId && !isStreaming && streamingFullText) {
      setStreamingMessageId(null);
      setStreamingFullText('');
    }
  }, [streamingMessageId, isStreaming, streamingFullText]);

  // --- Refs ---
  const generationStarted = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const canvasScrollRef = useRef<HTMLDivElement>(null);

  // --- Computed: input border radius ---
  const hasPill = generationPhase !== 'idle';
  const inputBorderRadius = (isMultiline || hasPill) ? 'rounded-xl' : 'rounded-[var(--radius-full)]';

  // --- Computed: active data based on filter selection ---
  const statusFilter = filterPills.find(p => p.id === 'status');
  const statusIndex = statusFilter?.selectedIndex ?? 0;

  const activeData = useMemo(() => {
    switch (statusIndex) {
      case 1: return mergeHeadcountData(scene3HeadcountData, scene3InactiveHeadcountData);
      case 2: return scene3InactiveHeadcountData;
      default: return scene3HeadcountData;
    }
  }, [statusIndex]);

  // --- Computed: grouping ---
  const group1Filter = filterPills.find(p => p.id === 'group1');
  const primaryGrouping = group1Filter?.options[group1Filter.selectedIndex] ?? 'Department';

  const groupedData = useMemo(() => {
    if (primaryGrouping === 'Location') return groupByLocation(activeData);
    return groupByDepartment(activeData);
  }, [activeData, primaryGrouping]);

  const grandTotal = useMemo(() => activeData.reduce((s, r) => s + r.headcount, 0), [activeData]);

  // --- Helpers ---

  const scrollCanvasToTop = useCallback(() => {
    if (canvasScrollRef.current) {
      canvasScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const showShimmer = useCallback((duration = 600) => {
    if (shimmerTimeoutRef.current) clearTimeout(shimmerTimeoutRef.current);
    setTableLoading(true);
    const t = setTimeout(() => {
      setTableLoading(false);
      scrollCanvasToTop();
    }, duration);
    shimmerTimeoutRef.current = t;
    timeoutsRef.current.push(t);
  }, [scrollCanvasToTop]);

  // Hide global Ask button
  useEffect(() => {
    document.body.setAttribute('data-hide-ask-button', 'true');
    return () => {
      document.body.removeAttribute('data-hide-ask-button');
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isThinking, currentStepIndex, completedSteps, streamedText]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdownId) return;
    const handleClick = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openDropdownId]);

  // Reset on demo reset
  useEffect(() => {
    setChatMessages([]);
    setIsThinking(false);
    setGenerationPhase('idle');
    setCurrentStepIndex(-1);
    setCompletedSteps(new Set());
    setShowDataset(false);
    setShowColumns(false);
    setShowFilters(false);
    setShowTable(false);
    setShowSummaryRow(false);
    setReportTitle('New Report');
    setContextPillLabel('New Report');
    setFilterPills(INITIAL_FILTERS);
    setExtraColumns([]);
    setDatasetCount(187);
    setDatasetLabel('Active Employees');
    setTableLoading(false);
    setIsMultiline(false);
    setStreamingMessageId(null);
    setStreamingFullText('');
    generationStarted.current = false;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, [demoResetCounter]);

  // --- Post a chat message helper (returns generated ID) ---
  const postAiMessage = useCallback((text: string): string => {
    const id = `ai-${Date.now()}-${Math.random()}`;
    setChatMessages(prev => [...prev, { id, type: 'ai', text }]);
    return id;
  }, []);

  // --- Generation flow ---
  const startGeneration = useCallback((prompt: string) => {
    if (generationStarted.current) return;
    generationStarted.current = true;

    // 1. User message
    setChatMessages([{ id: `user-${Date.now()}`, type: 'user', text: prompt }]);

    // 2. Thinking (planning)
    setIsThinking(true);
    setGenerationPhase('planning');

    const t1 = setTimeout(() => {
      setIsThinking(false);
      // 3. Agent plan message (streamed)
      const planId = postAiMessage(scene3AgentPlan);
      setStreamingMessageId(planId);
      setStreamingFullText(scene3AgentPlan);

      // 4. Insert checklist message (Fix 3)
      setChatMessages(prev => [...prev, { id: `checklist-${Date.now()}`, type: 'checklist', text: '' }]);

      // 5. Begin step-by-step generation
      setGenerationPhase('generating');
      setReportTitle('Headcount by Department and Location');
      setContextPillLabel('Headcount Report');

      let cumulativeDelay = 500; // brief pause after plan
      scene3GenerationSteps.forEach((step, idx) => {
        // Activate step
        const activateTimeout = setTimeout(() => {
          setCurrentStepIndex(idx);

          // Apply canvas update for this step
          switch (step.id) {
            case 'dataset':
              setShowDataset(true);
              break;
            case 'columns':
              setShowColumns(true);
              break;
            case 'filter':
              setShowFilters(true);
              break;
            case 'data':
              setShowTable(true);
              break;
            case 'summary':
              setShowSummaryRow(true);
              break;
          }
        }, cumulativeDelay);
        timeoutsRef.current.push(activateTimeout);

        // Complete step
        const completeTimeout = setTimeout(() => {
          setCompletedSteps(prev => new Set(prev).add(step.id));
        }, cumulativeDelay + step.duration);
        timeoutsRef.current.push(completeTimeout);

        cumulativeDelay += step.duration + 200; // 200ms gap between steps
      });

      // 6. Post-generation: summary message (streamed) + scroll to top
      const summaryTimeout = setTimeout(() => {
        setGenerationPhase('complete');
        const summaryId = postAiMessage(scene3SummaryMessage);
        setStreamingMessageId(summaryId);
        setStreamingFullText(scene3SummaryMessage);
        scrollCanvasToTop();
      }, cumulativeDelay + 300);
      timeoutsRef.current.push(summaryTimeout);
    }, 1500);
    timeoutsRef.current.push(t1);
  }, [postAiMessage, scrollCanvasToTop]);

  // --- Poll for prompt in localStorage (StrictMode-safe) ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (generationStarted.current) return;
      const prompt = localStorage.getItem(REPORT_BUILDER_PROMPT_KEY);
      if (!prompt) return;
      localStorage.removeItem(REPORT_BUILDER_PROMPT_KEY);
      startGeneration(prompt);
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Send chat message (edits) ---
  const handleSend = useCallback(() => {
    const text = chatInputValue.trim();
    if (!text || generationPhase !== 'complete') return;

    setChatInputValue('');
    setIsMultiline(false);

    // Add user message
    setChatMessages(prev => [...prev, { id: `user-${Date.now()}`, type: 'user', text }]);

    // Match edit intent
    const matched = matchEditIntent(text, scene3EditIntents);

    if (matched) {
      // Show thinking
      setIsThinking(true);
      const thinkingTimeout = setTimeout(() => {
        setIsThinking(false);
        const editId = postAiMessage(matched.response);
        setStreamingMessageId(editId);
        setStreamingFullText(matched.response);

        // Show shimmer for canvas update
        showShimmer(500);

        // Apply canvas update
        switch (matched.canvasUpdate) {
          case 'add-tenure-column':
            setExtraColumns(prev => prev.includes('Avg Tenure') ? prev : [...prev, 'Avg Tenure']);
            break;
          case 'add-start-date-column':
            setExtraColumns(prev => prev.includes('Start Date') ? prev : [...prev, 'Start Date']);
            break;
          case 'show-inactive':
            setFilterPills(prev => prev.map(p =>
              p.id === 'status' ? { ...p, label: 'All Employees', selectedIndex: 1 } : p
            ));
            setDatasetCount(203);
            setDatasetLabel('All Employees');
            break;
          case 'regroup-by-location':
            setFilterPills(prev => prev.map(p => {
              if (p.id === 'group1') return { ...p, label: 'Location', selectedIndex: 1 };
              if (p.id === 'group2') return { ...p, label: 'Department', selectedIndex: 1 };
              return p;
            }));
            break;
        }
      }, matched.thinkingDuration);
      timeoutsRef.current.push(thinkingTimeout);
    } else {
      // Fallback
      setIsThinking(true);
      const fallbackTimeout = setTimeout(() => {
        setIsThinking(false);
        const fbId = postAiMessage(scene3EditFallback.response);
        setStreamingMessageId(fbId);
        setStreamingFullText(scene3EditFallback.response);
      }, 800);
      timeoutsRef.current.push(fallbackTimeout);
    }
  }, [chatInputValue, generationPhase, postAiMessage, showShimmer]);

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChatInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInputValue(e.target.value);
    e.target.style.height = 'auto';
    const newHeight = Math.min(e.target.scrollHeight, 150);
    e.target.style.height = newHeight + 'px';
    setIsMultiline(newHeight > 44);
  };

  // --- Filter pill dropdown handler ---
  const handleFilterSelect = (pillId: string, optionIndex: number) => {
    const pill = filterPills.find(p => p.id === pillId);
    if (!pill || pill.selectedIndex === optionIndex) {
      setOpenDropdownId(null);
      return;
    }

    const selectedOption = pill.options[optionIndex];

    // Update pill — simplified labels (Fix 6)
    setFilterPills(prev => prev.map(p => {
      if (p.id !== pillId) return p;
      return { ...p, label: selectedOption, selectedIndex: optionIndex };
    }));

    setOpenDropdownId(null);

    // Update dataset count if status changed
    if (pillId === 'status') {
      setDatasetCount(DATASET_COUNTS[optionIndex] ?? 187);
      setDatasetLabel(DATASET_LABELS[optionIndex] ?? 'Active Employees');
    }

    // Show shimmer loading (Fix 5)
    showShimmer(600);

    // Post acknowledgment (streamed)
    const ack = scene3FilterAcknowledgments[pillId]?.[selectedOption];
    if (ack) {
      setIsThinking(true);
      const ackTimeout = setTimeout(() => {
        setIsThinking(false);
        const ackId = postAiMessage(ack);
        setStreamingMessageId(ackId);
        setStreamingFullText(ack);
      }, 600);
      timeoutsRef.current.push(ackTimeout);
    }
  };

  // --- Dynamic column headers based on primary grouping ---
  const primaryColHeader = primaryGrouping === 'Location' ? 'Location' : 'Department';
  const secondaryColHeader = primaryGrouping === 'Location' ? 'Department' : 'Location';

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex flex-col h-full bg-[var(--surface-neutral-xx-weak)]">
      {/* Shimmer animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer { animation: shimmer 1.2s infinite; }
      `}</style>

      {/* Back link (above both panels) */}
      <div className="px-8 pt-8">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--text-neutral-medium)] hover:text-[var(--text-neutral-strong)] transition-colors mb-3"
        >
          <Icon name="chevron-left" size={12} />
          Back to Reports
        </button>
      </div>

      {/* Two-Panel Layout */}
      <div className="flex flex-1 min-h-0">
        {/* ===== LEFT: Report Canvas ===== */}
        <div ref={canvasScrollRef} className="flex-1 flex flex-col overflow-y-auto px-8 pb-8">
          {/* White report card */}
          <div className="bg-[var(--surface-neutral-white)] rounded-[var(--radius-small)] border border-[var(--border-neutral-x-weak)] p-6 min-h-[200px] flex-1">

          {/* Report Title */}
          {generationPhase !== 'idle' && (
            <h2
              className="text-[22px] font-semibold text-[var(--text-neutral-xx-strong)] mb-8"
              style={{ fontFamily: 'Fields, system-ui, sans-serif' }}
            >
              {reportTitle}
            </h2>
          )}

          {/* Filter pills row + Dataset badge (Fix 4 + Fix 6) */}
          {showFilters && (
            <div className="flex items-center gap-2 mb-6">
              {filterPills.map((pill) => (
                <div key={pill.id} className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === pill.id ? null : pill.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-medium)] rounded-full text-[13px] font-medium text-[var(--text-neutral-strong)] hover:border-[var(--border-neutral-strong)] transition-colors cursor-pointer"
                  >
                    <span>{pill.label}</span>
                    <Icon name="caret-down" size={10} className="text-[var(--icon-neutral-medium)]" />
                  </button>

                  {/* Dropdown */}
                  {openDropdownId === pill.id && (
                    <div
                      className="absolute top-full left-0 mt-1 bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-medium)] rounded-lg shadow-lg z-50 min-w-[180px] py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {pill.options.map((option, optIdx) => (
                        <button
                          key={option}
                          onClick={() => handleFilterSelect(pill.id, optIdx)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left hover:bg-[var(--surface-neutral-xx-weak)] transition-colors ${
                            optIdx === pill.selectedIndex ? 'font-semibold text-[var(--color-primary-strong)]' : 'text-[var(--text-neutral-strong)]'
                          }`}
                        >
                          {optIdx === pill.selectedIndex && (
                            <Icon name="check" size={12} className="text-[var(--color-primary-strong)]" />
                          )}
                          {optIdx !== pill.selectedIndex && <span className="w-3" />}
                          <span>{option}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Dataset badge — pinned right (Fix 4) */}
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[var(--text-neutral-medium)]">
                <Icon name="spa" size={14} className="text-[var(--color-primary-strong)]" />
                <span>{datasetCount} {datasetLabel}</span>
              </div>
            </div>
          )}

          {/* Data Table */}
          {showColumns && (
            <div className="relative bg-[var(--surface-neutral-white)] rounded-[var(--radius-small)] border border-[var(--border-neutral-x-weak)] overflow-hidden">
              {/* Shimmer overlay (Fix 5) */}
              {tableLoading && (
                <div className="absolute inset-0 bg-[var(--surface-neutral-white)]/80 z-10 overflow-hidden">
                  <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-[var(--surface-neutral-x-weak)] to-transparent" />
                </div>
              )}

              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--surface-neutral-xx-weak)]">
                    <th className="px-6 py-3 text-left text-[13px] font-semibold text-[var(--text-neutral-x-strong)]">{primaryColHeader}</th>
                    <th className="px-6 py-3 text-left text-[13px] font-semibold text-[var(--text-neutral-x-strong)]">{secondaryColHeader}</th>
                    <th className="px-6 py-3 text-right text-[13px] font-semibold text-[var(--text-neutral-x-strong)]">Headcount</th>
                    {extraColumns.includes('Avg Tenure') && (
                      <th className="px-6 py-3 text-right text-[13px] font-semibold text-[var(--text-neutral-x-strong)]">Avg Tenure</th>
                    )}
                    {extraColumns.includes('Start Date') && (
                      <th className="px-6 py-3 text-right text-[13px] font-semibold text-[var(--text-neutral-x-strong)]">Start Date</th>
                    )}
                  </tr>
                </thead>
                {showTable && (
                  <tbody>
                    {groupedData.map((group) => (
                      <Fragment key={group.groupLabel}>
                        {/* Group header row */}
                        <tr className="bg-[var(--surface-neutral-xx-weak)] border-t border-[var(--border-neutral-x-weak)]">
                          <td
                            colSpan={3 + extraColumns.length}
                            className="px-6 py-2.5 text-[13px] font-semibold text-[var(--text-neutral-xx-strong)]"
                          >
                            {group.groupLabel}
                          </td>
                        </tr>
                        {/* Detail rows */}
                        {group.rows.map((row) => (
                          <tr
                            key={`${row.department}-${row.location}`}
                            className="border-t border-[var(--border-neutral-x-weak)] hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
                          >
                            <td className="px-6 py-2.5 text-[13px] text-[var(--text-neutral-medium)]" />
                            <td className="px-6 py-2.5 text-[13px] text-[var(--text-neutral-strong)]">
                              {primaryGrouping === 'Location' ? row.department : row.location}
                            </td>
                            <td className="px-6 py-2.5 text-[13px] text-right text-[var(--text-neutral-strong)]">{row.headcount}</td>
                            {extraColumns.includes('Avg Tenure') && (
                              <td className="px-6 py-2.5 text-[13px] text-right text-[var(--text-neutral-medium)]">
                                {TENURE_DATA[row.department] || '—'}
                              </td>
                            )}
                            {extraColumns.includes('Start Date') && (
                              <td className="px-6 py-2.5 text-[13px] text-right text-[var(--text-neutral-medium)]">—</td>
                            )}
                          </tr>
                        ))}
                        {/* Subtotal row */}
                        <tr className="border-t border-[var(--border-neutral-x-weak)]">
                          <td className="px-6 py-2 text-[13px] font-medium text-[var(--text-neutral-strong)]" />
                          <td className="px-6 py-2 text-[13px] font-medium text-[var(--text-neutral-medium)] italic">Subtotal</td>
                          <td className="px-6 py-2 text-[13px] font-semibold text-right text-[var(--text-neutral-strong)]">{group.total}</td>
                          {extraColumns.includes('Avg Tenure') && (
                            <td className="px-6 py-2 text-[13px] text-right text-[var(--text-neutral-medium)]" />
                          )}
                          {extraColumns.includes('Start Date') && (
                            <td className="px-6 py-2 text-[13px] text-right text-[var(--text-neutral-medium)]" />
                          )}
                        </tr>
                      </Fragment>
                    ))}
                    {/* Grand total */}
                    {showSummaryRow && (
                      <tr className="border-t-2 border-[var(--border-neutral-medium)] bg-[var(--surface-neutral-xx-weak)]">
                        <td className="px-6 py-3 text-[14px] font-bold text-[var(--text-neutral-xx-strong)]">Total</td>
                        <td className="px-6 py-3" />
                        <td className="px-6 py-3 text-[14px] font-bold text-right text-[var(--text-neutral-xx-strong)]">{grandTotal}</td>
                        {extraColumns.includes('Avg Tenure') && <td className="px-6 py-3" />}
                        {extraColumns.includes('Start Date') && <td className="px-6 py-3" />}
                      </tr>
                    )}
                  </tbody>
                )}
              </table>
            </div>
          )}

          {/* Empty state when idle */}
          {generationPhase === 'idle' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--surface-neutral-x-weak)] flex items-center justify-center mx-auto mb-4">
                  <Icon name="chart-pie-simple" size={28} className="text-[var(--icon-neutral-strong)]" />
                </div>
                <p className="text-[16px] font-medium text-[var(--text-neutral-medium)]">
                  Report canvas
                </p>
                <p className="text-[14px] text-[var(--text-neutral-weak)] mt-1">
                  Your report will appear here
                </p>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* ===== RIGHT: Ask Panel (Fix 1 — own card) ===== */}
        <div className="w-[380px] flex flex-col pb-8 pr-8 pl-0">
          <div className="flex flex-col flex-1 min-h-0 bg-[var(--surface-neutral-white)] rounded-[var(--radius-small)] border border-[var(--border-neutral-x-weak)] overflow-hidden">
          {/* Messages area */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatMessages.map((message) => {
              if (message.type === 'user') {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[85%] px-4 py-3 bg-[var(--surface-neutral-xx-weak)] rounded-2xl rounded-br-sm">
                      <p className="text-[14px] leading-[20px] text-[var(--text-neutral-strong)]">{message.text}</p>
                    </div>
                  </div>
                );
              }

              if (message.type === 'ai') {
                return (
                  <div key={message.id} className="text-[14px] leading-[20px] text-[var(--text-neutral-strong)] whitespace-pre-line">
                    {message.id === streamingMessageId ? streamedText : message.text}
                  </div>
                );
              }

              {/* Checklist message type (Fix 3) */}
              if (message.type === 'checklist') {
                return (
                  <div key={message.id} className="flex flex-col gap-2">
                      {scene3GenerationSteps.map((step, idx) => {
                        const isVisible = currentStepIndex >= idx;
                        const isCompleted = completedSteps.has(step.id);
                        const isActive = currentStepIndex === idx && !isCompleted;

                        if (!isVisible) return null;

                        return (
                          <div
                            key={step.id}
                            className="flex items-center gap-2 text-[14px] leading-[20px] transition-all duration-300"
                          >
                            {isCompleted ? (
                              <Icon name="check-circle" size={14} className="text-[var(--color-primary-strong)] shrink-0" />
                            ) : isActive ? (
                              <Icon name="spinner" size={14} className="text-[var(--color-primary-strong)] animate-spin shrink-0" />
                            ) : null}
                            <span className={isCompleted ? 'text-[var(--text-neutral-strong)]' : 'text-[var(--text-neutral-medium)]'}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                );
              }

              return null;
            })}

            {/* Thinking state */}
            {isThinking && (
              <div className="flex items-center gap-2 text-[14px] text-[var(--text-neutral-medium)]">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </span>
                <span className="italic">
                  {generationPhase === 'planning' ? 'Analyzing your request...' : 'Thinking...'}
                </span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="px-5 pt-4 pb-5 shrink-0">
            <div
              className={`${inputBorderRadius} border border-[var(--border-neutral-medium)] px-4 py-3`}
              style={{ boxShadow: '1px 1px 0px 1px rgba(56, 49, 47, 0.04)' }}
            >
              {/* Report context pill */}
              {hasPill && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--surface-neutral-xx-weak)] rounded-full self-start w-fit mb-5">
                  <Icon name="chart-pie-simple" size={12} className="text-[var(--color-primary-strong)]" />
                  <span className="text-[12px] font-medium text-[var(--color-primary-strong)] truncate max-w-[240px]">
                    {contextPillLabel}
                  </span>
                  <Icon name="xmark" size={10} className="text-[var(--text-neutral-medium)]" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <textarea
                  placeholder="Ask anything..."
                  value={chatInputValue}
                  onChange={handleChatInput}
                  onKeyDown={handleChatKeyDown}
                  rows={1}
                  disabled={generationPhase !== 'complete'}
                  className="flex-1 bg-transparent text-[15px] leading-[22px] text-[var(--text-neutral-strong)] placeholder:text-[var(--text-neutral-medium)] outline-none resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  className="flex items-center justify-center shrink-0"
                  onClick={handleSend}
                  disabled={generationPhase !== 'complete'}
                  aria-label="Send message"
                >
                  <Icon
                    name="circle-arrow-up"
                    size={20}
                    className={chatInputValue.trim() ? 'text-[var(--color-primary-strong)]' : 'text-[#777270]'}
                  />
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoReportBuilder;
