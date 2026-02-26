import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DemoIntent } from '../data/demoScriptData';

interface DemoContextType {
  isDemoMode: boolean;
  currentScene: 'scene1' | 'scene2' | 'scene3' | null;
  setCurrentScene: (scene: 'scene1' | 'scene2' | 'scene3' | null) => void;
  matchIntent: (input: string, intents: DemoIntent[]) => DemoIntent | null;
  resetDemo: () => void;
  demoResetCounter: number;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const DEMO_ROUTES = ['/demo', '/reports'];

function isDemoRoute(pathname: string): boolean {
  return DEMO_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Keyword scoring intent matcher.
 * Case-insensitive. Score = number of keyword matches in input.
 * Minimum threshold: 2. Highest score wins. First match breaks ties.
 */
function matchIntent(input: string, intents: DemoIntent[]): DemoIntent | null {
  const lowerInput = input.toLowerCase();
  let bestIntent: DemoIntent | null = null;
  let bestScore = 0;

  for (const intent of intents) {
    let score = 0;
    for (const keyword of intent.keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    if (score >= 2 && score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return bestIntent;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [currentScene, setCurrentScene] = useState<'scene1' | 'scene2' | 'scene3' | null>(null);
  const [demoResetCounter, setDemoResetCounter] = useState(0);

  // Determine if we're in demo mode based on current route
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const checkRoute = () => {
      setIsDemoMode(isDemoRoute(window.location.pathname));
    };
    checkRoute();
    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', checkRoute);
    // Poll for route changes (react-router doesn't fire popstate for programmatic navigation)
    const interval = setInterval(checkRoute, 200);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      clearInterval(interval);
    };
  }, []);

  const resetDemo = useCallback(() => {
    // Clear chat panel state
    localStorage.setItem('bhr-chat-panel-open', 'false');
    localStorage.setItem('bhr-chat-expanded', 'false');
    // Reset scene
    setCurrentScene(null);
    // Bump reset counter so chat panel clears its messages
    setDemoResetCounter(c => c + 1);
    // Navigate to demo dashboard
    navigate('/demo');
  }, [navigate]);

  // Listen for Ctrl+Shift+R / Cmd+Shift+R to reset demo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      if (modKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        resetDemo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetDemo]);

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        currentScene,
        setCurrentScene,
        matchIntent,
        resetDemo,
        demoResetCounter,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
