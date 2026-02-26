import { useState, useCallback, useRef } from 'react';
import type { DebugEntry, DebugEntryType } from './types';

let debugCounter = 0;

export function useDebugLog() {
  const [entries, setEntries] = useState<DebugEntry[]>([]);

  // Track request start times for computing duration
  const requestTimers = useRef<Map<string, number>>(new Map());

  const addEntry = useCallback((
    type: DebugEntryType,
    label: string,
    data: unknown,
    duration?: number,
  ) => {
    const entry: DebugEntry = {
      id: `debug-${++debugCounter}-${Date.now()}`,
      timestamp: Date.now(),
      type,
      label,
      data,
      duration,
    };
    setEntries(prev => [...prev, entry]);
    return entry.id;
  }, []);

  /** Log a user message */
  const logUser = useCallback((text: string) => {
    addEntry('user', `USER: "${text}"`, { text });
  }, [addEntry]);

  /** Log an API request being sent — returns a requestId for timing */
  const logApiRequest = useCallback((messageCount: number, toolNames: string[]) => {
    const requestId = `req-${Date.now()}`;
    requestTimers.current.set(requestId, Date.now());
    addEntry('api-request', 'API REQUEST', {
      model: 'gpt-4o',
      messages: messageCount,
      tools: toolNames,
    });
    return requestId;
  }, [addEntry]);

  /** Log an API response (text or tool call) */
  const logApiResponse = useCallback((
    requestId: string,
    payload: {
      type: 'text' | 'tool_call' | 'text+tool_call';
      functionName?: string;
      functionArgs?: unknown;
      textContent?: string;
    },
  ) => {
    const startTime = requestTimers.current.get(requestId);
    const duration = startTime ? Date.now() - startTime : undefined;
    requestTimers.current.delete(requestId);

    const label = payload.functionName
      ? `API RESPONSE → ${payload.functionName}`
      : 'API RESPONSE → text';

    addEntry('api-response', label, payload, duration);
  }, [addEntry]);

  /** Log a tool result sent back to the API */
  const logToolResult = useCallback((toolCallId: string, result: unknown) => {
    addEntry('tool-result', `TOOL RESULT (${toolCallId})`, result);
  }, [addEntry]);

  /** Log an error */
  const logError = useCallback((message: string, details?: unknown) => {
    addEntry('error', `ERROR: ${message}`, details || { message });
  }, [addEntry]);

  /** Clear all debug entries */
  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    logUser,
    logApiRequest,
    logApiResponse,
    logToolResult,
    logError,
    clearEntries,
  };
}

export type DebugLog = ReturnType<typeof useDebugLog>;
