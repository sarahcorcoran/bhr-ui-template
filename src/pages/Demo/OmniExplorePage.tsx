import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Icon } from '../../components/Icon';
import { OmniResponse } from '../../components/AIChatPanel/OmniResponse';
import { useDemo } from '../../contexts/DemoContext';
import {
  scene4DiversityData,
  scene4ResponseHeader,
} from '../../data/demoScriptData';

// ─── Sidebar field list ──────────────────────────────────────────────────
const SIDEBAR_FIELDS: { label: string; icon: 'A' | '#'; active?: boolean }[] = [
  { label: 'As Of Date', icon: 'A' },
  { label: 'Employee Age Range', icon: 'A' },
  { label: 'Employee Department', icon: 'A', active: true },
  { label: 'Employee Division', icon: 'A' },
  { label: 'Employee Employment Status', icon: 'A' },
  { label: 'Employee Ethnicity', icon: 'A', active: true },
  { label: 'Employee Gender', icon: 'A', active: true },
  { label: 'Employee ID', icon: '#' },
  { label: 'Employee Job Title', icon: 'A' },
  { label: 'Employee Location', icon: 'A' },
  { label: 'Employee Marital Status', icon: 'A' },
  { label: 'Employee Number of Dependents', icon: '#' },
  { label: 'Employee Status', icon: 'A' },
  { label: 'Employee Tenure Range', icon: 'A' },
  { label: 'Selection Count', icon: '#' },
];

// ─── Workbook results table data ─────────────────────────────────────────
const WORKBOOK_ROWS = [
  { department: 'Engineering', female: 18, male: 42, total: 60, pctFemale: 30.0 },
  { department: 'Product', female: 12, male: 18, total: 30, pctFemale: 40.0 },
  { department: 'Marketing', female: 22, male: 14, total: 36, pctFemale: 61.1 },
  { department: 'Sales', female: 16, male: 24, total: 40, pctFemale: 40.0 },
  { department: 'HR', female: 20, male: 8, total: 28, pctFemale: 71.4 },
  { department: 'Finance', female: 14, male: 16, total: 30, pctFemale: 46.7 },
  { department: 'Operations', female: 10, male: 12, total: 22, pctFemale: 45.5 },
];
const WORKBOOK_TOTALS = { female: 112, male: 134, total: 246, pctFemale: 45.5 };
const COL_LETTERS = ['', 'A', 'B', 'C', 'D', 'E'];

// ─── Tab toggles ─────────────────────────────────────────────────────────
const VIEW_TABS = ['Results', 'Chart', 'Both', 'Options'] as const;

interface ChatMsg {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

// ─── Send icon (matches AIChatPanel) ─────────────────────────────────────
function SendIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="14" cy="14" r="13"
        fill={active ? 'var(--color-primary-strong)' : 'none'}
        stroke={active ? 'none' : 'var(--border-neutral-medium)'}
        strokeWidth="1.5"
      />
      <path
        d="M14 19V10M14 10L10 14M14 10L18 14"
        stroke={active ? '#fff' : 'var(--icon-neutral-medium, var(--text-neutral-medium))'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Spreadsheet table (reused by Results + Both) ────────────────────────
function SpreadsheetTable() {
  return (
    <table className="w-full text-[12px] border-collapse" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: 40 }} />
        <col style={{ width: '40%' }} />
        <col />
        <col />
        <col />
        <col />
      </colgroup>
      <thead>
        {/* Column letter row */}
        <tr>
          {COL_LETTERS.map((letter, i) => (
            <th
              key={i}
              className="text-center text-[10px] text-[#9ca3af] py-1 border border-[#e5e7eb] bg-[#f9fafb] font-normal"
            >
              {letter}
            </th>
          ))}
        </tr>
        {/* Header row */}
        <tr>
          <th className="border border-[#e5e7eb] bg-[#f3f4f6]" />
          <th className="text-left px-3 py-2 text-[12px] font-semibold text-[#374151] border border-[#e5e7eb] bg-[#f3f4f6]">Department</th>
          <th className="text-right px-3 py-2 text-[12px] font-semibold text-[#374151] border border-[#e5e7eb] bg-[#f3f4f6]">Female</th>
          <th className="text-right px-3 py-2 text-[12px] font-semibold text-[#374151] border border-[#e5e7eb] bg-[#f3f4f6]">Male</th>
          <th className="text-right px-3 py-2 text-[12px] font-semibold text-[#374151] border border-[#e5e7eb] bg-[#f3f4f6]">Total</th>
          <th className="text-right px-3 py-2 text-[12px] font-semibold text-[#374151] border border-[#e5e7eb] bg-[#f3f4f6]">% Female</th>
        </tr>
      </thead>
      <tbody>
        {WORKBOOK_ROWS.map((row, i) => (
          <tr key={row.department}>
            <td className="text-right pr-2 text-[11px] text-[#9ca3af] border border-[#e5e7eb] bg-[#f9fafb]">{i + 1}</td>
            <td className="px-3 py-2 text-[12px] text-[#1f2937] border border-[#e5e7eb]">{row.department}</td>
            <td className="px-3 py-2 text-right text-[12px] text-[#1f2937] border border-[#e5e7eb]">{row.female}</td>
            <td className="px-3 py-2 text-right text-[12px] text-[#1f2937] border border-[#e5e7eb]">{row.male}</td>
            <td className="px-3 py-2 text-right text-[12px] text-[#1f2937] border border-[#e5e7eb]">{row.total}</td>
            <td className={`px-3 py-2 text-right text-[12px] font-medium border border-[#e5e7eb] ${
              row.pctFemale > 50 ? 'text-[var(--color-primary-strong)]' : 'text-[#1f2937]'
            }`}>
              {row.pctFemale.toFixed(1)}%
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td className="border border-[#e5e7eb] bg-[#f3f4f6]" />
          <td className="px-3 py-2 text-[12px] font-bold text-[#1f2937] border border-[#e5e7eb] bg-[#f3f4f6]">Total</td>
          <td className="px-3 py-2 text-right text-[12px] font-bold text-[#1f2937] border border-[#e5e7eb] bg-[#f3f4f6]">{WORKBOOK_TOTALS.female}</td>
          <td className="px-3 py-2 text-right text-[12px] font-bold text-[#1f2937] border border-[#e5e7eb] bg-[#f3f4f6]">{WORKBOOK_TOTALS.male}</td>
          <td className="px-3 py-2 text-right text-[12px] font-bold text-[#1f2937] border border-[#e5e7eb] bg-[#f3f4f6]">{WORKBOOK_TOTALS.total}</td>
          <td className="px-3 py-2 text-right text-[12px] font-bold text-[#1f2937] border border-[#e5e7eb] bg-[#f3f4f6]">{WORKBOOK_TOTALS.pctFemale.toFixed(1)}%</td>
        </tr>
      </tfoot>
    </table>
  );
}

// ─── Stacked bar chart (reused by Chart + Both) ──────────────────────────
function DiversityChart({ height = 300 }: { height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={scene4DiversityData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="female" name="Female" stackId="a" fill="#73C06B" radius={[0, 0, 0, 0]} />
          <Bar dataKey="male" name="Male" stackId="a" fill="#3AAFA9" radius={[0, 0, 0, 0]} />
          <Bar dataKey="nonBinary" name="Non-Binary" stackId="a" fill="#A78BFA" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OmniExplorePage
// ═══════════════════════════════════════════════════════════════════════════
export function OmniExplorePage() {
  const navigate = useNavigate();
  const { resetDemo, demoResetCounter } = useDemo();

  // ─── Ask panel state ─────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ─── Omni explorer state ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>('Results');

  // Hide the GlobalHeader Ask button while on this page
  useEffect(() => {
    document.body.setAttribute('data-hide-ask-button', 'true');
    return () => document.body.removeAttribute('data-hide-ask-button');
  }, []);

  // Demo reset listener
  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
    setIsThinking(false);
  }, [demoResetCounter]);

  // Ctrl+Shift+D to reset demo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      if (modKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        resetDemo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetDemo]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isThinking]);

  // ─── Chat handlers ───────────────────────────────────────────────────
  const handleSend = () => {
    const msg = chatInput.trim();
    if (!msg || isThinking) return;

    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: 'user', text: msg };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsThinking(true);

    setTimeout(() => {
      const aiMsg: ChatMsg = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: "I can help you explore that further. Try adjusting the fields in the explorer or ask me another question about this dataset.",
      };
      setChatMessages(prev => [...prev, aiMsg]);
      setIsThinking(false);
    }, 1200);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // ─── Main content for each tab ───────────────────────────────────────
  const renderMainContent = () => {
    switch (activeTab) {
      case 'Results':
        return (
          <div className="flex-1 flex flex-col p-4 overflow-auto">
            <p className="text-[12px] text-[#6b7280] mb-3">Employee Diversity — Results</p>
            <SpreadsheetTable />
          </div>
        );
      case 'Chart':
        return (
          <div className="flex-1 flex flex-col p-6 overflow-auto">
            <p className="text-[13px] font-medium text-[#374151] mb-2">{scene4ResponseHeader}</p>
            <DiversityChart />
          </div>
        );
      case 'Both':
        return (
          <div className="flex-1 flex flex-col p-4 overflow-auto gap-4">
            <div>
              <p className="text-[13px] font-medium text-[#374151] mb-2">{scene4ResponseHeader}</p>
              <DiversityChart height={220} />
            </div>
            <SpreadsheetTable />
          </div>
        );
      case 'Options':
        return (
          <div className="flex-1 flex items-center justify-center bg-[#f9fafb]">
            <p className="text-[13px] text-[#9ca3af]">No options configured</p>
          </div>
        );
      default:
        return null;
    }
  };

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full">
      {/* ─── Breadcrumb ────────────────────────────────────────────── */}
      <div className="px-8 pt-6 pb-4">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--text-neutral-medium)] hover:text-[var(--text-neutral-strong)] transition-colors"
        >
          <Icon name="chevron-left" size={12} />
          Reports
        </button>
      </div>

      {/* ─── Two-panel layout ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 px-8 pb-8 gap-4">

        {/* ═══════════ LEFT: Omni Explorer ═══════════════════════════ */}
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">

          {/* ─── Top bar ───────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb]">
            {/* Left: Title */}
            <button className="flex items-center gap-1.5 text-[14px] font-semibold text-[#111827]">
              Employee Diversity
              <Icon name="caret-down" size={10} className="text-[#9ca3af]" />
            </button>

            {/* Center: Tab bar */}
            <div className="flex items-center bg-[#f3f4f6] rounded-lg p-0.5">
              {VIEW_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all ${
                    tab === activeTab
                      ? 'bg-white text-[#111827] shadow-sm border border-[#d1d5db]'
                      : 'text-[#6b7280] hover:text-[#374151] border border-transparent'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Right: Row count + Limits */}
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-[#6b7280]">26 rows</span>
              <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#f3f4f6]">
                <Icon name="arrow-down-to-line" size={13} className="text-[#374151]" />
              </button>
              <button className="flex items-center gap-1 px-2 py-1 border border-[#d1d5db] rounded-md text-[12px] text-[#374151] hover:bg-[#f9fafb]">
                Limits <Icon name="caret-down" size={9} />
              </button>
            </div>
          </div>

          {/* ─── Three-column body ─────────────────────────────────── */}
          <div className="flex flex-1 min-h-0">

            {/* ── Left sidebar (220px) ──────────────────────────────── */}
            <div className="w-[220px] shrink-0 border-r border-[#e5e7eb] bg-[#f9fafb] flex flex-col">
              {/* Search */}
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-md border border-[#d1d5db]">
                  <Icon name="magnifying-glass" size={12} className="text-[#9ca3af]" />
                  <span className="text-[12px] text-[#9ca3af] flex-1">Search</span>
                </div>
              </div>

              {/* In-use pill */}
              <div className="px-3 pb-2">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#d1d5db] rounded-full text-[11px] text-[#6b7280]">
                  In-use
                  <Icon name="caret-down" size={8} className="text-[#9ca3af]" />
                </div>
              </div>

              {/* Section header */}
              <div className="px-3 pb-1">
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <Icon name="caret-down" size={9} className="text-[#6b7280]" />
                  <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider flex-1">
                    Employee Diversity
                  </span>
                  <span className="text-[10px] text-[#6b7280] bg-[#e5e7eb] rounded px-1.5 py-0.5 font-medium">3</span>
                </div>
              </div>

              {/* Field list */}
              <div className="flex-1 overflow-y-auto px-3 pb-3">
                {SIDEBAR_FIELDS.map(field => (
                  <div
                    key={field.label}
                    className={`flex items-center gap-2 px-2 py-[5px] rounded text-[12px] ${
                      field.active
                        ? 'text-[var(--color-primary-strong)] font-medium'
                        : 'text-[#374151]'
                    }`}
                  >
                    <span className={`text-[11px] font-semibold ${
                      field.active ? 'text-[var(--color-primary-strong)]' : 'text-[#9ca3af]'
                    }`}>
                      {field.icon}
                    </span>
                    <span className="truncate">{field.label}</span>
                  </div>
                ))}
              </div>

              {/* Bottom: Add field */}
              <div className="shrink-0 px-3 pb-3">
                <button className="flex items-center gap-1.5 text-[12px] text-[var(--color-primary-strong)] font-medium">
                  <Icon name="circle-plus" size={12} />
                  Add field
                </button>
              </div>
            </div>

            {/* ── Center: Main content area ─────────────────────────── */}
            {renderMainContent()}

            {/* ── Right: Chart Options panel (220px) ────────────────── */}
            <div className="w-[220px] shrink-0 border-l border-[#e5e7eb] bg-white overflow-y-auto p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] font-semibold text-[#111827]">Chart Options</p>
                <button className="w-5 h-5 flex items-center justify-center text-[#9ca3af] hover:text-[#6b7280]">
                  <Icon name="xmark" size={12} />
                </button>
              </div>

              {/* Chart selector */}
              <div className="mb-4">
                <p className="text-[11px] font-semibold text-[#374151] mb-1.5">Chart selector</p>
                <p className="text-[11px] text-[#9ca3af] mb-2">Auto-charting off</p>
                <div className="inline-flex border border-[#e5e7eb] rounded-md overflow-hidden mb-2">
                  <button className="w-8 h-7 flex items-center justify-center bg-[#f3f4f6] border-r border-[#e5e7eb]">
                    <Icon name="chart-line" size={13} className="text-[#374151]" />
                  </button>
                  <button className="w-8 h-7 flex items-center justify-center hover:bg-[#f9fafb]">
                    <Icon name="table-cells" size={13} className="text-[#6b7280]" />
                  </button>
                </div>
              </div>

              {/* Aa / formula */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#e5e7eb]">
                <span className="text-[12px] font-medium text-[#374151]">Aa</span>
                <span className="text-[12px] text-[#9ca3af]">{'{ … }'}</span>
              </div>

              {/* X/Y Chart header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-[#374151]">X/Y Chart</p>
                <Icon name="gear" size={11} className="text-[#9ca3af]" />
              </div>

              {/* X-Axis */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-semibold text-[#374151]">X-Axis</p>
                  <Icon name="gear" size={10} className="text-[#9ca3af]" />
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 bg-[#f3f4f6] rounded-md border border-[#e5e7eb]">
                  <span className="text-[10px] font-semibold text-[#9ca3af]">A</span>
                  <span className="text-[11px] text-[#374151] flex-1">Department</span>
                  <Icon name="xmark" size={9} className="text-[#9ca3af]" />
                </div>
              </div>

              {/* Left-Axis */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-semibold text-[#374151]">Left-Axis</p>
                  <Icon name="gear" size={10} className="text-[#9ca3af]" />
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 bg-[#f3f4f6] rounded-md border border-[#e5e7eb]">
                  <span className="text-[10px] font-semibold text-[#9ca3af]">#</span>
                  <span className="text-[11px] text-[#374151] flex-1">Headcount</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary-strong)]" />
                    <Icon name="xmark" size={9} className="text-[#9ca3af]" />
                  </div>
                </div>
              </div>

              {/* Right-Axis */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-semibold text-[#374151]">Right-Axis</p>
                  <Icon name="gear" size={10} className="text-[#9ca3af]" />
                </div>
                <p className="text-[10px] text-[#9ca3af] italic px-2">Drag a field to Right-Axis</p>
              </div>

              {/* Color and legend */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-semibold text-[#374151]">Color and legend</p>
                  <Icon name="gear" size={10} className="text-[#9ca3af]" />
                </div>
                <p className="text-[10px] text-[#9ca3af] italic px-2">Drag a field to Color and legend</p>
              </div>

              {/* Small multiples */}
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-[#374151] mb-1">Small multiples</p>
                <div className="flex flex-col gap-0.5 px-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#6b7280]">Columns</span>
                    <span className="text-[10px] text-[#9ca3af] italic">Drag a field to facet</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#6b7280]">Rows</span>
                    <span className="text-[10px] text-[#9ca3af] italic">Drag a field to facet</span>
                  </div>
                </div>
              </div>

              {/* Tooltip */}
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-[#374151]">Tooltip</p>
                <Icon name="caret-down" size={9} className="text-[#9ca3af]" />
              </div>
            </div>
          </div>

          {/* ─── Bottom bar ────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2 border-t border-[#e5e7eb]">
            <button className="flex items-center gap-1.5 text-[12px] text-[var(--color-primary-strong)] font-medium">
              <Icon name="circle-plus" size={12} />
              Add field
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] text-[#374151] border border-[#d1d5db] rounded-md hover:bg-[#f9fafb]">
              <span>⚡</span>
              Query
              <Icon name="caret-down" size={9} className="text-[#9ca3af]" />
            </button>
          </div>
        </div>

        {/* ═══════════ RIGHT: Docked Ask Panel ═══════════════════════ */}
        <div className="w-[380px] shrink-0 flex flex-col bg-[var(--surface-neutral-white)] rounded-[var(--radius-small)] border border-[var(--border-neutral-x-weak)] overflow-hidden">

          {/* ─── Chrome header ──────────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border-neutral-x-weak)]">
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--surface-neutral-xx-weak)]">
              <Icon name="bars" size={14} className="text-[var(--icon-neutral-strong)]" />
            </button>
            <div className="flex items-center gap-1">
              <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--surface-neutral-xx-weak)]">
                <Icon name="up-right-and-down-left-from-center" size={13} className="text-[var(--icon-neutral-strong)]" />
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--surface-neutral-xx-weak)]">
                <Icon name="xmark" size={14} className="text-[var(--icon-neutral-strong)]" />
              </button>
            </div>
          </div>

          {/* ─── Conversation area ─────────────────────────────────── */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {/* Pre-seeded user message */}
            <div className="flex justify-end">
              <div className="max-w-[85%] px-4 py-3 bg-[var(--surface-neutral-xx-weak)] rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[16px]">
                <p className="text-[14px] leading-[20px] text-[var(--text-neutral-strong)]">
                  Show me the gender diversity breakdown
                </p>
              </div>
            </div>

            {/* Pre-seeded AI response: collapsed confirmation on /omni-explore */}
            <OmniResponse onNavigate={() => {}} />

            {/* Dynamic messages from user interaction */}
            {chatMessages.map(msg => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] px-4 py-3 bg-[var(--surface-neutral-xx-weak)] rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[16px]">
                      <p className="text-[14px] leading-[20px] text-[var(--text-neutral-strong)]">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-[14px] leading-[22px] text-[var(--text-neutral-strong)]">
                    {msg.text}
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex items-center gap-1.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-neutral-medium)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-neutral-medium)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-neutral-medium)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* ─── Input area with context pill ───────────────────────── */}
          <div className="shrink-0 px-5 pt-3 pb-5">
            <div
              className="rounded-xl border border-[var(--border-neutral-weak)] px-4 py-3"
              style={{ boxShadow: '1px 1px 0px 1px rgba(56, 49, 47, 0.04)' }}
            >
              {/* Context pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--surface-neutral-xx-weak)] rounded-full w-fit mb-3">
                <Icon name="chart-pie-simple" size={12} className="text-[var(--color-primary-strong)]" />
                <span className="text-[12px] font-medium text-[var(--color-primary-strong)] truncate max-w-[240px]">
                  Employee Diversity
                </span>
                <button className="flex items-center justify-center">
                  <Icon name="xmark" size={10} className="text-[var(--text-neutral-medium)]" />
                </button>
              </div>

              {/* Textarea + send */}
              <div className="flex items-end gap-3">
                <textarea
                  placeholder="Ask anything..."
                  value={chatInput}
                  onChange={handleChatInputChange}
                  onKeyDown={handleChatKeyDown}
                  rows={1}
                  className="flex-1 bg-transparent text-[14px] leading-[20px] text-[var(--text-neutral-strong)] placeholder:text-[var(--text-neutral-medium)] outline-none resize-none overflow-hidden"
                />
                <button
                  onClick={handleSend}
                  disabled={!chatInput.trim() || isThinking}
                  aria-label="Send message"
                >
                  <SendIcon active={!!chatInput.trim() && !isThinking} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OmniExplorePage;
