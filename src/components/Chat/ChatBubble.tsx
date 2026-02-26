import type { ReactNode } from 'react';
import './ChatBubble.css';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  children: ReactNode;
}

export function ChatBubble({ role, children }: ChatBubbleProps) {
  if (role === 'user') {
    return (
      <div className="bubble-row bubble-row--user">
        <div className="bubble bubble--user">{children}</div>
      </div>
    );
  }

  return (
    <div className="bubble-row bubble-row--ai">
      <div className="bubble-avatar">B</div>
      <div className="bubble-content">
        <div className="bubble bubble--ai">{children}</div>
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
      <div className="bubble-avatar">B</div>
      <div className="bubble-content">
        {text && <div className="bubble bubble--ai">{text}</div>}
        <div className="bubble-card-slot">{card}</div>
      </div>
    </div>
  );
}
