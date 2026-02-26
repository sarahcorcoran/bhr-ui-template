import { useState, useRef, useEffect } from 'react';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { FormDropdown } from '../components/FormDropdown';
import { CalendarPopup } from '../components/DatePicker/CalendarPopup';
import type { DraftField } from './types';
import './InlineField.css';

interface InlineFieldProps {
  field: DraftField;
  error?: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

/** Format an ISO date string (YYYY-MM-DD) or MM/DD/YYYY to a human-readable string */
function formatDateDisplay(value: string): string {
  if (!value) return '';
  // Try parsing ISO (YYYY-MM-DD) or MM/DD/YYYY
  let date: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [m, d, y] = value.split('/').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    return value; // Unknown format, show as-is
  }
  if (isNaN(date.getTime())) return value;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

/** Convert any date string to ISO YYYY-MM-DD for CalendarPopup compatibility */
function toISODate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [m, d, y] = value.split('/').map(Number);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return value;
}

export function InlineField({ field, error, onChange, autoFocus }: InlineFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Auto-focus for needs-input fields
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close calendar when clicking outside
  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const handleFileClick = () => {
    onChange('receipt-photo.jpg');
  };

  // ─── File Upload Field ───
  if (field.type === 'file') {
    const hasFile = field.value.trim() !== '';
    return (
      <div className={`sfield ${error ? 'sfield--error' : ''}`}>
        <label className="sfield__label">
          {field.label}
          {field.required && <span className="sfield__req">*</span>}
        </label>
        {hasFile ? (
          <div className="sfield__file-display">
            <span className="sfield__file-name">{field.value}</span>
          </div>
        ) : (
          <Button variant="outlined" size="small" onClick={handleFileClick}>
            {field.placeholder || 'Upload file'}
          </Button>
        )}
        {error && <span className="sfield__error">{error}</span>}
      </div>
    );
  }

  // ─── Select Field — uses FormDropdown from src/components ───
  if (field.type === 'select') {
    return (
      <div className={`sfield ${error ? 'sfield--error' : ''}`}>
        <FormDropdown
          label={field.required ? `${field.label} *` : field.label}
          options={field.options || []}
          value={field.value}
          onChange={(val) => onChange(val)}
          placeholder={field.placeholder || 'Select...'}
          className="sfield__dropdown"
        />
        {error && <span className="sfield__error">{error}</span>}
      </div>
    );
  }

  // ─── Date Field — uses CalendarPopup from src/components ───
  if (field.type === 'date') {
    const displayValue = formatDateDisplay(field.value);
    return (
      <div className={`sfield ${error ? 'sfield--error' : ''}`} ref={calendarRef}>
        <label className="sfield__label">
          {field.label}
          {field.required && <span className="sfield__req">*</span>}
        </label>
        <button
          type="button"
          className="sfield__date-input"
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        >
          <span className={displayValue ? 'sfield__date-value' : 'sfield__date-placeholder'}>
            {displayValue || field.placeholder || 'Select date'}
          </span>
          <Icon name="calendar" size={16} className="sfield__date-icon" />
        </button>
        {isCalendarOpen && (
          <div className="sfield__calendar-popup">
            <CalendarPopup
              value={toISODate(field.value)}
              onChange={(newValue) => {
                onChange(newValue);
                setIsCalendarOpen(false);
              }}
              onClose={() => setIsCalendarOpen(false)}
            />
          </div>
        )}
        {error && <span className="sfield__error">{error}</span>}
      </div>
    );
  }

  // ─── Text / Currency Input ───
  const isHoursField = /^(hours|duration)$/i.test(field.id);
  const inputMode = field.type === 'currency' || isHoursField ? 'decimal' : undefined;

  return (
    <div className={`sfield ${error ? 'sfield--error' : ''}`}>
      <label className="sfield__label">
        {field.label}
        {field.required && <span className="sfield__req">*</span>}
      </label>
      {isHoursField ? (
        <div className="sfield__input-with-suffix">
          <input
            ref={autoFocus ? inputRef : undefined}
            className="sfield__input sfield__input--with-suffix"
            type="text"
            value={field.value}
            placeholder={field.placeholder || '8'}
            onChange={e => {
              const v = e.target.value.replace(/[^0-9.]/g, '');
              onChange(v);
            }}
            inputMode={inputMode}
          />
          <span className="sfield__suffix">hrs</span>
        </div>
      ) : (
        <input
          ref={autoFocus ? inputRef : undefined}
          className="sfield__input"
          type="text"
          value={field.value}
          placeholder={field.placeholder}
          onChange={e => {
            let v = e.target.value;
            if (field.type === 'currency') v = v.replace(/[^0-9.$]/g, '');
            onChange(v);
          }}
          inputMode={inputMode}
        />
      )}
      {error && <span className="sfield__error">{error}</span>}
    </div>
  );
}
