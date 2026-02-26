import { useState } from 'react';
import { Icon } from '../Icon';
import { InlineField } from './InlineField';
import { SubmittedCard } from './SubmittedCard';
import type { DraftCardData } from './types';
import './DraftCard.css';

interface DraftCardProps {
  card: DraftCardData;
  onFieldUpdate: (cardId: string, fieldId: string, value: string) => void;
  onSubmit: (cardId: string) => void;
}

export function DraftCard({ card, onFieldUpdate, onSubmit }: DraftCardProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (card.state === 'submitted') {
    return <SubmittedCard card={card} />;
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    onFieldUpdate(card.id, fieldId, value);
    // Clear error when user edits
    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    card.fields.forEach(field => {
      if (field.required && !field.value.trim()) {
        if (field.type === 'currency') {
          newErrors[field.id] = 'Enter a valid amount';
        } else {
          newErrors[field.id] = 'Required';
        }
      }
      // Currency format validation
      if (field.type === 'currency' && field.value.trim()) {
        const num = parseFloat(field.value.replace(/[$,]/g, ''));
        if (isNaN(num) || num <= 0) {
          newErrors[field.id] = 'Enter a valid amount';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(card.id);
    }, 250);
  };

  // Find the first needs-input field for auto-focus
  const firstNeedsInputId = card.fields.find(
    f => f.status === 'needs-input' && !f.value.trim() && f.type !== 'file',
  )?.id;

  return (
    <div className={`draft-card ${isSubmitting ? 'draft-card--submitting' : ''}`}>
      {/* Header */}
      <div className="draft-card__header">
        <Icon name={card.icon as any} size={16} className="draft-card__header-icon" />
        <span className="draft-card__header-title">{card.title}</span>
        <span className="draft-card__header-hint">tap to edit</span>
      </div>

      {/* Fields */}
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

      {/* Meta */}
      {card.meta && (
        <div className="draft-card__meta">{card.meta}</div>
      )}

      {/* Action Bar */}
      <div className="draft-card__action">
        <button className="draft-card__submit" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}
