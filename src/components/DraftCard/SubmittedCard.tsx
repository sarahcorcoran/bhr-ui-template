import { Icon } from '../Icon';
import type { DraftCardData } from './types';
import { approver } from '../../data/employeeContext';
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

  // Build summary from card data or use pre-set summary
  const summary = card.submittedSummary || buildSummary(card);

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

function buildSummary(card: DraftCardData): string {
  return card.fields
    .filter(f => f.value.trim())
    .map(f => `${f.label}: ${f.value}`)
    .join(' · ');
}
