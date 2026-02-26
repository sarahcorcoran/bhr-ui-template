import { useState, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { DebugPanel } from './DebugPanel';
import { useChat } from './useChat';
import { useDebugLog } from './useDebugLog';
import { isDemoMode } from './goldenPaths';
import './ChatContainer.css';

export function ChatContainer() {
  const [debugOpen, setDebugOpen] = useState(false);
  const debugLog = useDebugLog();
  const demoMode = useMemo(() => isDemoMode(), []);
  const { messages, isThinking, conversationStarted, sendMessage, updateField, submitCard, retryLastMessage } = useChat(debugLog, demoMode);

  // Toggle debug panel with Ctrl+Shift+D (or Cmd+Shift+D on Mac)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setDebugOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`chat-shell ${debugOpen ? 'chat-shell--debug-open' : ''}`}>
      {/* Outer container — matches AIChatPanel panel shell */}
      <div className="chat-shell__inner">
        {/* Header — matches AIChatPanel collapsed header */}
        <div className="chat-shell__header">
          <div className="chat-shell__header-left">
            <button className="chat-shell__header-btn" aria-label="Menu">
              <Icon name="bars" size={16} className="chat-shell__header-icon" />
            </button>
          </div>
          <div className="chat-shell__header-right">
            <button className="chat-shell__header-btn" aria-label="Expand">
              <Icon name="maximize-2" size={16} className="chat-shell__header-icon" />
            </button>
            <button className="chat-shell__header-btn" aria-label="Close">
              <Icon name="xmark" size={16} className="chat-shell__header-icon" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          isThinking={isThinking}
          conversationStarted={conversationStarted}
          onFieldUpdate={updateField}
          onCardSubmit={submitCard}
          onSend={sendMessage}
          onRetry={retryLastMessage}
        />

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isThinking} />
      </div>

      {/* Debug Panel — slides in from the right */}
      {debugOpen && (
        <div className="chat-shell__debug">
          <DebugPanel entries={debugLog.entries} onClear={debugLog.clearEntries} />
        </div>
      )}
    </div>
  );
}
