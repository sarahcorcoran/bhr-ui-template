import { Icon } from '../Icon';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChat } from '../../hooks/useChat';
import './ChatContainer.css';

export function ChatContainer() {
  const { messages, isThinking, sendMessage, updateField, submitCard, clearChat } = useChat();

  return (
    <div className="chat-shell">
      {/* Header */}
      <div className="chat-shell__header">
        <div className="chat-shell__header-left">
          <div className="chat-shell__logo">B</div>
          <span className="chat-shell__title">AskBambooHR</span>
        </div>
        <button className="chat-shell__clear" onClick={clearChat}>
          Clear chat
        </button>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isThinking={isThinking}
        onFieldUpdate={updateField}
        onCardSubmit={submitCard}
      />

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isThinking} />
    </div>
  );
}
