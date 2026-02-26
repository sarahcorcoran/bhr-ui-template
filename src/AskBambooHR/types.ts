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

export type CardState = 'draft' | 'submitted' | 'dismissed';

export interface DraftCardData {
  id: string;
  actionType: ActionType;
  title: string;
  icon: string;
  fields: DraftField[];
  meta: string;
  /** Contextual info message shown above the Submit button */
  infoMessage?: string;
  /** When true, the infoMessage is displayed as a yellow/amber warning instead of gray info */
  infoWarning?: boolean;
  state: CardState;
  submittedSummary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  card?: DraftCardData;
  /** Clickable option buttons shown below AI messages (e.g. clarifying questions) */
  options?: string[];
  timestamp: number;
  /** When true, message is rendered as an error bubble with retry button */
  isError?: boolean;
}

// ─── Debug Log Types ───

export type DebugEntryType = 'user' | 'api-request' | 'api-response' | 'tool-result' | 'error';

export interface DebugEntry {
  id: string;
  timestamp: number;
  type: DebugEntryType;
  /** Short summary label for collapsed view */
  label: string;
  /** Full payload data (JSON-serializable) */
  data: unknown;
  /** Duration in ms (for API responses) */
  duration?: number;
}
