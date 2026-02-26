import { Icon } from '../components/Icon';
import type { DraftCardData } from './types';
import { approver } from './employeeContext';
import './SubmittedCard.css';

interface SubmittedCardProps {
  card: DraftCardData;
}

const ACTION_LABELS: Record<string, string> = {
  'time-off': 'Time Off Request',
  'expense': 'Expense Report',
  'info-update': 'Info Update',
};

export function SubmittedCard({ card }: SubmittedCardProps) {
  const label = ACTION_LABELS[card.actionType] || card.title;

  // Build natural language summary from card data or use pre-set summary
  const summary = card.submittedSummary || buildNaturalSummary(card);

  return (
    <div className="submitted-card">
      <div className="submitted-card__icon">
        <Icon name="check-circle" size={20} />
      </div>
      <div className="submitted-card__heading">{label} Submitted</div>
      <div className="submitted-card__summary">{summary}</div>
      <div className="submitted-card__approver">
        Sent to {approver} for approval
      </div>
    </div>
  );
}

// ─── Date Formatting Helpers ───

/** Parse an ISO (YYYY-MM-DD) or US (MM/DD/YYYY) date string into a Date object */
function parseDate(value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [m, d, y] = value.split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
}

/** Format a Date as "Friday, Feb 23" */
function formatReadableDate(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

/** Format a date string as readable text, or return as-is if unparseable */
function formatDateValue(value: string): string {
  const date = parseDate(value);
  return date ? formatReadableDate(date) : value;
}

/** Get a field value by ID pattern (case-insensitive) */
function getFieldValue(card: DraftCardData, ...patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const field = card.fields.find(f => pattern.test(f.id) || pattern.test(f.label));
    if (field && field.value.trim()) return field.value;
  }
  return '';
}

// ─── Natural Language Summary Builders ───

function buildTimeOffSummary(card: DraftCardData): string {
  const type = getFieldValue(card, /type/i) || 'Time off';
  const hoursRaw = getFieldValue(card, /hours/i, /duration/i) || '';
  const startDateRaw = getFieldValue(card, /start/i);
  const endDateRaw = getFieldValue(card, /end/i);
  const note = getFieldValue(card, /note/i);

  const startDate = startDateRaw ? parseDate(startDateRaw) : null;
  const endDate = endDateRaw ? parseDate(endDateRaw) : null;

  // Format hours as a readable label: "8" → "8 hrs", "4" → "4 hrs"
  let hoursLabel = '8 hrs';
  if (hoursRaw) {
    const num = parseFloat(hoursRaw);
    if (!isNaN(num)) {
      hoursLabel = `${num} hrs`;
    } else {
      hoursLabel = hoursRaw; // Use as-is if not a number
    }
  }

  // Build the date range portion
  let dateStr = '';
  if (startDate && endDate) {
    const isSameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();

    if (isSameDay) {
      dateStr = `on ${formatReadableDate(startDate)}`;
    } else {
      dateStr = `${formatReadableDate(startDate)} – ${formatReadableDate(endDate)}`;
    }
  } else if (startDate) {
    dateStr = `on ${formatReadableDate(startDate)}`;
  }

  let summary = `${hoursLabel} of ${type} ${dateStr}`.trim();
  if (note) {
    summary += ` — ${note}`;
  }
  return summary;
}

function buildExpenseSummary(card: DraftCardData): string {
  const category = getFieldValue(card, /category/i) || 'Expense';
  const amount = getFieldValue(card, /amount/i) || '';
  const description = getFieldValue(card, /description|desc/i) || '';

  let summary = category;
  if (amount) {
    // Ensure $ prefix
    const formattedAmount = amount.startsWith('$') ? amount : `$${amount}`;
    summary += ` — ${formattedAmount}`;
  }
  if (description) {
    summary += ` (${description})`;
  }
  return summary;
}

function buildAddressUpdateSummary(card: DraftCardData): string {
  const street = getFieldValue(card, /street/i);
  const city = getFieldValue(card, /city/i);
  const state = getFieldValue(card, /state/i);
  const zip = getFieldValue(card, /zip/i);

  const parts = [street, city, state && zip ? `${state} ${zip}` : state || zip].filter(Boolean);
  return parts.length > 0 ? `Updated to ${parts.join(', ')}` : 'Address updated';
}

function buildPhoneUpdateSummary(card: DraftCardData): string {
  const phone = getFieldValue(card, /phone/i);
  return phone ? `Updated to ${phone}` : 'Phone updated';
}

function buildEmergencyContactSummary(card: DraftCardData): string {
  const name = getFieldValue(card, /name/i);
  const relationship = getFieldValue(card, /relationship/i);
  const phone = getFieldValue(card, /phone/i);

  let summary = 'Updated';
  if (name) {
    summary = `Updated ${name}`;
    if (relationship) summary += ` (${relationship})`;
    if (phone) summary += ` — ${phone}`;
  }
  return summary;
}

// ─── Main Summary Router ───

function buildNaturalSummary(card: DraftCardData): string {
  // Route based on card title (which carries the cardType context)
  const title = card.title.toLowerCase();

  if (card.actionType === 'time-off' || title.includes('time off')) {
    return buildTimeOffSummary(card);
  }
  if (card.actionType === 'expense' || title.includes('expense')) {
    return buildExpenseSummary(card);
  }
  if (title.includes('address')) {
    return buildAddressUpdateSummary(card);
  }
  if (title.includes('phone')) {
    return buildPhoneUpdateSummary(card);
  }
  if (title.includes('emergency')) {
    return buildEmergencyContactSummary(card);
  }

  // Generic fallback — still better than raw labels
  return card.fields
    .filter(f => f.value.trim() && f.type !== 'file')
    .map(f => {
      // Try to format dates even in fallback
      if (f.type === 'date') return formatDateValue(f.value);
      return f.value;
    })
    .join(' · ');
}
