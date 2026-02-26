import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import type { DebugEntry, DebugEntryType } from './types';
import './DebugPanel.css';

interface DebugPanelProps {
  entries: DebugEntry[];
  onClear: () => void;
}

const TYPE_CONFIG: Record<DebugEntryType, { color: string; badge: string }> = {
  'user':         { color: '#2563eb', badge: 'USER' },
  'api-request':  { color: '#6b7280', badge: 'REQ' },
  'api-response': { color: '#16a34a', badge: 'RES' },
  'tool-result':  { color: '#7c3aed', badge: 'TOOL' },
  'error':        { color: '#dc2626', badge: 'ERR' },
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function DebugEntryRow({ entry }: { entry: DebugEntry }) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[entry.type];
  const json = formatJson(entry.data);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(json);
  }, [json]);

  return (
    <div className="debug-entry" data-type={entry.type}>
      <button
        type="button"
        className="debug-entry__header"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon
          name="chevron-right"
          size={10}
          className={`debug-entry__chevron ${expanded ? 'debug-entry__chevron--open' : ''}`}
        />
        <span className="debug-entry__time">{formatTimestamp(entry.timestamp)}</span>
        <span
          className="debug-entry__badge"
          style={{ backgroundColor: config.color }}
        >
          {config.badge}
        </span>
        <span className="debug-entry__label">{entry.label}</span>
        {entry.duration != null && (
          <span className="debug-entry__duration">{(entry.duration / 1000).toFixed(1)}s</span>
        )}
      </button>
      {expanded && (
        <div className="debug-entry__body">
          <button
            type="button"
            className="debug-entry__copy"
            onClick={handleCopy}
            title="Copy JSON"
          >
            <Icon name="copy" size={12} />
          </button>
          <pre className="debug-entry__json">{json}</pre>
        </div>
      )}
    </div>
  );
}

export function DebugPanel({ entries, onClear }: DebugPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest entry
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="debug-panel">
      <div className="debug-panel__header">
        <span className="debug-panel__title">Conversation Log</span>
        <div className="debug-panel__actions">
          <Button variant="ghost" size="small" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>
      <div className="debug-panel__entries" ref={scrollRef}>
        {entries.length === 0 && (
          <div className="debug-panel__empty">No entries yet. Start a conversation.</div>
        )}
        {entries.map(entry => (
          <DebugEntryRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
