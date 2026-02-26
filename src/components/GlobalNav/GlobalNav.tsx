import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '../Icon';
import { useTheme } from '../../contexts/ThemeContext';
import avatarSmall from '../../assets/images/avatar-small.png';

const NAV_STORAGE_KEY = 'bhr-nav-expanded';

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
        flex flex-col justify-between
        bg-[var(--surface-neutral-white)]
        pt-6 pb-10 px-8
        transition-[width] duration-300 ease-in-out
        ${effectiveExpanded ? 'w-[240px] delay-0' : 'w-[120px] delay-[50ms]'}
        ${className}
      `}
    >
      {/* Top Section - Nav Items */}
      <div className="flex flex-col gap-4">
        {/* Nav Items */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                flex items-center
                rounded-[var(--radius-small)]
                transition-colors duration-200
                ${effectiveExpanded ? 'gap-4 px-4 py-4' : 'w-14 h-14 justify-center'}
                ${isActive
                  ? 'bg-[var(--surface-neutral-x-weak)]'
                  : 'hover:bg-[var(--surface-neutral-xx-weak)]'
                }
              `}
            >
              <Icon
                name={item.icon}
                size={24}
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
                  font-medium text-base leading-6 whitespace-nowrap
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
        })}
      </div>

      {/* Bottom Section - Theme Toggle, Account, and Expand/Collapse */}
      <div className="flex flex-col gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`
            flex items-center
            rounded-[var(--radius-small)]
            transition-colors duration-200
            hover:bg-[var(--surface-neutral-xx-weak)]
            ${effectiveExpanded ? 'gap-4 px-4 py-4' : 'w-14 h-14 justify-center'}
          `}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Icon
            name={isDark ? 'sun' : 'moon'}
            size={24}
            className="shrink-0 text-[var(--icon-neutral-x-strong)]"
          />
          <span
            className={`
              font-medium text-base text-[var(--text-neutral-x-strong)]
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
            ${effectiveExpanded ? 'gap-4 px-4 py-3' : 'w-14 h-14 justify-center'}
          `}
        >
          <img
            src={avatarSmall}
            alt="Account"
            className="w-8 h-8 shrink-0 rounded-[var(--radius-xx-small)] object-cover"
            style={{ boxShadow: 'var(--shadow-100)' }}
          />
          <span
            className={`
              font-medium text-base text-[var(--text-neutral-x-strong)]
              transition-opacity duration-300
              ${effectiveExpanded ? 'opacity-100 delay-[50ms]' : 'opacity-0 w-0 overflow-hidden delay-0'}
            `}
          >
            Account
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
              ${effectiveExpanded ? 'gap-4 px-4 py-4' : 'w-14 h-14 justify-center'}
            `}
            aria-label={effectiveExpanded ? 'Collapse navigation' : 'Expand navigation'}
          >
            <Icon
              name={effectiveExpanded ? 'arrow-left-from-line' : 'arrow-right-from-line'}
              size={24}
              className="shrink-0 text-[var(--icon-neutral-x-strong)]"
            />
            <span
              className={`
                font-medium text-base text-[var(--text-neutral-x-strong)]
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
