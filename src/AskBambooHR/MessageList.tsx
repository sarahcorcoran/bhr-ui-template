import { useRef, useEffect } from 'react';
import { ChatBubble, AiBubbleWithCard } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import { DraftCard } from './DraftCard';
import { ErrorMessage } from './ErrorMessage';
import { WelcomeState } from './WelcomeState';
import type { ChatMessage } from './types';
import './MessageList.css';

interface MessageListProps {
  messages: ChatMessage[];
  isThinking: boolean;
  conversationStarted: boolean;
  onFieldUpdate: (cardId: string, fieldId: string, value: string) => void;
  onCardSubmit: (cardId: string) => void;
  onSend: (text: string) => void;
  onRetry: () => void;
}

export function MessageList({ messages, isThinking, conversationStarted, onFieldUpdate, onCardSubmit, onSend, onRetry }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or thinking
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Show welcome state only when conversation has never been started
  if (!conversationStarted && messages.length === 0 && !isThinking) {
    return <WelcomeState onSend={onSend} />;
  }

  return (
    <div className="message-list" ref={scrollRef}>
      {messages.map(msg => {
        if (msg.role === 'user') {
          return (
            <ChatBubble key={msg.id} role="user">
              {msg.text}
            </ChatBubble>
          );
        }

        // Error message — distinct red bubble with retry button
        if (msg.isError) {
          return (
            <div key={msg.id} className="bubble-row bubble-row--ai">
              <ErrorMessage
                message={msg.text}
                onRetry={onRetry}
              />
            </div>
          );
        }

        // AI message with optional card
        if (msg.card) {
          return (
            <AiBubbleWithCard
              key={msg.id}
              text={msg.text}
              card={
                <DraftCard
                  card={msg.card}
                  onFieldUpdate={onFieldUpdate}
                  onSubmit={onCardSubmit}
                />
              }
            />
          );
        }

        return (
          <ChatBubble
            key={msg.id}
            role="assistant"
            options={msg.options}
            onOptionClick={(option) => onSend(option)}
          >
            {msg.text}
          </ChatBubble>
        );
      })}

      {isThinking && <TypingIndicator />}
    </div>
  );
}
