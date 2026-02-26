// Golden Path scripted conversations for demo mode (?demo=true)
// These use the same tool call format as real API responses, so the rendering
// pipeline (useChat → DraftCard) needs no changes.
//
// PTO flows use keyword-based routing for generous trigger matching.
// Card data is dynamically parsed from user text (not hardcoded).
// Expense/info flows use legacy substring matching (unchanged).

import { employeeContext } from './employeeContext';
import { parsePTORequest, parsePTOType, parseDates, formatDateRange, getBalance } from './inputParser';

// ─── Date helpers (used by expense/info paths) ───

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function getToday(): Date {
  return new Date();
}

function getNextBusinessDay(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

// ─── Types ───

export interface GoldenStep {
  /** What user input triggers this step. null = triggered by card submit or initial response. */
  trigger: string | null;
  /** Delay in ms before the AI "responds" */
  delay: number;
  /** The text the AI says (static). If buildText is provided, this is the fallback. */
  text: string;
  /** Optional static tool call to fire (same format as OpenAI onToolCall) */
  toolCall?: {
    name: 'present_draft_card' | 'present_suggestions';
    arguments: Record<string, unknown>;
  };
  /** Dynamic tool call builder — receives user text, returns tool call args. Overrides static toolCall. */
  buildToolCall?: (userText: string) => {
    name: 'present_draft_card' | 'present_suggestions';
    arguments: Record<string, unknown>;
  };
  /** Dynamic text builder — receives user text, returns response text. Overrides static text. */
  buildText?: (userText: string) => string;
  /** Custom match function for flexible trigger matching (checked before exact trigger match) */
  matchFn?: (text: string) => boolean;
}

export interface GoldenPath {
  id: string;
  /** User messages that trigger this path (used for legacy substring matching on non-PTO paths) */
  triggers: string[];
  steps: GoldenStep[];
  /** The original user message that initiated this path (set at runtime by findGoldenPath) */
  initialUserText?: string;
}

// ─── Keyword detection helpers ───

const PTO_KEYWORDS = ['time off', 'pto', 'vacation', 'sick', 'personal', 'day off', 'days off', 'bereavement', 'leave'];

const PTO_TYPE_MAP: Record<string, string> = {
  vacation: 'Vacation',
  sick: 'Sick/Medical',
  medical: 'Sick/Medical',
  personal: 'Personal',
  bereavement: 'Bereavement',
};

const MONTH_NAMES_LOWER = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

const RELATIVE_DATES = ['tomorrow', 'this friday', 'next friday', 'this monday', 'next monday', 'next tuesday', 'next wednesday', 'next thursday'];

const EXPENSE_SIGNALS = ['expense', 'spent', 'receipt', '$'];

function hasPTOKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  if (PTO_KEYWORDS.some(kw => lower.includes(kw))) return true;
  // Catch patterns like "March 10-14 off", "Friday off", "tomorrow off"
  if (/\boff\b/.test(lower) && (hasDatePattern(lower) || /\b(monday|tuesday|wednesday|thursday|friday)\b/.test(lower))) return true;
  return false;
}

export function extractPTOType(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [keyword, type] of Object.entries(PTO_TYPE_MAP)) {
    if (lower.includes(keyword)) return type;
  }
  return null;
}

function hasDatePattern(text: string): boolean {
  const lower = text.toLowerCase();
  if (MONTH_NAMES_LOWER.some(m => lower.includes(m))) return true;
  if (RELATIVE_DATES.some(r => lower.includes(r))) return true;
  // Number ranges like "10-14", "1/2-1/4", "3/10"
  if (/\d{1,2}[\-\/]\d{1,2}/.test(text)) return true;
  // Day name with "this" or "next"
  if (/\b(this|next)\s+(monday|tuesday|wednesday|thursday|friday)\b/i.test(text)) return true;
  // Standalone day names (e.g., "Friday", "on Monday") — specific enough for PTO context
  if (/\b(monday|tuesday|wednesday|thursday|friday)\b/i.test(text)) return true;
  return false;
}

function hasEditIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return /\b(change|switch|make it|actually|update it to|change it to|switch it to)\b/.test(lower);
}

function hasExpenseSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return EXPENSE_SIGNALS.some(s => lower.includes(s));
}

// ─── Date edit detection ───

function hasDateEditIntent(text: string): boolean {
  const lower = text.toLowerCase();
  // "make it March 17", "change the dates to...", "actually April 2-4", "move it to Friday"
  return /\b(change|move|switch|make it|actually|update)\b/.test(lower) && hasDatePattern(lower);
}

// ─── PTO card builder helper ───

function buildPTOCard(type: string, startISO: string, endISO: string, hours: number) {
  const ctx = employeeContext;
  const balance = getBalance(type);
  const overBalance = hours > balance;
  const infoMessage = overBalance
    ? `\u26A0\uFE0F You're requesting ${hours} hrs but only have ${balance} hrs ${type} remaining. ${ctx.employee.manager.name} will be notified.`
    : `${ctx.employee.manager.name} will be notified`;

  return {
    cardType: 'timeOff',
    title: 'Time Off Request',
    infoMessage,
    fields: [
      { id: 'type', label: 'Type', type: 'dropdown', value: type, needsInput: false, options: ['Vacation', 'Sick/Medical', 'Personal', 'Bereavement'] },
      { id: 'startDate', label: 'Start Date', type: 'date', value: startISO, needsInput: false },
      { id: 'endDate', label: 'End Date', type: 'date', value: endISO, needsInput: false },
      { id: 'hours', label: 'Hours', type: 'text', value: String(hours), needsInput: false, placeholder: '8' },
      { id: 'note', label: 'Note', type: 'text', value: '', needsInput: false },
    ],
  };
}

/** Build a PTO card from parsed user text. Falls back to defaults for anything the parser can't extract. */
function buildPTOCardFromText(userText: string, overrideType?: string) {
  const parsed = parsePTORequest(userText);
  const type = overrideType || parsed.type || 'Vacation';
  const startISO = parsed.startDate || toISO(getNextBusinessDay());
  const endISO = parsed.endDate || startISO;
  const hours = parsed.hours || 8;
  return buildPTOCard(type, startISO, endISO, hours);
}

// ─── Flow 1: PTO Clarification (vague request, no type/dates) ───

function buildPTOClarificationPath(): GoldenPath {
  const ctx = employeeContext;
  const vacation = ctx.timeOff.balances.find(b => b.type === 'Vacation');
  const sick = ctx.timeOff.balances.find(b => b.type === 'Sick/Medical');
  const personal = ctx.timeOff.balances.find(b => b.type === 'Personal');
  const bereavement = ctx.timeOff.balances.find(b => b.type === 'Bereavement');

  const balanceList = `\u2022 Vacation: ${vacation?.available ?? 0}h\n\u2022 Sick/Medical: ${sick?.available ?? 0}h\n\u2022 Personal: ${personal?.available ?? 0}h\n\u2022 Bereavement: ${bereavement?.available ?? 0}h`;

  return {
    id: 'pto-clarification',
    triggers: [], // Routed by keyword analysis, not triggers
    steps: [
      // Step 0: Show balances + ask warmly (text only, no pills, no tool call)
      {
        trigger: null,
        delay: 1000,
        text: `I can help with that! Here are your current balances:\n${balanceList}\n\nWhat type of time off do you need, and what dates?`,
      },
      // Step 1: User provides type + dates → dynamically parse and build card
      {
        trigger: null, // matched by matchFn
        matchFn: (text: string) => {
          return extractPTOType(text) !== null && hasDatePattern(text);
        },
        delay: 1000,
        text: "Here's your time off request \u2014 take a look and submit when ready!",
        buildToolCall: (userText: string) => ({
          name: 'present_draft_card' as const,
          arguments: buildPTOCardFromText(userText),
        }),
      },
      // Step 2: Post-submit acknowledgment (dynamic)
      {
        trigger: null,
        delay: 500,
        text: '', // overridden by buildText
        buildText: () => {
          // This is a placeholder — actual text is generated at play time in useChat
          return `All set, Morgan! Your time off request has been submitted. ${ctx.employee.manager.name} will be notified.`;
        },
      },
    ],
  };
}

// ─── Flow 2: PTO Happy Path (type + dates provided upfront) ───

function buildPTOHappyPath(): GoldenPath {
  const ctx = employeeContext;

  return {
    id: 'pto-happy',
    triggers: [], // Routed by keyword analysis
    steps: [
      // Step 0: Parse user message and present card immediately
      {
        trigger: null,
        delay: 1000,
        text: "Here's your time off request \u2014 take a look and submit when ready!",
        buildToolCall: (userText: string) => ({
          name: 'present_draft_card' as const,
          arguments: buildPTOCardFromText(userText),
        }),
      },
      // Step 1: Post-submit acknowledgment (dynamic)
      {
        trigger: null,
        delay: 500,
        text: '', // overridden by buildText
        buildText: () => {
          return `All set, Morgan! Your time off request has been submitted. ${ctx.employee.manager.name} will be notified.`;
        },
      },
    ],
  };
}

// ─── Flow 3: PTO Missing Type (dates known, type missing) ───

function buildPTOMissingTypePath(): GoldenPath {
  const ctx = employeeContext;
  const vacation = ctx.timeOff.balances.find(b => b.type === 'Vacation');
  const sick = ctx.timeOff.balances.find(b => b.type === 'Sick/Medical');
  const personal = ctx.timeOff.balances.find(b => b.type === 'Personal');
  const bereavement = ctx.timeOff.balances.find(b => b.type === 'Bereavement');

  const balanceList = `\u2022 Vacation: ${vacation?.available ?? 0}h\n\u2022 Sick/Medical: ${sick?.available ?? 0}h\n\u2022 Personal: ${personal?.available ?? 0}h\n\u2022 Bereavement: ${bereavement?.available ?? 0}h`;

  // Helper to build a card step for each PTO type pill.
  // The card uses dates from the INITIAL user message (stored on the path at runtime).
  function pillStep(type: string): GoldenStep {
    return {
      trigger: type, // Exact match on pill text
      delay: 1000,
      text: "Here's your time off request \u2014 take a look and submit when ready!",
      // buildToolCall uses the initial user text stored on the path
      buildToolCall: (initialUserText: string) => ({
        name: 'present_draft_card' as const,
        arguments: buildPTOCardFromText(initialUserText, type),
      }),
    };
  }

  return {
    id: 'pto-missing-type',
    triggers: [], // Routed by keyword analysis
    steps: [
      // Step 0: Show balances + ask type with pills
      {
        trigger: null,
        delay: 1000,
        text: `Sure thing! Here are your current balances:\n${balanceList}\n\nWhat type of time off is this?`,
        toolCall: {
          name: 'present_suggestions',
          arguments: {
            suggestions: ['Vacation', 'Sick/Medical', 'Personal', 'Bereavement'],
          },
        },
      },
      // Steps 1-4: One step per pill option
      pillStep('Vacation'),
      pillStep('Sick/Medical'),
      pillStep('Personal'),
      pillStep('Bereavement'),
      // Step 5: Post-submit acknowledgment (dynamic)
      {
        trigger: null,
        delay: 500,
        text: '', // overridden by buildText
        buildText: () => {
          return `All set, Morgan! Your time off request has been submitted. ${ctx.employee.manager.name} will be notified.`;
        },
      },
    ],
  };
}

// ─── Conversational Edit Detection ───

/**
 * Detect a conversational edit request for a PTO card.
 * Handles type changes ("change it to sick"), date changes ("make it March 17"),
 * or both ("switch to personal on Friday").
 * Returns edit data or null if not an edit.
 */
export function detectPTOEdit(text: string): {
  newType?: string;
  newStartDate?: string;
  newEndDate?: string;
  newHours?: number;
  infoMessage: string;
} | null {
  if (!hasEditIntent(text) && !hasDateEditIntent(text)) return null;

  const ctx = employeeContext;
  const type = extractPTOType(text);
  const { startDate, endDate } = parseDates(text);
  const hasDateChange = startDate !== null;

  // Must have at least one change
  if (!type && !hasDateChange) return null;

  // Build partial result
  const result: {
    newType?: string;
    newStartDate?: string;
    newEndDate?: string;
    newHours?: number;
    infoMessage: string;
  } = { infoMessage: '' };

  if (type) result.newType = type;
  if (hasDateChange) {
    result.newStartDate = startDate!;
    result.newEndDate = endDate || startDate!;
    // Compute hours for the new date range
    const start = new Date(result.newStartDate + 'T12:00:00');
    const end = new Date(result.newEndDate + 'T12:00:00');
    let count = 0;
    const d = new Date(start);
    while (d <= end) {
      if (d.getDay() !== 0 && d.getDay() !== 6) count++;
      d.setDate(d.getDate() + 1);
    }
    result.newHours = count * 8;
  }

  // infoMessage will be computed in playPTOEdit using the final type + balance
  // For now, set a placeholder that playPTOEdit will replace
  result.infoMessage = '__compute__';

  return result;
}

// ─── Expense Paths (unchanged) ───

function buildExpenseHighContextPath(): GoldenPath {
  const yesterday = getYesterday();
  const yesterdayISO = toISO(yesterday);
  const ctx = employeeContext;

  return {
    id: 'expense-high',
    triggers: [
      'i need to expense a team lunch',
      'expense a team lunch',
      'team lunch expense',
      'expense report for team lunch',
    ],
    steps: [
      {
        trigger: null,
        delay: 1000,
        text: "Got it! Here's your expense report \u2014 confirm the details and submit.",
        toolCall: {
          name: 'present_draft_card',
          arguments: {
            cardType: 'expense',
            title: 'Expense Report',
            infoMessage: `$${ctx.expenses.monthlyBudget.remaining} remaining this month \u00B7 ${ctx.employee.manager.name} will be notified`,
            fields: [
              { id: 'category', label: 'Category', type: 'dropdown', value: 'Meals & Entertainment', needsInput: false, options: ctx.expenses.categories },
              { id: 'date', label: 'Date', type: 'date', value: yesterdayISO, needsInput: false },
              { id: 'merchant', label: 'Merchant', type: 'text', value: '', needsInput: true, required: true, placeholder: 'Restaurant name' },
              { id: 'amount', label: 'Amount', type: 'currency', value: '', needsInput: true, required: true, placeholder: '$0.00' },
              { id: 'description', label: 'Description', type: 'text', value: 'Team lunch', needsInput: false },
              { id: 'receipt', label: 'Receipt', type: 'file', value: '', needsInput: true, required: false, placeholder: 'Upload receipt (optional)' },
            ],
          },
        },
      },
      {
        trigger: null,
        delay: 500,
        text: `Done! Your expense report has been submitted. ${ctx.employee.manager.name} will review it.`,
      },
    ],
  };
}

function buildExpenseLowContextPath(): GoldenPath {
  const todayDate = getToday();
  const todayISO = toISO(todayDate);
  const ctx = employeeContext;

  return {
    id: 'expense-low',
    triggers: [
      'submit an expense',
      'expense report',
      'i have an expense',
      'i need to submit an expense',
    ],
    steps: [
      {
        trigger: null,
        delay: 1000,
        text: `Happy to help! Here's where your expense budget stands:\n\u2022 Monthly budget: $${ctx.expenses.monthlyBudget.limit}\n\u2022 Remaining: $${ctx.expenses.monthlyBudget.remaining}\nWhat did you spend on, how much, and where?`,
      },
      {
        trigger: '$45 lunch at chilis',
        delay: 1000,
        text: "Got it! Here's your expense report \u2014 confirm the details and submit.",
        toolCall: {
          name: 'present_draft_card',
          arguments: {
            cardType: 'expense',
            title: 'Expense Report',
            infoMessage: `$${ctx.expenses.monthlyBudget.remaining} remaining this month \u00B7 ${ctx.employee.manager.name} will be notified`,
            fields: [
              { id: 'category', label: 'Category', type: 'dropdown', value: 'Meals & Entertainment', needsInput: false, options: ctx.expenses.categories },
              { id: 'date', label: 'Date', type: 'date', value: todayISO, needsInput: false },
              { id: 'merchant', label: 'Merchant', type: 'text', value: "Chili's", needsInput: false, required: true },
              { id: 'amount', label: 'Amount', type: 'currency', value: '$45.00', needsInput: false, required: true, placeholder: '$0.00' },
              { id: 'description', label: 'Description', type: 'text', value: 'Lunch', needsInput: false },
              { id: 'receipt', label: 'Receipt', type: 'file', value: '', needsInput: true, required: false, placeholder: 'Upload receipt (optional)' },
            ],
          },
        },
      },
      {
        trigger: null,
        delay: 500,
        text: `Done! Your expense report for $45.00 has been submitted. ${ctx.employee.manager.name} will review it.`,
      },
    ],
  };
}

// ─── Info Update Paths (unchanged) ───

function buildInfoUpdatePath(): GoldenPath {
  const ctx = employeeContext;

  return {
    id: 'info-update',
    triggers: [
      'i need to update some info',
      'update some info',
      'update my info',
    ],
    steps: [
      {
        trigger: null,
        delay: 1000,
        text: "Sure! What do you need to update?",
        toolCall: {
          name: 'present_suggestions',
          arguments: {
            suggestions: ['Update my address', 'Update my phone', 'Update emergency contact'],
          },
        },
      },
      {
        trigger: 'Update my address',
        delay: 1000,
        text: "Here's your current address \u2014 update whatever's changed and hit submit!",
        toolCall: {
          name: 'present_draft_card',
          arguments: {
            cardType: 'addressUpdate',
            title: 'Update Address',
            infoMessage: `Your manager ${ctx.employee.manager.name} will be notified of this change`,
            fields: [
              { id: 'street', label: 'Street', type: 'text', value: ctx.employeeInfo.currentAddress.street, needsInput: false },
              { id: 'city', label: 'City', type: 'text', value: ctx.employeeInfo.currentAddress.city, needsInput: false },
              { id: 'state', label: 'State', type: 'text', value: ctx.employeeInfo.currentAddress.state, needsInput: false },
              { id: 'zip', label: 'ZIP', type: 'text', value: ctx.employeeInfo.currentAddress.zip, needsInput: false },
            ],
          },
        },
      },
      {
        trigger: 'Update my phone',
        delay: 1000,
        text: "Here's your phone number \u2014 update it and hit submit!",
        toolCall: {
          name: 'present_draft_card',
          arguments: {
            cardType: 'phoneUpdate',
            title: 'Update Phone',
            infoMessage: `Your manager ${ctx.employee.manager.name} will be notified of this change`,
            fields: [
              { id: 'phoneType', label: 'Type', type: 'dropdown', value: 'Mobile', needsInput: false, options: ['Mobile', 'Home', 'Work'] },
              { id: 'phone', label: 'Phone', type: 'text', value: ctx.employee.phone, needsInput: false, placeholder: '(xxx) xxx-xxxx' },
            ],
          },
        },
      },
      {
        trigger: 'Update emergency contact',
        delay: 1000,
        text: "Here's your emergency contact \u2014 make any changes and hit submit!",
        toolCall: {
          name: 'present_draft_card',
          arguments: {
            cardType: 'emergencyContactUpdate',
            title: 'Update Emergency Contact',
            infoMessage: `Your manager ${ctx.employee.manager.name} will be notified of this change`,
            fields: [
              { id: 'name', label: 'Name', type: 'text', value: ctx.employeeInfo.emergencyContact.name, needsInput: false },
              { id: 'relationship', label: 'Relationship', type: 'dropdown', value: ctx.employeeInfo.emergencyContact.relationship, needsInput: false, options: ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'] },
              { id: 'phone', label: 'Phone', type: 'text', value: ctx.employeeInfo.emergencyContact.phone, needsInput: false, placeholder: '(xxx) xxx-xxxx' },
            ],
          },
        },
      },
      {
        trigger: null,
        delay: 500,
        text: `Done! Your info has been updated. ${ctx.employee.manager.name} has been notified.`,
      },
    ],
  };
}

function buildAddressUpdatePath(): GoldenPath {
  const ctx = employeeContext;

  return {
    id: 'address-update',
    triggers: [
      'update my address',
      'change my address',
      'new address',
    ],
    steps: [
      {
        trigger: null,
        delay: 1000,
        text: "Here's your current address \u2014 update whatever's changed and hit submit!",
        toolCall: {
          name: 'present_draft_card',
          arguments: {
            cardType: 'addressUpdate',
            title: 'Update Address',
            infoMessage: `Your manager ${ctx.employee.manager.name} will be notified of this change`,
            fields: [
              { id: 'street', label: 'Street', type: 'text', value: ctx.employeeInfo.currentAddress.street, needsInput: false },
              { id: 'city', label: 'City', type: 'text', value: ctx.employeeInfo.currentAddress.city, needsInput: false },
              { id: 'state', label: 'State', type: 'text', value: ctx.employeeInfo.currentAddress.state, needsInput: false },
              { id: 'zip', label: 'ZIP', type: 'text', value: ctx.employeeInfo.currentAddress.zip, needsInput: false },
            ],
          },
        },
      },
      {
        trigger: null,
        delay: 500,
        text: `Done! Your address has been updated. ${ctx.employee.manager.name} has been notified.`,
      },
    ],
  };
}

function buildPhoneUpdatePath(): GoldenPath {
  const ctx = employeeContext;

  return {
    id: 'phone-update',
    triggers: [
      'update my phone',
      'change my phone',
      'new phone number',
    ],
    steps: [
      {
        trigger: null,
        delay: 1000,
        text: "Here's your phone number \u2014 update it and hit submit!",
        toolCall: {
          name: 'present_draft_card',
          arguments: {
            cardType: 'phoneUpdate',
            title: 'Update Phone',
            infoMessage: `Your manager ${ctx.employee.manager.name} will be notified of this change`,
            fields: [
              { id: 'phoneType', label: 'Type', type: 'dropdown', value: 'Mobile', needsInput: false, options: ['Mobile', 'Home', 'Work'] },
              { id: 'phone', label: 'Phone', type: 'text', value: ctx.employee.phone, needsInput: false, placeholder: '(xxx) xxx-xxxx' },
            ],
          },
        },
      },
      {
        trigger: null,
        delay: 500,
        text: `Done! Your phone number has been updated. ${ctx.employee.manager.name} has been notified.`,
      },
    ],
  };
}

function buildEmergencyContactPath(): GoldenPath {
  const ctx = employeeContext;

  return {
    id: 'emergency-contact',
    triggers: [
      'update emergency contact',
      'change emergency contact',
      'update my emergency contact',
    ],
    steps: [
      {
        trigger: null,
        delay: 1000,
        text: "Here's your emergency contact \u2014 make any changes and hit submit!",
        toolCall: {
          name: 'present_draft_card',
          arguments: {
            cardType: 'emergencyContactUpdate',
            title: 'Update Emergency Contact',
            infoMessage: `Your manager ${ctx.employee.manager.name} will be notified of this change`,
            fields: [
              { id: 'name', label: 'Name', type: 'text', value: ctx.employeeInfo.emergencyContact.name, needsInput: false },
              { id: 'relationship', label: 'Relationship', type: 'dropdown', value: ctx.employeeInfo.emergencyContact.relationship, needsInput: false, options: ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'] },
              { id: 'phone', label: 'Phone', type: 'text', value: ctx.employeeInfo.emergencyContact.phone, needsInput: false, placeholder: '(xxx) xxx-xxxx' },
            ],
          },
        },
      },
      {
        trigger: null,
        delay: 500,
        text: `Done! Your emergency contact has been updated. ${ctx.employee.manager.name} has been notified.`,
      },
    ],
  };
}

// ─── Public API ───

/** Check if demo mode is active via URL parameter */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demo') === 'true';
}

/** Build all golden paths (dates computed fresh each time) */
export function buildGoldenPaths(): GoldenPath[] {
  return [
    // PTO flows (keyword-routed, no triggers needed)
    buildPTOClarificationPath(),
    buildPTOHappyPath(),
    buildPTOMissingTypePath(),
    // Expense flows (legacy substring matching)
    buildExpenseHighContextPath(),
    buildExpenseLowContextPath(),
    // Info update flows (legacy substring matching)
    buildInfoUpdatePath(),
    buildAddressUpdatePath(),
    buildPhoneUpdatePath(),
    buildEmergencyContactPath(),
  ];
}

/**
 * Find the golden path that matches a user message.
 * PTO uses keyword-based routing; expense/info use legacy substring matching.
 * Stores the initial user text on the path for use by dynamic builders.
 */
export function findGoldenPath(userText: string, paths: GoldenPath[]): GoldenPath | null {
  const lower = userText.toLowerCase().trim();

  // ── Priority 1: If text has expense signals, skip PTO routing ──
  if (hasExpenseSignal(lower)) {
    // Fall through to legacy matching for expense paths
  } else if (hasPTOKeyword(lower)) {
    // ── Priority 2: PTO keyword routing ──
    const hasType = extractPTOType(lower) !== null;
    const hasDates = hasDatePattern(lower);

    let path: GoldenPath | null = null;

    if (hasType && hasDates) {
      path = paths.find(p => p.id === 'pto-happy') || null;
    } else if (hasDates && !hasType) {
      path = paths.find(p => p.id === 'pto-missing-type') || null;
    } else {
      // No dates, no type (or type only with no dates) → clarification
      path = paths.find(p => p.id === 'pto-clarification') || null;
    }

    if (path) {
      // Store the original user text so dynamic builders can parse it
      path.initialUserText = userText;
    }
    return path;
  }

  // ── Priority 3: Legacy substring matching for expense/info paths ──
  for (const path of paths) {
    if (path.id.startsWith('pto-')) continue;
    for (const trigger of path.triggers) {
      if (lower.includes(trigger.toLowerCase()) || trigger.toLowerCase().includes(lower)) {
        return path;
      }
    }
  }

  return null;
}

/**
 * Find the step in a golden path that matches a user reply (for multi-step flows).
 * Checks matchFn first, then falls back to exact trigger match.
 * Returns the step index, or -1 if no match.
 */
export function findStepByTrigger(path: GoldenPath, userText: string): number {
  const lower = userText.toLowerCase().trim();
  for (let i = 0; i < path.steps.length; i++) {
    const step = path.steps[i];
    // Custom match function takes priority
    if (step.matchFn && step.matchFn(lower)) {
      return i;
    }
    // Exact case-insensitive match on trigger string
    if (step.trigger && step.trigger.toLowerCase() === lower) {
      return i;
    }
  }
  return -1;
}

/**
 * Resolve a step's tool call — uses buildToolCall (dynamic) if present, else static toolCall.
 * The userText parameter is the text to pass to the dynamic builder.
 */
export function resolveStepToolCall(
  step: GoldenStep,
  userText: string,
): { name: 'present_draft_card' | 'present_suggestions'; arguments: Record<string, unknown> } | undefined {
  if (step.buildToolCall) {
    return step.buildToolCall(userText);
  }
  return step.toolCall;
}

/**
 * Resolve a step's response text — uses buildText (dynamic) if present, else static text.
 */
export function resolveStepText(step: GoldenStep, userText: string): string {
  if (step.buildText) {
    return step.buildText(userText);
  }
  return step.text;
}

// Re-export formatDateRange for use in useChat post-submit
export { formatDateRange } from './inputParser';
