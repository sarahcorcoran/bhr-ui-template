import type { DraftCardData } from './types';
import { employeeContext, approver } from './employeeContext';

const ctx = employeeContext;
const sickBalance = ctx.timeOff.balances.find(b => b.type === 'Sick/Medical');
const budgetRemaining = ctx.expenses.monthlyBudget.remaining;
const addr = ctx.employeeInfo.currentAddress;
const emergencyContact = ctx.employeeInfo.emergencyContact;

// ============================================================
// Types
// ============================================================

export interface ScriptStep {
  aiText: string;
  thinkDuration: number;
  card?: DraftCardData;
  /** Clickable option buttons shown below the AI message */
  options?: string[];
}

export interface ConversationScript {
  /** Regex patterns that trigger this script */
  triggers: RegExp[];
  /** Steps in the conversation (multi-step for low-context) */
  steps: ScriptStep[];
  /**
   * If true, step 2 is resolved dynamically by matching user text
   * against subIntentMap (used for Scenario C info-update).
   */
  dynamicStep2?: boolean;
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
  infoMessage: `${sickBalance?.available ?? 48} hrs Sick/Medical remaining · ${approver} will be notified`,
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
      type: 'date',
      value: '2026-02-20',
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
  triggers: [/friday/i, /day off/i, /time off/i],
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
  infoMessage: `Monthly budget remaining: $${budgetRemaining} · ${approver} will be notified`,
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
      type: 'date',
      value: '2026-02-17',
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
// Trigger: "update" or "address" or "info" or "phone" or "emergency"
// Step 1: AI asks what to update
// Step 2: Dynamically picks card based on user reply
// ============================================================

// Card: Update Home Address
const addressCard: DraftCardData = {
  id: 'card-info-address',
  actionType: 'info-update',
  title: 'Update Home Address',
  icon: 'location-dot',
  meta: 'This will update your address on file',
  infoMessage: `Your manager ${approver} will be notified of this change`,
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

// Card: Update Phone Number
const phoneCard: DraftCardData = {
  id: 'card-info-phone',
  actionType: 'info-update',
  title: 'Update Phone Number',
  icon: 'phone',
  meta: 'This will update your phone number on file',
  infoMessage: `Your manager ${approver} will be notified of this change`,
  fields: [
    {
      id: 'phone',
      label: 'Phone',
      type: 'text',
      value: ctx.employee.phone,
      status: 'prefilled',
      placeholder: '(801) 555-0000',
    },
  ],
  state: 'draft',
  submittedSummary: `Phone number updated`,
};

// Card: Update Emergency Contact
const emergencyContactCard: DraftCardData = {
  id: 'card-info-emergency',
  actionType: 'info-update',
  title: 'Update Emergency Contact',
  icon: 'circle-user',
  meta: 'This will update your emergency contact on file',
  infoMessage: `Your manager ${approver} will be notified of this change`,
  fields: [
    {
      id: 'ec-name',
      label: 'Name',
      type: 'text',
      value: emergencyContact.name,
      status: 'prefilled',
    },
    {
      id: 'ec-relationship',
      label: 'Relationship',
      type: 'select',
      value: emergencyContact.relationship,
      status: 'prefilled',
      options: [
        { label: 'Spouse', value: 'Spouse' },
        { label: 'Parent', value: 'Parent' },
        { label: 'Sibling', value: 'Sibling' },
        { label: 'Child', value: 'Child' },
        { label: 'Friend', value: 'Friend' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      id: 'ec-phone',
      label: 'Phone',
      type: 'text',
      value: emergencyContact.phone,
      status: 'prefilled',
      placeholder: '(801) 555-0000',
    },
  ],
  state: 'draft',
  submittedSummary: `Emergency contact updated to ${emergencyContact.name}`,
};

/**
 * Sub-intent detection for Scenario C step 2.
 * Each entry: [regex patterns to match, ScriptStep to show].
 */
export const infoSubIntents: Array<{
  patterns: RegExp[];
  step: ScriptStep;
}> = [
  {
    patterns: [/phone/i, /number/i, /cell/i, /mobile/i],
    step: {
      aiText: "Here's your current phone number — update it and hit submit:",
      thinkDuration: 1000,
      card: phoneCard,
    },
  },
  {
    patterns: [/emergency/i, /contact/i],
    step: {
      aiText: "Here's your current emergency contact — update whatever's changed:",
      thinkDuration: 1000,
      card: emergencyContactCard,
    },
  },
  {
    patterns: [/address/i, /street/i, /move/i, /moved/i, /home/i],
    step: {
      aiText: "Here's your current address — update whatever's changed:",
      thinkDuration: 1000,
      card: addressCard,
    },
  },
];

// Default if no sub-intent matches in step 2
export const infoDefaultStep: ScriptStep = {
  aiText: "Here's your current address — update whatever's changed:",
  thinkDuration: 1000,
  card: addressCard,
};

export const infoUpdateScript: ConversationScript = {
  triggers: [/update/i, /address/i, /info/i, /phone/i, /emergency/i],
  steps: [
    {
      aiText: "Sure! What do you need to update?",
      thinkDuration: 1000,
      options: ['Update my address', 'Update my phone', 'Update emergency contact'],
    },
    // Step 2 is a placeholder — dynamically resolved in useChat
    {
      aiText: '',
      thinkDuration: 1000,
    },
  ],
  dynamicStep2: true,
};

// ============================================================
// Fallback
// ============================================================

export const fallbackResponse: ScriptStep = {
  aiText: "What can I help you with?",
  thinkDuration: 500,
  options: ['Request time off', 'Submit an expense', 'Update my info'],
};

// ============================================================
// All scripts for matching
// ============================================================

export const allScripts: ConversationScript[] = [
  timeOffScript,
  expenseScript,
  infoUpdateScript,
];
