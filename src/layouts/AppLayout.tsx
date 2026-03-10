import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GlobalNav } from '../components/GlobalNav';
import { GlobalHeader } from '../components/GlobalHeader';
import { AIChatPanel } from '../components/AIChatPanel';

const NAV_STORAGE_KEY = 'bhr-nav-expanded';
const CHAT_PANEL_STORAGE_KEY = 'bhr-chat-panel-open';
const CHAT_EXPANDED_STORAGE_KEY = 'bhr-chat-expanded';

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isOmniExplore = location.pathname === '/omni-explore';

  const [isNavExpanded, setIsNavExpanded] = useState(() => {
    const stored = localStorage.getItem(NAV_STORAGE_KEY);
    return stored ? JSON.parse(stored) : false;
  });
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(() => {
    return localStorage.getItem(CHAT_PANEL_STORAGE_KEY) === 'true';
  });
  const [isChatExpanded, setIsChatExpanded] = useState(() => {
    return localStorage.getItem(CHAT_EXPANDED_STORAGE_KEY) === 'true';
  });
  const [isTablet, setIsTablet] = useState(false);

  // Sync with GlobalNav state via localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(NAV_STORAGE_KEY);
      if (stored) {
        setIsNavExpanded(JSON.parse(stored));
      }
    };

    // Listen for changes
    window.addEventListener('storage', handleStorageChange);

    // Also poll for changes (for same-tab updates)
    const interval = setInterval(() => {
      const stored = localStorage.getItem(NAV_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed !== isNavExpanded) {
          setIsNavExpanded(parsed);
        }
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isNavExpanded]);

  // Sync with chat panel state via localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const isOpen = localStorage.getItem(CHAT_PANEL_STORAGE_KEY) === 'true';
      if (isOpen !== isChatPanelOpen) {
        setIsChatPanelOpen(isOpen);
      }
      const isExpanded = localStorage.getItem(CHAT_EXPANDED_STORAGE_KEY) === 'true';
      if (isExpanded !== isChatExpanded) {
        setIsChatExpanded(isExpanded);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isChatPanelOpen, isChatExpanded]);

  const handleCloseChatPanel = () => {
    localStorage.setItem(CHAT_PANEL_STORAGE_KEY, 'false');
    localStorage.setItem(CHAT_EXPANDED_STORAGE_KEY, 'false');
    setIsChatPanelOpen(false);
    setIsChatExpanded(false);
  };

  const handleChatExpandChange = (expanded: boolean) => {
    localStorage.setItem(CHAT_EXPANDED_STORAGE_KEY, String(expanded));
    setIsChatExpanded(expanded);
  };

  // Auto-close floating chat panel when entering /omni-explore
  useEffect(() => {
    if (isOmniExplore && isChatPanelOpen) {
      handleCloseChatPanel();
    }
  }, [isOmniExplore]);

  // Check for tablet viewport
  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth < 1024);
    };
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  // Calculate effective nav width
  const effectiveExpanded = isTablet ? false : isNavExpanded;
  const navWidth = effectiveExpanded ? 240 : 88;
  // Chat panel width (399) + 16px gap - main's pr-10 (40px) = 375px
  // When expanded, don't compress main content
  const chatPanelWidth = (isChatPanelOpen && !isChatExpanded && !isOmniExplore) ? 375 : 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--surface-neutral-white)]">
      {/* Global Navigation */}
      <GlobalNav />

      {/* Header - Full width (only nav margin) */}
      <div
        className="shrink-0 z-40 transition-all duration-300 ease-in-out"
        style={{ marginLeft: navWidth }}
      >
        <GlobalHeader />
      </div>

      {/* Page Content with Capsule Background - Compressed by chat panel */}
      <div
        className="flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out"
        style={{
          marginLeft: navWidth,
          marginRight: chatPanelWidth,
        }}
      >
        <main className="flex-1 flex flex-col min-h-0 pr-10 pb-10">
          <div
            className="
              flex-1
              flex
              flex-col
              min-h-0
              bg-[var(--surface-neutral-xx-weak)]
              rounded-[var(--radius-large)]
              overflow-y-auto
            "
          >
            {children}
          </div>
        </main>
      </div>

      {/* AI Chat Panel — hidden on /omni-explore (page has its own docked panel) */}
      {!isOmniExplore && (
        <AIChatPanel
          isOpen={isChatPanelOpen}
          onClose={handleCloseChatPanel}
          isExpanded={isChatExpanded}
          onExpandChange={handleChatExpandChange}
        />
      )}
    </div>
  );
}

export { AppLayout };
export default AppLayout;
