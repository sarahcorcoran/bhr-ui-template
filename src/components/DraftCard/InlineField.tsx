import { useState, useRef, useEffect } from 'react';
import type { DraftField } from './types';
import './InlineField.css';

interface InlineFieldProps {
  field: DraftField;
  error?: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

export function InlineField({ field, error, onChange, autoFocus }: InlineFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const needsInput = field.status === 'needs-input' && !field.value.trim();
  const isFile = field.type === 'file';

  // Auto-focus for needs-input currency/text fields
  useEffect(() => {
    if (autoFocus && needsInput && !isFile) {
      setIsEditing(true);
    }
  }, [autoFocus, needsInput, isFile]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (isFile) return; // file field has its own click handler
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  const handleFileClick = () => {
    // Simulate file upload: set a dummy value
    onChange('receipt-photo.jpg');
  };

  // ─── File Upload Field ───
  if (isFile) {
    const hasFile = field.value.trim() !== '';
    return (
      <div className={`ifield ${error ? 'ifield--error' : ''} ${needsInput ? 'ifield--needs-input' : ''}`}>
        <div className="ifield__label">
          {field.label}
          {field.required && <span className="ifield__req">*</span>}
        </div>
        <div className="ifield__value">
          {hasFile ? (
            <span className="ifield__file-name">{field.value}</span>
          ) : (
            <button className="ifield__upload-btn" onClick={handleFileClick}>
              {field.placeholder || 'Tap to upload'}
            </button>
          )}
        </div>
        {error && <span className="ifield__error">{error}</span>}
      </div>
    );
  }

  // ─── Select Field ───
  if (field.type === 'select' && isEditing) {
    return (
      <div className="ifield ifield--editing">
        <div className="ifield__label">
          {field.label}
          {field.required && <span className="ifield__req">*</span>}
        </div>
        <div className="ifield__value">
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            className="ifield__select"
            value={field.value}
            onChange={e => { onChange(e.target.value); setIsEditing(false); }}
            onBlur={handleBlur}
          >
            {!field.value && <option value="">Select...</option>}
            {field.options?.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // ─── Text/Currency/Date Input ───
  if (isEditing) {
    return (
      <div className="ifield ifield--editing">
        <div className="ifield__label">
          {field.label}
          {field.required && <span className="ifield__req">*</span>}
        </div>
        <div className="ifield__value">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className="ifield__input"
            type="text"
            value={field.value}
            placeholder={field.placeholder}
            onChange={e => {
              let v = e.target.value;
              if (field.type === 'currency') v = v.replace(/[^0-9.$]/g, '');
              onChange(v);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            inputMode={field.type === 'currency' ? 'decimal' : undefined}
          />
        </div>
        {error && <span className="ifield__error">{error}</span>}
      </div>
    );
  }

  // ─── Display Mode ───
  const isEmpty = !field.value.trim();
  const isSelect = field.type === 'select';

  const rowClass = [
    'ifield',
    needsInput ? 'ifield--needs-input' : '',
    error ? 'ifield--error' : '',
    isSelect ? 'ifield--select' : 'ifield--text',
  ].filter(Boolean).join(' ');

  return (
    <div className={rowClass} onClick={handleClick}>
      <div className="ifield__label">
        {field.label}
        {field.required && <span className="ifield__req">*</span>}
      </div>
      <div className="ifield__value">
        <span className={`ifield__display ${isEmpty ? 'ifield__display--empty' : ''}`}>
          {isEmpty ? (field.placeholder || 'Tap to enter') : field.value}
        </span>
        {isSelect && <span className="ifield__chevron">&#9662;</span>}
      </div>
      {error && <span className="ifield__error">{error}</span>}
    </div>
  );
}
