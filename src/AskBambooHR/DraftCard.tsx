import { useState, useRef, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { InlineField } from './InlineField';
import { SubmittedCard } from './SubmittedCard';
import type { DraftCardData, DraftField } from './types';
import './DraftCard.css';

// ─── Date Helpers (shared between summary + validation) ───

/** Parse a date value (ISO YYYY-MM-DD or MM/DD/YYYY) into a Date object */
function parseDateValue(value: string): Date | null {
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

/** Format a date string as readable text */
function formatDateDisplay(value: string): string {
  const date = parseDateValue(value);
  return date ? formatReadableDate(date) : value;
}

/** Get a field value from a fields array by ID pattern */
function getFieldValue(fields: DraftField[], ...patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const field = fields.find(f => pattern.test(f.id) || pattern.test(f.label));
    if (field && field.value.trim()) return field.value;
  }
  return '';
}

/** Format a field value for display in summary rows */
function formatFieldDisplay(field: DraftField): string {
  if (field.type === 'date') return formatDateDisplay(field.value);
  if (field.type === 'currency') {
    const val = field.value.trim();
    return val.startsWith('$') ? val : `$${val}`;
  }
  return field.value;
}

// ─── Submit button label based on card type ───

function getSubmitLabel(card: DraftCardData): string {
  switch (card.actionType) {
    case 'time-off': return 'Submit Request';
    case 'expense': return 'Submit Expense';
    case 'info-update': return 'Submit Update';
    default: return 'Submit';
  }
}

// ─── Summary row builders per card type ───

interface SummaryRow {
  label: string;
  value: string;
}

function buildPTOSummaryRows(fields: DraftField[]): SummaryRow[] {
  const rows: SummaryRow[] = [];
  const type = getFieldValue(fields, /type/i);
  if (type) rows.push({ label: 'Type', value: type });

  const startRaw = getFieldValue(fields, /start/i);
  const endRaw = getFieldValue(fields, /end/i);
  const startDate = startRaw ? parseDateValue(startRaw) : null;
  const endDate = endRaw ? parseDateValue(endRaw) : null;

  if (startDate && endDate) {
    const isSameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();
    const dateDisplay = isSameDay
      ? formatReadableDate(startDate)
      : `${formatReadableDate(startDate)} – ${formatReadableDate(endDate)}`;
    rows.push({ label: 'Date', value: dateDisplay });
  } else if (startDate) {
    rows.push({ label: 'Date', value: formatReadableDate(startDate) });
  }

  const hoursRaw = getFieldValue(fields, /hours/i, /duration/i);
  if (hoursRaw) {
    const num = parseFloat(hoursRaw);
    rows.push({ label: 'Hours', value: !isNaN(num) ? `${num} hrs` : hoursRaw });
  } else {
    rows.push({ label: 'Hours', value: '8 hrs' });
  }

  const note = getFieldValue(fields, /note/i);
  if (note) rows.push({ label: 'Note', value: note });

  return rows;
}

function buildExpenseSummaryRows(fields: DraftField[]): SummaryRow[] {
  const rows: SummaryRow[] = [];
  const category = getFieldValue(fields, /category/i);
  if (category) rows.push({ label: 'Category', value: category });

  const amount = getFieldValue(fields, /amount/i);
  if (amount) rows.push({ label: 'Amount', value: amount.startsWith('$') ? amount : `$${amount}` });

  const date = getFieldValue(fields, /date/i);
  if (date) rows.push({ label: 'Date', value: formatDateDisplay(date) });

  const merchant = getFieldValue(fields, /merchant|vendor/i);
  if (merchant) rows.push({ label: 'Merchant', value: merchant });

  const desc = getFieldValue(fields, /description|desc/i);
  if (desc) rows.push({ label: 'Description', value: desc });

  return rows;
}

function buildAddressSummaryRows(fields: DraftField[]): SummaryRow[] {
  const rows: SummaryRow[] = [];
  const street = getFieldValue(fields, /street/i);
  if (street) rows.push({ label: 'Street', value: street });

  const apt = getFieldValue(fields, /apt|unit|apartment/i);
  if (apt) rows.push({ label: 'Apt/Unit', value: apt });

  const city = getFieldValue(fields, /city/i);
  if (city) rows.push({ label: 'City', value: city });

  const state = getFieldValue(fields, /state/i);
  if (state) rows.push({ label: 'State', value: state });

  const zip = getFieldValue(fields, /zip/i);
  if (zip) rows.push({ label: 'ZIP', value: zip });

  return rows;
}

function buildPhoneSummaryRows(fields: DraftField[]): SummaryRow[] {
  const rows: SummaryRow[] = [];

  // Match type FIRST — look for field with id "phoneType" or label "Type"
  const typeField = fields.find(f => /phoneType/i.test(f.id) || /^type$/i.test(f.label));
  const typeValue = typeField?.value?.trim() || '';
  if (typeValue) rows.push({ label: 'Type', value: typeValue });

  // Match phone number — look for field with id "phone" (exact) or label "Phone"
  // Exclude the phoneType field to avoid showing "Mobile" in the Phone row
  const phoneField = fields.find(f =>
    f !== typeField && (/^phone$/i.test(f.id) || /phone/i.test(f.label))
  );
  const phoneValue = phoneField?.value?.trim() || '';
  if (phoneValue) rows.push({ label: 'Phone', value: phoneValue });

  return rows;
}

function buildEmergencyContactSummaryRows(fields: DraftField[]): SummaryRow[] {
  const rows: SummaryRow[] = [];
  const name = getFieldValue(fields, /name/i);
  if (name) rows.push({ label: 'Name', value: name });

  const rel = getFieldValue(fields, /relationship/i);
  if (rel) rows.push({ label: 'Relationship', value: rel });

  const phone = getFieldValue(fields, /phone/i);
  if (phone) rows.push({ label: 'Phone', value: phone });

  return rows;
}

/** Build summary rows for any card type, falling back to generic rows */
function buildSummaryRows(card: DraftCardData): SummaryRow[] {
  const title = card.title.toLowerCase();

  if (card.actionType === 'time-off' || title.includes('time off')) {
    return buildPTOSummaryRows(card.fields);
  }
  if (card.actionType === 'expense' || title.includes('expense')) {
    return buildExpenseSummaryRows(card.fields);
  }
  if (title.includes('address')) {
    return buildAddressSummaryRows(card.fields);
  }
  if (title.includes('phone')) {
    return buildPhoneSummaryRows(card.fields);
  }
  if (title.includes('emergency')) {
    return buildEmergencyContactSummaryRows(card.fields);
  }

  // Generic fallback — show all non-empty fields as summary rows
  return card.fields
    .filter(f => f.value.trim() && f.type !== 'file')
    .map(f => ({
      label: f.label,
      value: formatFieldDisplay(f),
    }));
}

// ─── Summary View Component (shared by all card types) ───

interface SummaryViewProps {
  card: DraftCardData;
  onSubmit: () => void;
  onEdit: () => void;
  isSubmitting: boolean;
}

function SummaryView({ card, onSubmit, onEdit, isSubmitting }: SummaryViewProps) {
  const rows = buildSummaryRows(card);
  const submitLabel = getSubmitLabel(card);

  return (
    <div className={`draft-card draft-card--summary ${isSubmitting ? 'draft-card--submitting' : ''}`}>
      {/* Header */}
      <div className="draft-card__header">
        <Icon name={card.icon as any} size={16} className="draft-card__header-icon" />
        <span className="draft-card__header-title">{card.title}</span>
      </div>

      {/* Summary rows */}
      <div className="draft-card__summary-body">
        {rows.map((row, i) => (
          <div key={i} className="draft-card__summary-row">
            <span className="draft-card__summary-label">{row.label}</span>
            <span className="draft-card__summary-value">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Info Message */}
      {card.infoMessage && (
        <div className={`draft-card__info ${card.infoWarning ? 'draft-card__info--warning' : ''}`}>
          <Icon
            name={card.infoWarning ? 'triangle-exclamation' : 'circle-info'}
            size={14}
            className="draft-card__info-icon"
          />
          <span className="draft-card__info-text">{card.infoMessage}</span>
        </div>
      )}

      {/* Action Bar — Submit + Edit side-by-side */}
      <div className="draft-card__action draft-card__action--split">
        <Button variant="primary" size="small" onClick={onSubmit} className="draft-card__submit-btn">
          {submitLabel}
        </Button>
        <Button variant="outlined" size="small" onClick={onEdit} className="draft-card__edit-btn">
          Edit
        </Button>
      </div>
    </div>
  );
}

// ─── Main DraftCard Component ───

interface DraftCardProps {
  card: DraftCardData;
  onFieldUpdate: (cardId: string, fieldId: string, value: string) => void;
  onSubmit: (cardId: string) => void;
}

export function DraftCard({ card, onFieldUpdate, onSubmit }: DraftCardProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevStateRef = useRef(card.state);
  const [isCollapsing, setIsCollapsing] = useState(false);

  // ALL card types start in 'summary' mode
  const [viewMode, setViewMode] = useState<'summary' | 'edit'>('summary');

  // Snapshot of field values when entering edit mode, so Cancel can revert
  const savedFieldsRef = useRef<Record<string, string> | null>(null);

  // Detect the draft → dismissed transition and trigger the fade animation
  useEffect(() => {
    if (prevStateRef.current === 'draft' && card.state === 'dismissed') {
      setIsCollapsing(true);
    }
    prevStateRef.current = card.state;
  }, [card.state]);

  if (card.state === 'submitted') {
    return <SubmittedCard card={card} />;
  }

  // Dismissed state — collapsed to header-only, dimmed at 40% opacity, non-interactive
  if (card.state === 'dismissed') {
    return (
      <div
        className={`draft-card draft-card--dismissed ${isCollapsing ? 'draft-card--collapsing' : ''}`}
        onAnimationEnd={() => setIsCollapsing(false)}
      >
        {/* Header with "Not submitted" label — collapsed, no body/fields */}
        <div className="draft-card__header draft-card__header--dismissed">
          <Icon name={card.icon as any} size={14} className="draft-card__header-icon" />
          <span className="draft-card__header-title">{card.title}</span>
          <span className={`draft-card__dismissed-label ${isCollapsing ? 'draft-card__dismissed-label--animating' : ''}`}>
            Not submitted
          </span>
        </div>
      </div>
    );
  }

  // ─── Validation ───

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    card.fields.forEach(field => {
      if (field.required && !field.value.trim()) {
        if (field.type === 'currency') {
          newErrors[field.id] = 'Enter a valid amount';
        } else {
          newErrors[field.id] = 'Required';
        }
      }
      if (field.type === 'currency' && field.value.trim()) {
        const num = parseFloat(field.value.replace(/[$,]/g, ''));
        if (isNaN(num) || num <= 0) {
          newErrors[field.id] = 'Enter a valid amount';
        }
      }
    });

    // Cross-field date validation: end date must be on or after start date
    const dateFields = card.fields.filter(f => f.type === 'date');
    if (dateFields.length >= 2) {
      const startField = dateFields.find(f =>
        /start|from|begin/i.test(f.id) || /start|from|begin/i.test(f.label)
      ) || dateFields[0];
      const endField = dateFields.find(f =>
        /end|to|until|through/i.test(f.id) || /end|to|until|through/i.test(f.label)
      ) || dateFields[1];

      if (startField && endField && startField.value && endField.value) {
        const startDate = parseDateValue(startField.value);
        const endDate = parseDateValue(endField.value);
        if (startDate && endDate && endDate < startDate) {
          newErrors[endField.id] = 'End date must be after start date';
        }
      }
    }

    return newErrors;
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    onFieldUpdate(card.id, fieldId, value);
    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleSubmit = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      // If in summary mode and there are errors, switch to edit mode to show them
      if (viewMode === 'summary') {
        setViewMode('edit');
        savedFieldsRef.current = Object.fromEntries(card.fields.map(f => [f.id, f.value]));
      }
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(card.id);
    }, 250);
  };

  const handleEdit = () => {
    // Save current field values so Cancel can revert
    savedFieldsRef.current = Object.fromEntries(card.fields.map(f => [f.id, f.value]));
    setErrors({});
    setViewMode('edit');
  };

  const handleCancel = () => {
    // Revert field values to what they were before editing
    if (savedFieldsRef.current) {
      for (const field of card.fields) {
        const savedValue = savedFieldsRef.current[field.id];
        if (savedValue !== undefined && savedValue !== field.value) {
          onFieldUpdate(card.id, field.id, savedValue);
        }
      }
      savedFieldsRef.current = null;
    }
    setErrors({});
    setViewMode('summary');
  };

  // ─── Summary mode (all card types) ───

  if (viewMode === 'summary') {
    return (
      <SummaryView
        card={card}
        onSubmit={handleSubmit}
        onEdit={handleEdit}
        isSubmitting={isSubmitting}
      />
    );
  }

  // ─── Edit mode (after clicking Edit) ───

  const submitLabel = getSubmitLabel(card);

  // Find the first needs-input field for auto-focus
  const firstNeedsInputId = card.fields.find(
    f => f.status === 'needs-input' && !f.value.trim() && f.type !== 'file',
  )?.id;

  return (
    <div className={`draft-card draft-card--edit ${isSubmitting ? 'draft-card--submitting' : ''}`}>
      {/* Header */}
      <div className="draft-card__header">
        <Icon name={card.icon as any} size={16} className="draft-card__header-icon" />
        <span className="draft-card__header-title">{card.title}</span>
      </div>

      {/* Fields — stacked layout */}
      <div className="draft-card__fields">
        {card.fields.map(field => (
          <InlineField
            key={field.id}
            field={field}
            error={errors[field.id]}
            onChange={value => handleFieldChange(field.id, value)}
            autoFocus={field.id === firstNeedsInputId}
          />
        ))}
      </div>

      {/* Info Message — warning variant uses yellow/amber style */}
      {card.infoMessage && (
        <div className={`draft-card__info ${card.infoWarning ? 'draft-card__info--warning' : ''}`}>
          <Icon
            name={card.infoWarning ? 'triangle-exclamation' : 'circle-info'}
            size={14}
            className="draft-card__info-icon"
          />
          <span className="draft-card__info-text">{card.infoMessage}</span>
        </div>
      )}

      {/* Action Bar — Submit + Cancel */}
      <div className="draft-card__action draft-card__action--split">
        <Button variant="primary" size="small" onClick={handleSubmit} className="draft-card__submit-btn">
          {submitLabel}
        </Button>
        <Button variant="outlined" size="small" onClick={handleCancel} className="draft-card__cancel-btn">
          Cancel
        </Button>
      </div>
    </div>
  );
}
