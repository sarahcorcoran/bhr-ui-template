import { useRef, useEffect } from 'react';
import { ChatBubble, AiBubbleWithCard } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import { DraftCard } from '../DraftCard';
import type { ChatMessage } from '../DraftCard/types';
import './MessageList.css';

interface MessageListProps {
  messages: ChatMessage[];
  isThinking: boolean;
  onFieldUpdate: (cardId: string, fieldId: string, value: string) => void;
  onCardSubmit: (cardId: string) => void;
}

export function MessageList({ messages, isThinking, onFieldUpdate, onCardSubmit }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or thinking
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

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
          <ChatBubble key={msg.id} role="assistant">
            {msg.text}
          </ChatBubble>
        );
      })}

      {isThinking && <TypingIndicator />}
    </div>
  );
}
