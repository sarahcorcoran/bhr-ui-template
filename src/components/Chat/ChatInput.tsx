import { useState, useRef, useEffect } from 'react';
import { Icon } from '../Icon';
import './ChatInput.css';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
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
      <div className="chat-input__field">
        <textarea
          ref={textareaRef}
          className="chat-input__textarea"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask BambooHR anything..."
          disabled={disabled}
          rows={1}
        />
        <button
          className={`chat-input__send ${hasText ? 'chat-input__send--active' : ''}`}
          onClick={send}
          disabled={disabled || !hasText}
          aria-label="Send"
        >
          <Icon name="circle-arrow-up" size={28} />
        </button>
      </div>
    </div>
  );
}
