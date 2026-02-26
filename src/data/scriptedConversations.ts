import type { DraftCardData } from '../components/DraftCard/types';
import { employeeContext, approver } from './employeeContext';

const ctx = employeeContext;
const sickBalance = ctx.timeOff.balances.find(b => b.type === 'Sick/Medical');
const budgetRemaining = ctx.expenses.monthlyBudget.remaining;
const addr = ctx.employeeInfo.currentAddress;

// ============================================================
// Types
// ============================================================

export interface ScriptStep {
  aiText: string;
  thinkDuration: number;
  card?: DraftCardData;
}

export interface ConversationScript {
  /** Regex patterns that trigger this script */
  triggers: RegExp[];
  /** Steps in the conversation (multi-step for low-context) */
  steps: ScriptStep[];
}

// ============================================================
// Scenario A: High Context — Time Off Request
// Trigger: "friday" or "day off"
// Current date: Wed Feb 18 2026 → next Friday is Feb 20
// ============================================================

const timeOffCard: DraftCardData = {
  id: 'card-time-off',
  actionType: 'time-off',
  title: 'Time Off Request',
  icon: 'calendar',
  meta: `${sickBalance?.available ?? 48} hrs Sick/Medical remaining · Approver: ${approver}`,
  fields: [
    {
      id: 'type',
      label: 'Type',
      type: 'select',
      value: 'Sick/Medical',
      status: 'prefilled',
      options: ctx.timeOff.balances.map(b => ({ label: b.type, value: b.type })),
    },
    {
      id: 'date',
      label: 'Date',
      type: 'text',
      value: 'Friday, Feb 20',
      status: 'prefilled',
    },
    {
      id: 'duration',
      label: 'Duration',
      type: 'select',
      value: 'Full day (8 hrs)',
      status: 'prefilled',
      options: [
        { label: 'Half day AM', value: 'Half day AM' },
        { label: 'Half day PM', value: 'Half day PM' },
        { label: 'Full day (8 hrs)', value: 'Full day (8 hrs)' },
      ],
    },
    {
      id: 'note',
      label: 'Note',
      type: 'text',
      value: "Doctor's appointment",
      status: 'prefilled',
    },
  ],
  state: 'draft',
  submittedSummary: 'Full day of Sick/Medical on Friday, Feb 20',
};

export const timeOffScript: ConversationScript = {
  triggers: [/friday/i, /day off/i],
  steps: [
    {
      aiText: "Here's your time off request — take a look and hit submit:",
      thinkDuration: 1000,
      card: timeOffCard,
    },
  ],
};

// ============================================================
// Scenario B: Medium Context — Expense Report
// Trigger: "expense" or "lunch" or "receipt"
// ============================================================

const expenseCard: DraftCardData = {
  id: 'card-expense',
  actionType: 'expense',
  title: 'Expense Report',
  icon: 'file-lines',
  meta: `Monthly budget remaining: $${budgetRemaining} · Approver: ${approver}`,
  fields: [
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      value: 'Meals & Entertainment',
      status: 'prefilled',
      options: ctx.expenses.categories.map(c => ({ label: c, value: c })),
    },
    {
      id: 'date',
      label: 'Date',
      type: 'text',
      value: 'Monday, Feb 17',
      status: 'prefilled',
    },
    {
      id: 'description',
      label: 'Description',
      type: 'text',
      value: 'Team lunch',
      status: 'prefilled',
    },
    {
      id: 'amount',
      label: 'Amount',
      type: 'currency',
      value: '',
      status: 'needs-input',
      required: true,
      placeholder: '$0.00',
    },
    {
      id: 'receipt',
      label: 'Receipt',
      type: 'file',
      value: '',
      status: 'needs-input',
      required: true,
      placeholder: 'Tap to upload',
    },
  ],
  state: 'draft',
  submittedSummary: 'Meals & Entertainment expense for Team lunch',
};

export const expenseScript: ConversationScript = {
  triggers: [/expense/i, /lunch/i, /receipt/i],
  steps: [
    {
      aiText: "Got it! I filled in what I could — just need the amount and receipt from you:",
      thinkDuration: 1000,
      card: expenseCard,
    },
  ],
};

// ============================================================
// Scenario C: Low Context — Employee Info Update
// Trigger: "update" or "address" or "info"
// ============================================================

const infoUpdateCard: DraftCardData = {
  id: 'card-info-update',
  actionType: 'info-update',
  title: 'Update Home Address',
  icon: 'location-dot',
  meta: 'This will update your address on file',
  fields: [
    {
      id: 'street',
      label: 'Street',
      type: 'text',
      value: addr.street,
      status: 'prefilled',
    },
    {
      id: 'city',
      label: 'City',
      type: 'text',
      value: addr.city,
      status: 'prefilled',
    },
    {
      id: 'state',
      label: 'State',
      type: 'text',
      value: addr.state,
      status: 'prefilled',
    },
    {
      id: 'zip',
      label: 'Zip',
      type: 'text',
      value: addr.zip,
      status: 'prefilled',
    },
  ],
  state: 'draft',
  submittedSummary: `Address updated to ${addr.street}, ${addr.city}`,
};

export const infoUpdateScript: ConversationScript = {
  triggers: [/update/i, /address/i, /info/i],
  steps: [
    {
      aiText: "Sure! What do you need to update — address, phone, emergency contact, or something else?",
      thinkDuration: 1000,
    },
    {
      aiText: "Here's your current address — update whatever's changed:",
      thinkDuration: 1000,
      card: infoUpdateCard,
    },
  ],
};

// ============================================================
// Fallback
// ============================================================

export const fallbackResponse: ScriptStep = {
  aiText: "I can help with time off requests, expense reports, and updating your info. What do you need?",
  thinkDuration: 500,
};

// ============================================================
// All scripts for matching
// ============================================================

export const allScripts: ConversationScript[] = [
  timeOffScript,
  expenseScript,
  infoUpdateScript,
];
