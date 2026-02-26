// Types for the Draft Receipt Card

export type ActionType = 'time-off' | 'expense' | 'info-update';

export type FieldType = 'text' | 'date' | 'select' | 'currency' | 'file';

export type FieldStatus = 'prefilled' | 'needs-input';

export interface FieldOption {
  label: string;
  value: string;
}

export interface DraftField {
  id: string;
  label: string;
  type: FieldType;
  value: string;
  status: FieldStatus;
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
}

export type CardState = 'draft' | 'submitted';

export interface DraftCardData {
  id: string;
  actionType: ActionType;
  title: string;
  icon: string;
  fields: DraftField[];
  meta: string;
  state: CardState;
  submittedSummary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  card?: DraftCardData;
  timestamp: number;
}
