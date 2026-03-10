import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../Icon';
import { recentConversations as initialConversations } from '../../data/chatData';
import type { ChatConversation, ChatMessage } from '../../data/chatData';
import MarkdownContent from '../MarkdownContent';
import { OmniResponse } from './OmniResponse';
import { useDemo } from '../../contexts/DemoContext';
import { scene4Intent } from '../../data/demoScriptData';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

const WELCOME_SUGGESTIONS = [
  'Request time off',
  'Submit an expense',
  'Update my info',
];

/** Send icon — filled circle when active, outlined when inactive (matches /ask style) */
function SendIcon({ active }: { active: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="14" cy="14" r="13"
        fill={active ? 'var(--color-primary-strong)' : 'none'}
        stroke={active ? 'none' : 'var(--border-neutral-medium)'}
        strokeWidth="1.5"
      />
      <path
        d="M14 19V10M14 10L10 14M14 10L18 14"
        stroke={active ? '#fff' : 'var(--icon-neutral-medium, var(--text-neutral-medium))'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

const ACTIVE_CONVERSATION_KEY = 'bhr-active-conversation';

function getInitialConversation(conversations: ChatConversation[]): ChatConversation {
  const storedId = sessionStorage.getItem(ACTIVE_CONVERSATION_KEY);
  if (storedId) {
    const found = conversations.find(c => c.id === storedId);
    if (found) return found;
  }
  return conversations[0];
}

/** Generate a short title from the user's first message (first 4–5 words) */
function generateTitle(message: string): string {
  const words = message.trim().split(/\s+/).filter(Boolean);
  const titleWords = words.slice(0, 5);
  let title = titleWords.join(' ');
  // Clean trailing punctuation that looks awkward as a title
  title = title.replace(/[,;:\-—]+$/, '');
  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }
  return title || 'Untitled Chat';
}

/** Shared conversation item with hover three-dot menu, inline rename, and delete */
function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
  isAnimatingTitle = false,
}: {
  conversation: ChatConversation;
  isActive: boolean;
  onSelect: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
  isAnimatingTitle?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(conversation.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);

  // Animate title write-in via Web Animations API
  useEffect(() => {
    if (isAnimatingTitle && titleRef.current) {
      titleRef.current.animate(
        [
          { opacity: 0, transform: 'translateX(-4px)', filter: 'blur(2px)' },
          { opacity: 1, transform: 'translateX(0)', filter: 'blur(0)' },
        ],
        { duration: 500, easing: 'ease-out', fill: 'forwards' }
      );
    }
  }, [isAnimatingTitle]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Auto-focus and select rename input
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const confirmRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed);
    } else {
      setRenameValue(conversation.title);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setRenameValue(conversation.title);
    setIsRenaming(false);
  };

  if (isRenaming) {
    return (
      <div className="w-full px-3 py-2.5">
        <input
          ref={renameInputRef}
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmRename();
            if (e.key === 'Escape') cancelRename();
          }}
          onBlur={confirmRename}
          className="w-full px-3 py-2 text-[15px] text-[var(--text-neutral-x-strong)] bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-weak)] rounded-[var(--radius-xx-small)] outline-none focus:border-[var(--color-primary-strong)]"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative group rounded-[var(--radius-xx-small)] transition-colors duration-150 ${
        isActive
          ? 'bg-[var(--surface-neutral-xx-weak)]'
          : 'hover:bg-[rgba(0,0,0,0.04)]'
      }`}
      ref={menuRef}
    >
      <button
        onClick={onSelect}
        className={`
          w-full text-left pl-3 pr-8 py-2.5
          text-[15px] text-[var(--text-neutral-x-strong)]
          truncate
          ${isActive ? 'font-semibold' : ''}
        `}
      >
        <span ref={titleRef} className="block truncate">
          {conversation.title}
        </span>
      </button>
      {/* Three-dot icon — visible on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-[var(--radius-xx-small)] hover:bg-[var(--surface-neutral-x-weak)] transition-all opacity-0 group-hover:opacity-100"
        aria-label="Conversation options"
      >
        <Icon name="ellipsis" size={14} className="text-[var(--icon-neutral-strong)]" />
      </button>
      {/* Dropdown menu */}
      {menuOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-[160px] bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-weak)] rounded-[var(--radius-x-small)] shadow-lg z-50 py-1"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              setRenameValue(conversation.title);
              setIsRenaming(true);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-[var(--text-neutral-x-strong)] hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
          >
            <Icon name="pen" size={13} className="text-[var(--icon-neutral-strong)]" />
            Rename
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-[var(--text-neutral-x-strong)] hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
          >
            <Icon name="trash-can" size={13} className="text-[var(--icon-neutral-strong)]" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function AIChatPanel({ isOpen, onClose, isExpanded, onExpandChange }: AIChatPanelProps) {
  const navigate = useNavigate();
  const { isDemoMode, matchIntent, setCurrentScene } = useDemo();
  const [inputValue, setInputValue] = useState('');
  const [conversations, setConversations] = useState<ChatConversation[]>(() => [...initialConversations]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation>(() => getInitialConversation(initialConversations));
  const [conversationStarted, setConversationStarted] = useState(() => getInitialConversation(initialConversations).messages.length > 0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConversationList, setShowConversationList] = useState(false);
  const [collapsedSearchQuery, setCollapsedSearchQuery] = useState('');
  const [isCollapsedSearchOpen, setIsCollapsedSearchOpen] = useState(false);
  const [ephemeralChatId, setEphemeralChatId] = useState<string | null>(null);
  const [animatingTitleId, setAnimatingTitleId] = useState<string | null>(null);

  const messages = selectedConversation.messages;

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    sessionStorage.setItem(ACTIVE_CONVERSATION_KEY, conversation.id);
  };

  // Remove ephemeral new chat when switching away from it
  const cleanupEphemeral = (nextConversationId?: string) => {
    if (ephemeralChatId && ephemeralChatId !== nextConversationId) {
      setConversations(prev => prev.filter(c => c.id !== ephemeralChatId));
      setEphemeralChatId(null);
    }
  };

  // Clean up ephemeral chat when panel closes
  useEffect(() => {
    if (!isOpen && ephemeralChatId) {
      setConversations(prev => prev.filter(c => c.id !== ephemeralChatId));
      setEphemeralChatId(null);
    }
  }, [isOpen]);

  // Restore last active conversation when panel reopens
  useEffect(() => {
    if (isOpen) {
      const storedId = sessionStorage.getItem(ACTIVE_CONVERSATION_KEY);
      if (storedId) {
        const found = conversations.find(c => c.id === storedId);
        if (found) {
          setSelectedConversation(found);
          setConversationStarted(found.messages.length > 0);
          return;
        }
      }
      // No stored conversation — start a fresh empty chat (shows "Hi Rad!" welcome)
      handleNewChat();
    }
  }, [isOpen]);

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    // Use functional updater so this is safe when called from setTimeout
    setSelectedConversation(prev => prev.id === id ? { ...prev, title: newTitle } : prev);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      // If the deleted conversation was active, switch to next available
      if (selectedConversation.id === id) {
        if (updated.length > 0) {
          selectConversation(updated[0]);
          setConversationStarted(true);
        } else {
          setConversationStarted(false);
        }
      }
      return updated;
    });
  };

  const handleCollapsedConversationClick = (conversation: ChatConversation) => {
    cleanupEphemeral(conversation.id);
    selectConversation(conversation);
    setConversationStarted(conversation.messages.length > 0);
    setShowConversationList(false);
    setCollapsedSearchQuery('');
    setIsCollapsedSearchOpen(false);
  };

  const handleNewChat = () => {
    // If we're already on an ephemeral new chat, just stay on it
    if (ephemeralChatId && selectedConversation.id === ephemeralChatId) {
      setShowConversationList(false);
      setCollapsedSearchQuery('');
      return;
    }

    // Clean up any existing ephemeral chat before creating a new one
    if (ephemeralChatId) {
      setConversations(prev => prev.filter(c => c.id !== ephemeralChatId));
    }

    const newConversation: ChatConversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
    };
    setConversations(prev => [newConversation, ...prev]);
    selectConversation(newConversation);
    setEphemeralChatId(newConversation.id);
    setConversationStarted(false);
    setShowConversationList(false);
    setCollapsedSearchQuery('');
    setIsCollapsedSearchOpen(false);
  };

  // Grouped conversations for section headers (non-search view)
  const todayConversations = conversations.slice(0, 1);
  const recentGroupConversations = conversations.slice(1);

  // Search active flags
  const isExpandedSearchActive = isSearchOpen && searchQuery.trim().length > 0;
  const isCollapsedSearchActive = isCollapsedSearchOpen && collapsedSearchQuery.trim().length > 0;

  // Filtered conversations for collapsed search
  const collapsedFilteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(collapsedSearchQuery.toLowerCase())
  );

  const handleExpand = () => {
    onExpandChange(true);
  };

  const handleCollapse = () => {
    onExpandChange(false);
  };

  const addMessageToConversation = (message: ChatMessage) => {
    setSelectedConversation(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
    setConversations(prev =>
      prev.map(c =>
        c.id === selectedConversation.id
          ? { ...c, messages: [...c.messages, message] }
          : c
      )
    );
  };

  const handleSend = (text?: string) => {
    const msg = text || inputValue.trim();
    if (msg) {
      // Persist ephemeral chat — it's now a real conversation
      if (ephemeralChatId) {
        setEphemeralChatId(null);
      }

      // Schedule AI title generation for "New Chat" conversations
      if (selectedConversation.title === 'New Chat') {
        const chatId = selectedConversation.id;
        const generatedTitle = generateTitle(msg);
        setTimeout(() => {
          handleRenameConversation(chatId, generatedTitle);
          setAnimatingTitleId(chatId);
          // Clear animation flag after it completes
          setTimeout(() => setAnimatingTitleId(null), 600);
        }, 1500);
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'user',
        text: msg,
      };
      addMessageToConversation(userMessage);

      // Demo mode: check for Scene 4 intent
      if (isDemoMode) {
        const matched = matchIntent(msg, [scene4Intent]);
        if (matched && matched.id === 'omni-diversity') {
          setCurrentScene('scene4');
          const aiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            type: 'ai',
            text: '',
            component: 'omni-response',
          };
          // Slight delay so user message renders first
          setTimeout(() => addMessageToConversation(aiMessage), 300);
        }
      }

      setConversationStarted(true);
      // In a real app, this would send the message
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed z-50"
      style={{
        top: isExpanded ? 0 : 96,
        bottom: isExpanded ? 0 : 40,
        right: isExpanded ? 0 : 16,
        width: isExpanded ? '100%' : 383,
        transformOrigin: 'bottom right',
        transition: 'top 250ms cubic-bezier(0.4, 0, 0.2, 1), bottom 250ms cubic-bezier(0.4, 0, 0.2, 1), right 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className={`w-full h-full bg-[var(--surface-neutral-white)] shadow-xl flex overflow-hidden ${isExpanded ? 'flex-col' : ''}`}
        style={{
          borderRadius: isExpanded ? 0 : 20,
          transition: 'border-radius 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Full-width expanded header — spans sidebar + content */}
        {isExpanded && (
          <div className="shrink-0 flex items-center justify-between bg-[var(--surface-neutral-white)] py-4">
            {/* Left section — matches sidebar width + padding so New Chat aligns with conversation items */}
            <div className="shrink-0 px-2" style={{ width: 280 }}>
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2.5 pl-3 pr-8 py-2.5 text-[15px] font-medium text-[var(--text-neutral-x-strong)] hover:bg-[rgba(0,0,0,0.04)] rounded-[var(--radius-xx-small)] transition-colors"
              >
                <Icon name="pen-to-square" size={16} className="text-[var(--icon-neutral-x-strong)]" />
                New Chat
              </button>
            </div>
            <div className="flex items-center gap-2 px-5">
              <button
                onClick={handleCollapse}
                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-xx-small)] hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
                aria-label="Collapse to panel"
              >
                <Icon name="down-left-and-up-right-to-center" size={16} className="text-[var(--icon-neutral-x-strong)]" />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-xx-small)] hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
                aria-label="Close chat"
              >
                <Icon name="xmark" size={16} className="text-[var(--icon-neutral-x-strong)]" />
              </button>
            </div>
          </div>
        )}

        {/* Body — sidebar + content side by side */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Sidebar - only visible when expanded */}
        <div
          className="shrink-0 bg-[var(--surface-neutral-white)] flex flex-col overflow-hidden"
          style={{
            width: isExpanded ? 280 : 0,
            opacity: isExpanded ? 1 : 0,
            transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1), opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Chats Section Header */}
          <div className="px-5 py-2 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[var(--text-neutral-medium)]">
              Chats
            </span>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
              aria-label="Search chats"
            >
              <Icon name="magnifying-glass" size={14} className="text-[var(--icon-neutral-strong)]" />
            </button>
          </div>

          {/* Search Input */}
          {isSearchOpen && (
            <div className="px-4 pb-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 pr-8 text-[14px] bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-weak)] rounded-[var(--radius-xx-small)] text-[var(--text-neutral-strong)] placeholder:text-[var(--text-neutral-weak)] outline-none focus:border-[var(--color-primary-strong)]"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
                    aria-label="Clear search"
                  >
                    <Icon name="xmark" size={10} className="text-[var(--icon-neutral-strong)]" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2">
            {isExpandedSearchActive ? (
              /* Flat filtered list during search */
              filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === selectedConversation.id}
                    isAnimatingTitle={animatingTitleId === conversation.id}
                    onSelect={() => {
                      cleanupEphemeral(conversation.id);
                      selectConversation(conversation);
                      setConversationStarted(conversation.messages.length > 0);
                    }}
                    onRename={(newTitle) => handleRenameConversation(conversation.id, newTitle)}
                    onDelete={() => handleDeleteConversation(conversation.id)}
                  />
                ))
              ) : (
                <div className="px-3 py-6 text-center text-[14px] text-[var(--text-neutral-medium)]">
                  No chats found
                </div>
              )
            ) : (
              /* Grouped list with Today/Recent headers */
              <>
                {todayConversations.length > 0 && (
                  <div className="mb-1">
                    <span className="block px-2 py-1.5 text-[12px] font-semibold text-[var(--text-neutral-medium)] uppercase tracking-wide">
                      Today
                    </span>
                    {todayConversations.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isActive={conversation.id === selectedConversation.id}
                        isAnimatingTitle={animatingTitleId === conversation.id}
                        onSelect={() => {
                          cleanupEphemeral(conversation.id);
                          selectConversation(conversation);
                          setConversationStarted(conversation.messages.length > 0);
                        }}
                        onRename={(newTitle) => handleRenameConversation(conversation.id, newTitle)}
                        onDelete={() => handleDeleteConversation(conversation.id)}
                      />
                    ))}
                  </div>
                )}
                {recentGroupConversations.length > 0 && (
                  <div>
                    <span className="block px-2 py-1.5 text-[12px] font-semibold text-[var(--text-neutral-medium)] uppercase tracking-wide">
                      Recent
                    </span>
                    {recentGroupConversations.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isActive={conversation.id === selectedConversation.id}
                        isAnimatingTitle={animatingTitleId === conversation.id}
                        onSelect={() => {
                          cleanupEphemeral(conversation.id);
                          selectConversation(conversation);
                          setConversationStarted(conversation.messages.length > 0);
                        }}
                        onRename={(newTitle) => handleRenameConversation(conversation.id, newTitle)}
                        onDelete={() => handleDeleteConversation(conversation.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Panel Header - only when not expanded */}
          {!isExpanded && (
            <div className="shrink-0 bg-[var(--surface-neutral-xx-weak)] rounded-tl-[20px]">
              <div className="h-[62px] px-5 py-4 flex items-center justify-between">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-xx-small)] hover:bg-[var(--surface-neutral-x-weak)] transition-colors"
                  aria-label={showConversationList ? 'Back to chat' : 'Menu'}
                  onClick={() => {
                    if (showConversationList) {
                      setShowConversationList(false);
                      setCollapsedSearchQuery('');
                    } else {
                      setShowConversationList(true);
                    }
                  }}
                >
                  <Icon name={showConversationList ? 'arrow-left' : 'bars'} size={16} className="text-[var(--icon-neutral-x-strong)]" />
                </button>
                <div className="flex items-center gap-[6px]">
                  <button
                    onClick={handleExpand}
                    className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-xx-small)] hover:bg-[var(--surface-neutral-x-weak)] transition-colors"
                    aria-label="Expand"
                  >
                    <Icon name="up-right-and-down-left-from-center" size={16} className="text-[var(--icon-neutral-x-strong)]" />
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-xx-small)] hover:bg-[var(--surface-neutral-x-weak)] transition-colors"
                    aria-label="Close"
                    onClick={onClose}
                  >
                    <Icon name="xmark" size={16} className="text-[var(--icon-neutral-x-strong)]" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Content Area */}
          <div className={`flex-1 flex flex-col min-h-0 ${isExpanded ? 'bg-[var(--surface-neutral-white)] pt-1 pb-6 px-6' : 'bg-[var(--surface-neutral-white)]'}`}>
            {isExpanded ? (
              /* Expanded view - grey rounded container */
              <div className="flex-1 flex flex-col min-h-0 bg-[var(--surface-neutral-xx-weak)] rounded-[20px] overflow-hidden">
                {/* Messages Area or Welcome State */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {!conversationStarted ? (
                    /* Welcome empty state — expanded */
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center" style={{ animation: 'welcomeFadeIn 0.4s ease-out' }}>
                        <h1
                          className="text-[42px] font-bold leading-tight text-[var(--color-primary-strong)] mb-2"
                          style={{ fontFamily: 'Fields, Inter, system-ui, sans-serif' }}
                        >
                          Hi Rad!
                        </h1>
                        <p
                          className="text-[17px] text-[var(--text-neutral-medium)] mb-8"
                          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                        >
                          What are we tackling today?
                        </p>
                        <div className="flex flex-wrap justify-center gap-2.5">
                          {WELCOME_SUGGESTIONS.map(label => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => handleSend(label)}
                              className="px-[18px] py-2.5 text-[15px] font-medium text-[var(--text-neutral-x-strong)] bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-medium)] rounded-full hover:bg-[var(--surface-neutral-white)] hover:opacity-80 transition-colors"
                              style={{ boxShadow: '1px 1px 0px 1px rgba(56, 49, 47, 0.04)' }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[800px] mx-auto px-8 py-6 flex flex-col gap-6">
                      {messages.map((message) => (
                        <div key={message.id}>
                          {message.type === 'user' ? (
                            <div className="flex justify-end">
                              <div className="max-w-[70%] bg-[var(--surface-neutral-white)] px-4 py-3 rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[16px]">
                                <p className="text-[15px] leading-[22px] text-[var(--text-neutral-x-strong)] whitespace-pre-line">
                                  {message.text}
                                </p>
                              </div>
                            </div>
                          ) : message.component === 'omni-response' ? (
                            <OmniResponse onNavigate={() => navigate('/omni-explore')} />
                          ) : (
                            <div className="flex flex-col">
                              <MarkdownContent text={message.text} />
                              {/* Suggestion Chips */}
                              {message.suggestions && message.suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {message.suggestions.map((suggestion, index) => (
                                    <button
                                      key={index}
                                      className="px-4 py-2 text-[14px] text-[var(--text-neutral-x-strong)] bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-medium)] rounded-full hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
                                      style={{ boxShadow: '1px 1px 0px 1px rgba(56, 49, 47, 0.04)' }}
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expanded Input Area */}
                <div className="px-8 py-6">
                  <div className="max-w-[800px] mx-auto flex items-center gap-3 bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-weak)] rounded-full px-6 py-3 shadow-sm">
                    <textarea
                      placeholder="Ask Anything"
                      value={inputValue}
                      onChange={handleInput}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      className="flex-1 bg-transparent text-[15px] leading-[22px] text-[var(--text-neutral-strong)] placeholder:text-[var(--text-neutral-medium)] outline-none resize-none overflow-hidden"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim()}
                      className="flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-70"
                      aria-label="Send message"
                    >
                      <Icon
                        name="paper-plane"
                        size={20}
                        className="text-[var(--icon-neutral-medium)]"
                      />
                    </button>
                  </div>
                </div>
              </div>
            ) : showConversationList ? (
              /* Collapsed conversation list view */
              <div className="flex-1 flex flex-col min-h-0 bg-[var(--surface-neutral-white)]">
                {/* New Chat button */}
                <div className="px-3 mt-3 mb-1">
                  <button
                    onClick={handleNewChat}
                    className="w-full flex items-center gap-2.5 pl-3 pr-8 py-2.5 text-[15px] font-medium text-[var(--text-neutral-x-strong)] hover:bg-[rgba(0,0,0,0.04)] rounded-[var(--radius-xx-small)] transition-colors"
                  >
                    <Icon name="pen-to-square" size={16} className="text-[var(--icon-neutral-x-strong)]" />
                    New Chat
                  </button>
                </div>

                {/* Chats header with search icon */}
                <div className="px-5 py-2 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[var(--text-neutral-medium)]">
                    Chats
                  </span>
                  <button
                    onClick={() => {
                      if (isCollapsedSearchOpen) {
                        setCollapsedSearchQuery('');
                        setIsCollapsedSearchOpen(false);
                      } else {
                        setIsCollapsedSearchOpen(true);
                      }
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
                    aria-label="Search chats"
                  >
                    <Icon name="magnifying-glass" size={14} className="text-[var(--icon-neutral-strong)]" />
                  </button>
                </div>

                {/* Search input — hidden by default */}
                {isCollapsedSearchOpen && (
                  <div className="px-4 pb-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search chats..."
                        value={collapsedSearchQuery}
                        onChange={(e) => setCollapsedSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 pr-8 text-[14px] bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-weak)] rounded-[var(--radius-xx-small)] text-[var(--text-neutral-strong)] placeholder:text-[var(--text-neutral-weak)] outline-none focus:border-[var(--color-primary-strong)]"
                        autoFocus
                      />
                      {collapsedSearchQuery && (
                        <button
                          onClick={() => { setCollapsedSearchQuery(''); setIsCollapsedSearchOpen(false); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
                          aria-label="Clear search"
                        >
                          <Icon name="xmark" size={10} className="text-[var(--icon-neutral-strong)]" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto px-3">
                  {isCollapsedSearchActive ? (
                    /* Flat filtered list during search */
                    collapsedFilteredConversations.length > 0 ? (
                      collapsedFilteredConversations.map(conv => (
                        <ConversationItem
                          key={conv.id}
                          conversation={conv}
                          isActive={conv.id === selectedConversation.id}
                          isAnimatingTitle={animatingTitleId === conv.id}
                          onSelect={() => handleCollapsedConversationClick(conv)}
                          onRename={(newTitle) => handleRenameConversation(conv.id, newTitle)}
                          onDelete={() => handleDeleteConversation(conv.id)}
                        />
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center text-[14px] text-[var(--text-neutral-medium)]">
                        No chats found
                      </div>
                    )
                  ) : (
                    /* Grouped list with Today/Recent headers */
                    <>
                      {todayConversations.length > 0 && (
                        <div className="mb-1">
                          <span className="block px-2 py-1.5 text-[12px] font-semibold text-[var(--text-neutral-medium)] uppercase tracking-wide">
                            Today
                          </span>
                          {todayConversations.map(conv => (
                            <ConversationItem
                              key={conv.id}
                              conversation={conv}
                              isActive={conv.id === selectedConversation.id}
                              isAnimatingTitle={animatingTitleId === conv.id}
                              onSelect={() => handleCollapsedConversationClick(conv)}
                              onRename={(newTitle) => handleRenameConversation(conv.id, newTitle)}
                              onDelete={() => handleDeleteConversation(conv.id)}
                            />
                          ))}
                        </div>
                      )}
                      {recentGroupConversations.length > 0 && (
                        <div>
                          <span className="block px-2 py-1.5 text-[12px] font-semibold text-[var(--text-neutral-medium)] uppercase tracking-wide">
                            Recent
                          </span>
                          {recentGroupConversations.map(conv => (
                            <ConversationItem
                              key={conv.id}
                              conversation={conv}
                              isActive={conv.id === selectedConversation.id}
                              isAnimatingTitle={animatingTitleId === conv.id}
                              onSelect={() => handleCollapsedConversationClick(conv)}
                              onRename={(newTitle) => handleRenameConversation(conv.id, newTitle)}
                              onDelete={() => handleDeleteConversation(conv.id)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Panel view — chat */
              <>
                {/* Content Area */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {!conversationStarted ? (
                    /* Welcome empty state */
                    <div className="flex-1 flex items-center p-5" style={{ minHeight: '100%' }}>
                      <div className="flex flex-col items-start" style={{ animation: 'welcomeFadeIn 0.4s ease-out' }}>
                        <h1
                          className="text-[34px] font-bold leading-tight text-[var(--color-primary-strong)] mb-1.5"
                          style={{ fontFamily: 'Fields, Inter, system-ui, sans-serif' }}
                        >
                          Hi Rad!
                        </h1>
                        <p
                          className="text-[16px] text-[var(--text-neutral-medium)] mb-6"
                          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                        >
                          What are we tackling today?
                        </p>
                        <div className="flex flex-col gap-2.5">
                          {WELCOME_SUGGESTIONS.map(label => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => handleSend(label)}
                              className="self-start px-[18px] py-2.5 text-[15px] font-medium text-[var(--text-neutral-x-strong)] bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-medium)] rounded-full hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
                              style={{ boxShadow: '1px 1px 0px 1px rgba(56, 49, 47, 0.04)' }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Messages */
                    <div className="flex flex-col gap-5 p-5">
                      {messages.map((message) => (
                        <div key={message.id}>
                          {message.type === 'user' ? (
                            <div className="flex justify-end pl-[34px]">
                              <div className="bg-[var(--surface-neutral-xx-weak)] px-4 py-3 rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[16px]">
                                <p className="text-[15px] leading-[22px] text-[var(--text-neutral-x-strong)]">
                                  {message.text}
                                </p>
                              </div>
                            </div>
                          ) : message.component === 'omni-response' ? (
                            <OmniResponse onNavigate={() => navigate('/omni-explore')} />
                          ) : (
                            <div className="flex flex-col gap-4">
                              <MarkdownContent text={message.text} />
                              {message.suggestions && message.suggestions.length > 0 && (
                                <div className="flex flex-col gap-2">
                                  {message.suggestions.map((suggestion, index) => (
                                    <button
                                      key={index}
                                      className="self-start px-4 py-2 text-[14px] leading-[20px] text-[var(--text-neutral-x-strong)] bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-medium)] rounded-full hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
                                      style={{ boxShadow: '1px 1px 0px 1px rgba(56, 49, 47, 0.04)' }}
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Input — simple rounded pill (matches /ask style) */}
                <div className="bg-[var(--surface-neutral-white)] px-5 pt-4 pb-5 rounded-b-[20px] shrink-0">
                  <div
                    className="flex items-center gap-3 bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-weak)] rounded-full px-6 py-2.5"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
                  >
                    <textarea
                      placeholder="Ask anything..."
                      value={inputValue}
                      onChange={handleInput}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      className="flex-1 bg-transparent text-[15px] leading-[22px] text-[var(--text-neutral-strong)] placeholder:text-[var(--text-neutral-medium)] outline-none resize-none overflow-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={!inputValue.trim()}
                      className="shrink-0 flex items-center justify-center disabled:opacity-35 disabled:cursor-default transition-opacity hover:opacity-85"
                      aria-label="Send"
                    >
                      <SendIcon active={!!inputValue.trim()} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        </div>{/* close body wrapper */}
      </div>
    </div>
  );
}

export default AIChatPanel;
