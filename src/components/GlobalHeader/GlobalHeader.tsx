import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../Icon';
import bamboohrLogo from '../../assets/images/bamboohr-logo.svg';

interface GlobalHeaderProps {
  className?: string;
}

export function GlobalHeader({ className = '' }: GlobalHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnSettings = location.pathname === '/settings';
  const isOnInbox = location.pathname === '/inbox';
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(() => {
    return localStorage.getItem('bhr-chat-panel-open') === 'true';
  });

  // Poll for chat panel state changes
  useEffect(() => {
    const interval = setInterval(() => {
      const isOpen = localStorage.getItem('bhr-chat-panel-open') === 'true';
      if (isOpen !== isChatPanelOpen) {
        setIsChatPanelOpen(isOpen);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isChatPanelOpen]);
  return (
    <header
      className={`
        flex flex-col justify-center items-end
        bg-[var(--surface-neutral-white)]
        pt-6 pr-4 pb-6 pl-0
        max-w-[2000px]
        ${className}
      `}
    >
      <div className="flex items-center justify-between gap-4 w-full">
      {/* Logo */}
      <img
        src={bamboohrLogo}
        alt="BambooHR"
        className="h-[48px] w-auto shrink-0"
      />

      {/* Right Section */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        {/* Search Bar */}
        <div className="w-[260px]">
          <div
            className="
              flex items-center gap-2
              h-[36px] px-3
              bg-[var(--surface-neutral-white)]
              border border-[var(--border-neutral-medium)]
              rounded-[var(--radius-full)]
            "
            style={{ boxShadow: 'var(--shadow-100)' }}
          >
            <Icon
              name="magnifying-glass"
              size={13}
              className="text-[var(--text-neutral-weak)]"
            />
            <input
              type="text"
              placeholder="Search..."
              className="
                flex-1 bg-transparent
                text-[13px] leading-5
                text-[var(--text-neutral-weak)]
                placeholder:text-[var(--text-neutral-weak)]
                outline-none
              "
            />
          </div>
        </div>

        {/* Utility Icons */}
        <div className="flex items-center gap-1">
          <button
            className={`
              flex items-center justify-center
              w-[36px] h-[36px]
              rounded-[var(--radius-xx-small)]
              transition-colors duration-200
              ${
                isOnInbox
                  ? 'bg-[var(--surface-neutral-xx-weak)]'
                  : 'hover:bg-[var(--surface-neutral-xx-weak)]'
              }
            `}
            aria-label="Inbox"
            onClick={() => navigate('/inbox')}
          >
            <Icon
              name="inbox"
              size={20}
              variant={isOnInbox ? 'solid' : 'regular'}
              className={isOnInbox ? 'text-[var(--color-primary-strong)]' : 'text-[var(--icon-neutral-x-strong)]'}
            />
          </button>

          <button
            className="
              flex items-center justify-center
              w-[36px] h-[36px]
              rounded-[var(--radius-xx-small)]
              hover:bg-[var(--surface-neutral-xx-weak)]
              transition-colors duration-200
            "
            aria-label="Help"
          >
            <Icon
              name="circle-question"
              size={20}
              variant="regular"
              className="text-[var(--icon-neutral-x-strong)]"
            />
          </button>

          <button
            className={`
              flex items-center justify-center
              w-[36px] h-[36px]
              rounded-[var(--radius-xx-small)]
              transition-colors duration-200
              ${
                isOnSettings
                  ? 'bg-[var(--surface-neutral-xx-weak)]'
                  : 'hover:bg-[var(--surface-neutral-xx-weak)]'
              }
            `}
            aria-label="Settings"
            onClick={() => navigate('/settings')}
          >
            <Icon
              name="gear"
              size={20}
              variant={isOnSettings ? 'solid' : 'regular'}
              className={isOnSettings ? 'text-[var(--color-primary-strong)]' : 'text-[var(--icon-neutral-x-strong)]'}
            />
          </button>

          <button
            className={`h-[36px] px-4 text-[14px] font-semibold rounded-full flex items-center gap-2 transition-all ${
              isChatPanelOpen
                ? 'text-white bg-[var(--color-primary-strong)] hover:opacity-90'
                : 'text-[var(--color-primary-strong)] bg-[var(--surface-neutral-white)] border-2 border-[var(--color-primary-strong)] hover:bg-[var(--surface-neutral-xx-weak)]'
            }`}
            style={{ boxShadow: '1px 1px 0px 1px rgba(56, 49, 47, 0.04)' }}
            onClick={() => {
              const isOpen = localStorage.getItem('bhr-chat-panel-open') === 'true';
              localStorage.setItem('bhr-chat-panel-open', String(!isOpen));
            }}
          >
            <Icon name="sparkles" size={14} />
            Ask
          </button>
        </div>
      </div>
      </div>
    </header>
  );
}

export default GlobalHeader;
