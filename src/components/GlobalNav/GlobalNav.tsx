import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '../Icon';
import { useTheme } from '../../contexts/ThemeContext';

const NAV_STORAGE_KEY = 'bhr-nav-expanded';

/** Routes that have active pages — all others are disabled in the nav */
const ACTIVE_ROUTES = new Set(['/', '/reports']);

interface NavItem {
  path: string;
  label: string;
  icon: 'home' | 'circle-user' | 'user-group' | 'id-badge' | 'chart-pie-simple' | 'file-lines' | 'circle-dollar';
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/my-info', label: 'My Info', icon: 'circle-user' },
  { path: '/people', label: 'People', icon: 'user-group' },
  { path: '/hiring', label: 'Hiring', icon: 'id-badge' },
  { path: '/reports', label: 'Reports', icon: 'chart-pie-simple' },
  { path: '/files', label: 'Files', icon: 'file-lines' },
  { path: '/compensation', label: 'Compensation', icon: 'circle-dollar' },
];

interface GlobalNavProps {
  className?: string;
}

export function GlobalNav({ className = '' }: GlobalNavProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = localStorage.getItem(NAV_STORAGE_KEY);
    return stored ? JSON.parse(stored) : false;
  });
  const [isTablet, setIsTablet] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  // Check for tablet viewport
  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth < 1024);
    };
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(isExpanded));
  }, [isExpanded]);

  // Force collapsed on tablet
  const effectiveExpanded = isTablet ? false : isExpanded;

  const toggleNav = () => {
    if (!isTablet) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <nav
      className={`
        fixed left-0 top-0 h-full z-50
        flex flex-col justify-between items-start
        bg-[var(--surface-neutral-white)]
        p-6
        transition-[width] duration-300 ease-in-out
        ${effectiveExpanded ? 'w-[240px] delay-0' : 'w-[88px] delay-[50ms]'}
        ${className}
      `}
    >
      {/* Top Section - Nav Items */}
      <div className="flex flex-col gap-1">
        {/* Nav Items */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isEnabled = ACTIVE_ROUTES.has(item.path);

          const sharedClassName = `
            flex items-center
            rounded-[var(--radius-small)]
            transition-colors duration-200
            ${effectiveExpanded ? 'gap-3 px-3 py-2.5' : 'w-10 h-10 justify-center'}
          `;

          // Active routes use NavLink for navigation
          if (isEnabled) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  ${sharedClassName}
                  ${isActive
                    ? 'bg-[var(--surface-neutral-x-weak)]'
                    : 'hover:bg-[var(--surface-neutral-xx-weak)]'
                  }
                `}
              >
                <Icon
                  name={item.icon}
                  size={20}
                  variant={isActive ? 'solid' : 'regular'}
                  className={`
                    shrink-0 transition-colors duration-200
                    ${isActive
                      ? 'text-[var(--color-primary-strong)]'
                      : 'text-[var(--icon-neutral-x-strong)]'
                    }
                  `}
                />
                <span
                  className={`
                    font-medium text-sm leading-5 whitespace-nowrap
                    transition-opacity duration-300
                    ${effectiveExpanded ? 'opacity-100 delay-[50ms]' : 'opacity-0 w-0 overflow-hidden delay-0'}
                    ${isActive
                      ? 'text-[var(--text-neutral-xx-strong)]'
                      : 'text-[var(--text-neutral-x-strong)]'
                    }
                  `}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          }

          // Non-active routes look identical but don't navigate
          return (
            <div
              key={item.path}
              className={`${sharedClassName} hover:bg-[var(--surface-neutral-xx-weak)] cursor-default`}
            >
              <Icon
                name={item.icon}
                size={20}
                variant="regular"
                className="shrink-0 text-[var(--icon-neutral-x-strong)]"
              />
              <span
                className={`
                  font-medium text-sm leading-5 whitespace-nowrap
                  transition-opacity duration-300
                  text-[var(--text-neutral-x-strong)]
                  ${effectiveExpanded ? 'opacity-100 delay-[50ms]' : 'opacity-0 w-0 overflow-hidden delay-0'}
                `}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Section - Theme Toggle, Account, and Expand/Collapse */}
      <div className="flex flex-col gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`
            flex items-center
            rounded-[var(--radius-small)]
            transition-colors duration-200
            hover:bg-[var(--surface-neutral-xx-weak)]
            ${effectiveExpanded ? 'gap-3 px-3 py-2.5' : 'w-10 h-10 justify-center'}
          `}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Icon
            name={isDark ? 'sun' : 'moon'}
            size={20}
            className="shrink-0 text-[var(--icon-neutral-x-strong)]"
          />
          <span
            className={`
              font-medium text-sm text-[var(--text-neutral-x-strong)]
              transition-opacity duration-300
              ${effectiveExpanded ? 'opacity-100 delay-[50ms]' : 'opacity-0 w-0 overflow-hidden delay-0'}
            `}
          >
            {isDark ? 'Light mode' : 'Dark mode'}
          </span>
        </button>

        {/* Account */}
        <div
          className={`
            flex items-center
            bg-[var(--surface-neutral-x-weak)]
            rounded-[var(--radius-small)]
            ${effectiveExpanded ? 'gap-3 px-3 py-2' : 'w-10 h-10 justify-center'}
          `}
        >
          <div className="w-7 h-7 shrink-0 rounded-full bg-[#e8e6e4] flex items-center justify-center">
            <Icon name="circle-user" size={16} className="text-[#c5c2bf]" />
          </div>
          <span
            className={`
              font-medium text-sm text-[var(--text-neutral-x-strong)]
              transition-opacity duration-300
              ${effectiveExpanded ? 'opacity-100 delay-[50ms]' : 'opacity-0 w-0 overflow-hidden delay-0'}
            `}
          >
            Rad Bencher
          </span>
        </div>

        {/* Expand/Collapse Button - hidden on tablet */}
        {!isTablet && (
          <button
            onClick={toggleNav}
            className={`
              flex items-center
              bg-[var(--surface-neutral-x-weak)]
              rounded-[var(--radius-small)]
              transition-colors duration-200
              hover:bg-[var(--surface-neutral-xx-weak)]
              ${effectiveExpanded ? 'gap-3 px-3 py-2.5' : 'w-10 h-10 justify-center'}
            `}
            aria-label={effectiveExpanded ? 'Collapse navigation' : 'Expand navigation'}
          >
            <Icon
              name={effectiveExpanded ? 'arrow-left-from-line' : 'arrow-right-from-line'}
              size={20}
              className="shrink-0 text-[var(--icon-neutral-x-strong)]"
            />
            <span
              className={`
                font-medium text-sm text-[var(--text-neutral-x-strong)]
                transition-opacity duration-300
                ${effectiveExpanded ? 'opacity-100 delay-[50ms]' : 'opacity-0 w-0 overflow-hidden delay-0'}
              `}
            >
              Collapse
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default GlobalNav;
