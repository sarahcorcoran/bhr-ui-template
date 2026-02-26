// OpenAI API client for AskBambooHR
// Makes direct browser-to-API calls with SSE streaming support.
// Sprint 3: Added 30s timeout with AbortController, debug callbacks.

import { buildSystemPrompt } from './systemPrompt';
import { presentDraftCardFunction, presentSuggestionsFunction } from './tools';

const API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';
const MAX_TOKENS = 1024;
const REQUEST_TIMEOUT_MS = 30_000;

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key || key === 'sk-your-key-here') {
    throw new Error(
      'Missing VITE_OPENAI_API_KEY. Add your API key to .env and restart the dev server.'
    );
  }
  return key;
}

/** OpenAI message format */
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

export interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface StreamCallbacks {
  onText: (text: string) => void;
  onToolCall: (toolCall: { id: string; name: string; arguments: Record<string, unknown> }) => void;
  onComplete: (assistantMessage: OpenAIMessage) => void;
  onError: (error: Error) => void;
}

/** Optional debug hooks — called alongside the normal stream callbacks */
export interface DebugCallbacks {
  onRequestSent?: (messageCount: number, toolNames: string[]) => string; // returns requestId
  onResponseReceived?: (requestId: string, payload: {
    type: 'text' | 'tool_call' | 'text+tool_call';
    functionName?: string;
    functionArgs?: unknown;
    textContent?: string;
  }) => void;
  onError?: (message: string, details?: unknown) => void;
}

/**
 * Send a message to OpenAI with SSE streaming.
 * Parses server-sent events and calls back as text and tool_call chunks arrive.
 * Includes a 30-second timeout via AbortController.
 * Returns an abort function the caller can use to cancel.
 */
export function sendMessage(
  conversationHistory: OpenAIMessage[],
  callbacks: StreamCallbacks,
  debug?: DebugCallbacks,
): () => void {
  const controller = new AbortController();

  _sendMessageAsync(conversationHistory, callbacks, debug, controller).catch(() => {
    // Errors are handled inside _sendMessageAsync via callbacks.onError
  });

  return () => controller.abort();
}

async function _sendMessageAsync(
  conversationHistory: OpenAIMessage[],
  callbacks: StreamCallbacks,
  debug: DebugCallbacks | undefined,
  controller: AbortController,
): Promise<void> {
  const apiKey = getApiKey();
  const systemPrompt = buildSystemPrompt();

  // Build messages array with system prompt at the front
  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
  ];

  const toolNames = [presentDraftCardFunction.name, presentSuggestionsFunction.name];

  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages,
    tools: [
      { type: 'function' as const, function: presentDraftCardFunction },
      { type: 'function' as const, function: presentSuggestionsFunction },
    ],
    tool_choice: 'auto' as const,
    stream: true,
  };

  // Debug: log request
  const requestId = debug?.onRequestSent?.(messages.length, toolNames) || '';
  console.log('[AskBambooHR] OpenAI request — messages:', messages.length);

  // Set up timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (controller.signal.aborted) {
      const error = new Error('Request timed out. Please try again.');
      debug?.onError?.('Request timed out after 30s');
      callbacks.onError(error);
      return;
    }
    const error = new Error(`Network error: ${err instanceof Error ? err.message : 'Failed to connect'}`);
    debug?.onError?.('Network error', err);
    callbacks.onError(error);
    return;
  }

  if (!response.ok) {
    clearTimeout(timeoutId);
    const errorBody = await response.text();
    const statusMsg = response.status === 429
      ? 'Rate limited. Please wait a moment and try again.'
      : response.status >= 500
        ? 'OpenAI is having issues. Please try again in a moment.'
        : `API error ${response.status}`;
    const error = new Error(statusMsg);
    debug?.onError?.(`API error ${response.status}`, { status: response.status, body: errorBody });
    callbacks.onError(error);
    return;
  }

  // Parse SSE stream
  const reader = response.body?.getReader();
  if (!reader) {
    clearTimeout(timeoutId);
    const error = new Error('No response body');
    debug?.onError?.('No response body');
    callbacks.onError(error);
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  // Accumulate the full response to build the assistant message for history
  let accumulatedText = '';
  // Tool calls: accumulate arguments across chunks
  // OpenAI streams tool_calls as deltas with index-based chunks
  const toolCallsMap: Map<number, { id: string; name: string; arguments: string }> = new Map();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Clear timeout after first data chunk (stream is active)
      clearTimeout(timeoutId);

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          // Stream complete — finalize
          console.log('[AskBambooHR] Stream done. Tool calls accumulated:', toolCallsMap.size);
          const toolCalls = finalizeToolCalls(toolCallsMap, callbacks);

          // Build the assistant message for conversation history
          const assistantMessage: OpenAIMessage = {
            role: 'assistant',
            content: accumulatedText || null,
          };
          if (toolCalls.length > 0) {
            assistantMessage.tool_calls = toolCalls;
          }

          // Debug: log response
          logDebugResponse(debug, requestId, accumulatedText, toolCallsMap, toolCalls.length);

          callbacks.onComplete(assistantMessage);
          return;
        }

        let chunk: Record<string, unknown>;
        try {
          chunk = JSON.parse(data);
        } catch {
          continue;
        }

        const choices = chunk.choices as Array<Record<string, unknown>>;
        if (!choices || choices.length === 0) continue;

        const delta = choices[0].delta as Record<string, unknown>;
        if (!delta) continue;

        // Text content
        if (delta.content) {
          const text = delta.content as string;
          accumulatedText += text;
          callbacks.onText(text);
        }

        // Tool calls (streamed in chunks with index)
        if (delta.tool_calls) {
          const toolCallDeltas = delta.tool_calls as Array<Record<string, unknown>>;
          for (const tc of toolCallDeltas) {
            const index = tc.index as number;
            const existing = toolCallsMap.get(index);

            if (tc.id) {
              // First chunk for this tool call — has id and function name
              const fn = tc.function as Record<string, unknown>;
              toolCallsMap.set(index, {
                id: tc.id as string,
                name: fn?.name as string || '',
                arguments: (fn?.arguments as string) || '',
              });
            } else if (existing) {
              // Subsequent chunks — accumulate arguments
              const fn = tc.function as Record<string, unknown>;
              if (fn?.arguments) {
                existing.arguments += fn.arguments as string;
              }
            }
          }
        }
      }
    }

    // If stream ended without [DONE], finalize anyway
    clearTimeout(timeoutId);
    const toolCalls = finalizeToolCalls(toolCallsMap, callbacks);
    const assistantMessage: OpenAIMessage = {
      role: 'assistant',
      content: accumulatedText || null,
    };
    if (toolCalls.length > 0) {
      assistantMessage.tool_calls = toolCalls;
    }

    // Debug: log response
    logDebugResponse(debug, requestId, accumulatedText, toolCallsMap, toolCalls.length);

    callbacks.onComplete(assistantMessage);
  } catch (err) {
    clearTimeout(timeoutId);
    if (controller.signal.aborted) {
      const error = new Error('Request timed out. Please try again.');
      debug?.onError?.('Request aborted/timed out');
      callbacks.onError(error);
      return;
    }
    const error = new Error(`Stream read error: ${err instanceof Error ? err.message : 'Unknown'}`);
    debug?.onError?.('Stream read error', err);
    callbacks.onError(error);
  }
}

/** Helper to log debug response data */
function logDebugResponse(
  debug: DebugCallbacks | undefined,
  requestId: string,
  accumulatedText: string,
  toolCallsMap: Map<number, { id: string; name: string; arguments: string }>,
  toolCallCount: number,
) {
  if (!debug?.onResponseReceived) return;

  const hasText = Boolean(accumulatedText);
  const hasTools = toolCallCount > 0;
  const firstTool = toolCallsMap.size > 0
    ? toolCallsMap.values().next().value as { name: string; arguments: string }
    : undefined;

  debug.onResponseReceived(requestId, {
    type: hasText && hasTools ? 'text+tool_call' : hasTools ? 'tool_call' : 'text',
    functionName: firstTool?.name,
    functionArgs: firstTool ? safeParseJson(firstTool.arguments) : undefined,
    textContent: accumulatedText || undefined,
  });
}

/**
 * Finalize accumulated tool calls: parse JSON arguments and fire callbacks.
 * Returns the tool_calls array for the assistant message.
 */
function finalizeToolCalls(
  toolCallsMap: Map<number, { id: string; name: string; arguments: string }>,
  callbacks: StreamCallbacks,
): OpenAIToolCall[] {
  const toolCalls: OpenAIToolCall[] = [];

  for (const [, tc] of toolCallsMap) {
    toolCalls.push({
      id: tc.id,
      type: 'function',
      function: {
        name: tc.name,
        arguments: tc.arguments,
      },
    });

    try {
      const parsedArgs = JSON.parse(tc.arguments) as Record<string, unknown>;
      callbacks.onToolCall({
        id: tc.id,
        name: tc.name,
        arguments: parsedArgs,
      });
    } catch {
      callbacks.onError(new Error(`Failed to parse function arguments for ${tc.name}`));
    }
  }

  return toolCalls;
}

/** Safely parse JSON, returning the raw string if parsing fails */
function safeParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
