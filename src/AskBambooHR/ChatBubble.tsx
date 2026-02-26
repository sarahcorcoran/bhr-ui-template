import type { ReactNode } from 'react';
import './ChatBubble.css';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  children: ReactNode;
  /** Clickable option buttons (AI messages only) */
  options?: string[];
  onOptionClick?: (option: string) => void;
}

export function ChatBubble({ role, children, options, onOptionClick }: ChatBubbleProps) {
  if (role === 'user') {
    return (
      <div className="bubble-row bubble-row--user">
        <div className="bubble bubble--user">{children}</div>
      </div>
    );
  }

  // AI message — no avatar, left-aligned text
  return (
    <div className="bubble-row bubble-row--ai">
      <div className="bubble-content">
        <div className="bubble bubble--ai">{children}</div>
        {options && options.length > 0 && (
          <div className="bubble-options">
            {options.map(option => (
              <button
                key={option}
                type="button"
                className="suggestion-pill"
                onClick={() => onOptionClick?.(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** AI bubble that also renders a card beneath the text */
export function AiBubbleWithCard({
  text,
  card,
}: {
  text: string;
  card: ReactNode;
}) {
  return (
    <div className="bubble-row bubble-row--ai">
      <div className="bubble-content">
        {text && <div className="bubble bubble--ai">{text}</div>}
        <div className="bubble-card-slot">{card}</div>
      </div>
    </div>
  );
}
