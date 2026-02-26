import { useState, useRef, useEffect } from 'react';
import './ChatInput.css';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

/** Circle with upward arrow — filled when active, outlined when inactive */
function SendIcon({ active }: { active: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="14"
        cy="14"
        r="13"
        fill={active ? 'var(--color-primary-strong)' : 'none'}
        stroke={active ? 'none' : 'var(--border-neutral-medium)'}
        strokeWidth="1.5"
      />
      <path
        d="M14 19V10M14 10L10 14M14 10L18 14"
        stroke={active ? '#fff' : 'var(--icon-neutral-medium, var(--text-neutral-medium))'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [value]);

  const send = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const hasText = value.trim().length > 0;

  return (
    <div className="chat-input">
      {/* Clean rounded pill input — matches expanded view */}
      <div className="chat-input__pill">
        <textarea
          ref={textareaRef}
          className="chat-input__textarea"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={disabled}
          rows={1}
        />
        <button
          className="chat-input__send"
          onClick={send}
          disabled={disabled || !hasText}
          aria-label="Send"
          type="button"
        >
          <SendIcon active={hasText} />
        </button>
      </div>
    </div>
  );
}
