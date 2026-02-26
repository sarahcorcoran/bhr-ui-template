import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, DraftCardData, DraftField, ActionType, FieldType, FieldStatus, FieldOption } from './types';
import { sendMessage as sendToOpenAI, type OpenAIMessage, type DebugCallbacks } from './api/openai';
import { approver, employeeContext } from './employeeContext';
import type { DebugLog } from './useDebugLog';
import { buildGoldenPaths, findGoldenPath, findStepByTrigger, detectPTOEdit, resolveStepToolCall, resolveStepText, formatDateRange, type GoldenPath, type GoldenStep } from './goldenPaths';

let msgCounter = 0;
function nextId() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

// ─── Adapter: Map OpenAI function call arguments → DraftCardData ───

/** Map cardType from OpenAI function response to our ActionType */
function mapCardType(cardType: string): ActionType {
  switch (cardType) {
    case 'timeOff': return 'time-off';
    case 'expense': return 'expense';
    case 'addressUpdate':
    case 'phoneUpdate':
    case 'emergencyContactUpdate':
      return 'info-update';
    default:
      return 'time-off';
  }
}

/** Map cardType to an icon name compatible with our Icon component */
function mapCardIcon(cardType: string): string {
  switch (cardType) {
    case 'timeOff': return 'calendar';
    case 'expense': return 'file-lines';
    case 'addressUpdate': return 'location-dot';
    case 'phoneUpdate': return 'phone';
    case 'emergencyContactUpdate': return 'circle-user';
    default: return 'file-lines';
  }
}

/** Map OpenAI field type to our FieldType */
function mapFieldType(type: string): FieldType {
  switch (type) {
    case 'dropdown': return 'select';
    case 'phone': return 'text';
    case 'text':
    case 'date':
    case 'currency':
    case 'file':
      return type as FieldType;
    default:
      return 'text';
  }
}

/** Map OpenAI string[] options to our {label, value}[] format */
function mapOptions(options?: string[]): FieldOption[] | undefined {
  if (!options || options.length === 0) return undefined;
  return options.map(opt => ({ label: opt, value: opt }));
}

/**
 * Validate that a present_draft_card response has the minimum required fields.
 * Returns true if the data is usable, false if it's malformed.
 */
function validateCardArgs(args: Record<string, unknown>): boolean {
  if (!args.cardType || typeof args.cardType !== 'string') return false;
  if (!args.title || typeof args.title !== 'string') return false;
  if (!Array.isArray(args.fields)) return false;
  // Each field must have at minimum an id, label, and type
  for (const f of args.fields as Array<Record<string, unknown>>) {
    if (!f.id || !f.label || !f.type) return false;
  }
  return true;
}

/**
 * Check if the infoMessage from the AI contains a warning indicator (⚠️).
 */
function detectInfoWarning(infoMessage?: string): boolean {
  if (!infoMessage) return false;
  return infoMessage.includes('⚠️');
}

/**
 * Map OpenAI present_draft_card function arguments into a DraftCardData object.
 * Adapts field names and formats to match our existing Sprint 1 card components.
 */
function functionArgsToCard(args: Record<string, unknown>): DraftCardData {
  const cardType = (args.cardType as string) || 'timeOff';
  const rawFields = (args.fields as Array<Record<string, unknown>>) || [];

  const fields: DraftField[] = rawFields.map((f) => ({
    id: f.id as string,
    label: f.label as string,
    type: mapFieldType(f.type as string),
    value: (f.value as string) || '',
    status: (f.needsInput as boolean ? 'needs-input' : 'prefilled') as FieldStatus,
    options: mapOptions(f.options as string[] | undefined),
    required: f.required as boolean | undefined,
    placeholder: f.placeholder as string | undefined,
  }));

  const infoMessage = (args.infoMessage as string) || undefined;

  return {
    id: `card-${Date.now()}`,
    actionType: mapCardType(cardType),
    title: (args.title as string) || 'Draft',
    icon: mapCardIcon(cardType),
    meta: '',
    infoMessage,
    infoWarning: detectInfoWarning(infoMessage),
    fields,
    state: 'draft',
  };
}

// ─── Fallback text & suggestion detection ───
// OpenAI often sends content: null when making tool calls, meaning no text
// is streamed to the user. We generate contextual intro text client-side
// so the user always sees a message above the card/buttons.

/** Known fallback suggestion sets keyed by detected intent */
const FALLBACK_SUGGESTIONS: Record<string, string[]> = {
  'time-off-type': ['Vacation', 'Sick/Medical', 'Personal', 'Bereavement'],
  'expense-category': ['Meals & Entertainment', 'Travel', 'Office Supplies', 'Software', 'Professional Development', 'Other'],
  'phone-type': ['Mobile', 'Home', 'Work'],
  'relationship': ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'],
  'update-type': ['Update my address', 'Update my phone', 'Update emergency contact'],
};

/**
 * If the AI sent a text-only response (no tool calls, no card) that looks like
 * a question, return fallback suggestion buttons. Returns null if no fallback applies.
 *
 * IMPORTANT: Under the clarification rules, when MULTIPLE fields are missing
 * the AI should ask conversationally WITHOUT pills. So we only add pills
 * when the question is about a SINGLE categorical field.
 *
 * NOTE: We deliberately do NOT generate top-level suggestions ("Request time off",
 * "Submit an expense", "Update my info") as a fallback. These look identical to the
 * welcome state buttons and confuse users into thinking the welcome state didn't dismiss.
 * If the AI needs top-level options, it should use the present_suggestions tool call.
 */
function detectFallbackSuggestions(text: string): string[] | null {
  const lower = text.toLowerCase();

  // Must look like a question
  if (!lower.includes('?')) return null;

  // ── PTO type question — ONLY when asking about type alone (1 field missing).
  // If the question also mentions dates/when, it means multiple fields are missing → no pills.
  const asksAboutPTOType = (
    lower.includes('type of time off') || lower.includes('type of leave') ||
    lower.includes('kind of time off') || lower.includes('type of pto') ||
    (lower.includes('what type') && (lower.includes('time off') || lower.includes('pto') || lower.includes('leave')))
  );
  const alsoAsksAboutDates = (
    lower.includes('date') || lower.includes('when') || lower.includes('what day')
  );
  if (asksAboutPTOType && !alsoAsksAboutDates) {
    return FALLBACK_SUGGESTIONS['time-off-type'];
  }

  // ── Expense category question — ONLY when asking about category alone
  const asksAboutCategory = (
    lower.includes('what category') || lower.includes('type of expense') ||
    lower.includes('kind of expense') || lower.includes('expense category') ||
    (lower.includes('what type') && lower.includes('expense'))
  );
  const alsoAsksAboutAmount = (
    lower.includes('amount') || lower.includes('how much') || lower.includes('cost')
  );
  if (asksAboutCategory && !alsoAsksAboutAmount) {
    return FALLBACK_SUGGESTIONS['expense-category'];
  }

  // ── Phone type question — ONLY when asking about type alone
  const asksAboutPhoneType = (
    lower.includes('mobile') && lower.includes('home') && lower.includes('work') ||
    lower.includes('type of phone') || lower.includes('phone type') ||
    (lower.includes('is it') && lower.includes('phone'))
  );
  if (asksAboutPhoneType) {
    return FALLBACK_SUGGESTIONS['phone-type'];
  }

  // ── Relationship question — ONLY when asking about relationship alone
  const asksAboutRelationship = (
    lower.includes('relationship') ||
    (lower.includes('what') && (lower.includes('relation') || lower.includes('contact')))
  );
  const alsoAsksAboutOtherFields = (
    lower.includes('name') || lower.includes('number') || lower.includes('phone')
  );
  if (asksAboutRelationship && !alsoAsksAboutOtherFields) {
    return FALLBACK_SUGGESTIONS['relationship'];
  }

  // ── Update type question
  if (
    (lower.includes('what') || lower.includes('which')) &&
    (lower.includes('update') || lower.includes('change') || lower.includes('edit'))
  ) {
    return FALLBACK_SUGGESTIONS['update-type'];
  }

  return null;
}

/**
 * Detect if the AI responded with a text-based summary of request details
 * instead of calling present_draft_card. This happens when the model "forgets"
 * to use the tool and writes out field values as text.
 *
 * Returns true if the text looks like a card summary that should have been a tool call.
 */
function detectTextSummaryInsteadOfCard(text: string): boolean {
  if (!text || text.length < 30) return false;

  const lower = text.toLowerCase();

  // Count how many field-like patterns appear in the text
  const fieldPatterns = [
    /\btype[:\s]/i,
    /\bstart\s*date[:\s]/i,
    /\bend\s*date[:\s]/i,
    /\bhours[:\s]/i,
    /\bamount[:\s]/i,
    /\bmerchant[:\s]/i,
    /\bcategory[:\s]/i,
    /\bdate[:\s]/i,
    /\bstreet[:\s]/i,
    /\bcity[:\s]/i,
    /\bstate[:\s]/i,
    /\bzip[:\s]/i,
    /\bphone[:\s]/i,
    /\brelationship[:\s]/i,
  ];

  let matchCount = 0;
  for (const pattern of fieldPatterns) {
    if (pattern.test(text)) matchCount++;
  }

  // If 3+ field-like patterns found, this looks like a text summary
  if (matchCount >= 3) return true;

  // Also detect bullet-point summaries with field values
  const bulletLines = text.split('\n').filter(l => /^[\s]*[-•*]\s/.test(l));
  if (bulletLines.length >= 3) {
    // Check if bullet points contain field-value pairs
    const fieldValuePairs = bulletLines.filter(l =>
      /:\s/.test(l) || /vacation|sick|personal|bereavement/i.test(l)
    );
    if (fieldValuePairs.length >= 2) return true;
  }

  // Detect "Here's a summary" or "Here are the details" patterns followed by structured content
  if (
    (lower.includes('summary') || lower.includes('details') || lower.includes('here\'s what')) &&
    (lower.includes('vacation') || lower.includes('expense') || lower.includes('address') || lower.includes('phone')) &&
    matchCount >= 2
  ) {
    return true;
  }

  return false;
}

/** Fallback intro text for tool calls when the AI sends no text (content: null) */
const CARD_INTRO_TEXT: Record<string, string> = {
  timeOff: "Here's your time off request — take a look and submit when ready!",
  expense: "Got it! Here's your expense report — confirm the details and submit.",
  addressUpdate: "Here's your current address — update whatever's changed and hit submit!",
  phoneUpdate: "Here's your phone number — update it and hit submit!",
  emergencyContactUpdate: "Here's your emergency contact — make any changes and hit submit!",
};

const SUGGESTION_INTRO_TEXT = "Sure! What would you like to do?";

// ─── Helper: reverse-map ActionType to OpenAI cardType ───

function reverseMapCardType(card: DraftCardData): string | null {
  const title = card.title.toLowerCase();
  if (card.actionType === 'time-off' || title.includes('time off')) return 'timeOff';
  if (card.actionType === 'expense' || title.includes('expense')) return 'expense';
  if (title.includes('address')) return 'addressUpdate';
  if (title.includes('phone')) return 'phoneUpdate';
  if (title.includes('emergency')) return 'emergencyContactUpdate';
  return null;
}

// ─── Hook ───

export function useChat(debugLog?: DebugLog, demoMode = false) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  // Once a message has been sent, the conversation is started and the welcome state
  // should never re-render — even if messages were somehow cleared.
  const [conversationStarted, setConversationStarted] = useState(false);

  // Conversation history for the OpenAI API (no system message — that's added by the client)
  const historyRef = useRef<OpenAIMessage[]>([]);

  // ID of the assistant message currently being streamed
  const streamingMsgIdRef = useRef<string | null>(null);

  // Track the last user message text for retry functionality
  const lastUserTextRef = useRef<string>('');

  // Track the current abort function for in-flight requests
  const abortRef = useRef<(() => void) | null>(null);

  // Track the active draft card type for conversational editing detection
  // Using a ref avoids stale closures in the onToolCall callback
  const activeCardTypeRef = useRef<string | null>(null);

  // Guard against infinite retry loops when the model responds with text instead of a tool call.
  // Max 1 automatic retry per user message — reset when a new user message is sent.
  const toolCallRetryCountRef = useRef<number>(0);

  // ─── Golden Path (demo mode) state ───
  const goldenPathsRef = useRef<GoldenPath[] | null>(null);
  const activePathRef = useRef<GoldenPath | null>(null);
  const activeStepRef = useRef<number>(0);

  const addMessage = useCallback((
    role: ChatMessage['role'],
    text: string,
    card?: DraftCardData,
    options?: string[],
    isError?: boolean,
  ): string => {
    const id = nextId();
    setMessages(prev => [...prev, { id, role, text, card, options, timestamp: Date.now(), isError }]);
    return id;
  }, []);

  /** Update the text of an existing message (used during streaming) */
  const updateMessageText = useCallback((msgId: string, appendText: string) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === msgId ? { ...m, text: m.text + appendText } : m,
      ),
    );
  }, []);

  /** Attach suggestion buttons to an existing message */
  const attachOptions = useCallback((msgId: string, options: string[]) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === msgId ? { ...m, options } : m,
      ),
    );
  }, []);

  /** Clear options from the most recent message (after user picks one) */
  const clearOptions = useCallback(() => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.options) {
        return [...prev.slice(0, -1), { ...last, options: undefined }];
      }
      return prev;
    });
  }, []);

  /**
   * Find the currently active draft card's OpenAI cardType (if any).
   * Uses a ref-based snapshot to avoid stale closures.
   */
  const getActiveDraftCardType = useCallback((msgs: ChatMessage[]): string | null => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i];
      if (msg.card && msg.card.state === 'draft') {
        return reverseMapCardType(msg.card);
      }
    }
    return null;
  }, []);

  /** Build debug callbacks from the debugLog if available */
  const buildDebugCallbacks = useCallback((): DebugCallbacks | undefined => {
    if (!debugLog) return undefined;
    return {
      onRequestSent: (messageCount, toolNames) => {
        return debugLog.logApiRequest(messageCount, toolNames);
      },
      onResponseReceived: (requestId, payload) => {
        debugLog.logApiResponse(requestId, payload);
      },
      onError: (message, details) => {
        debugLog.logError(message, details);
      },
    };
  }, [debugLog]);

  /**
   * Send a message to OpenAI and stream the response.
   * Handles both text responses and function calls (present_draft_card).
   */
  const callOpenAI = useCallback((userText: string) => {
    // Add user message to API history
    historyRef.current = [
      ...historyRef.current,
      { role: 'user', content: userText },
    ];

    setIsThinking(true);

    // Create a placeholder assistant message for streaming into
    const assistantMsgId = nextId();
    streamingMsgIdRef.current = assistantMsgId;
    // Capture the active card type NOW (before the async response comes back)
    // so that onToolCall can compare incoming card type for edit detection
    setMessages(prev => {
      activeCardTypeRef.current = getActiveDraftCardType(prev);
      return [
        ...prev,
        { id: assistantMsgId, role: 'assistant' as const, text: '', timestamp: Date.now() },
      ];
    });

    // Track whether the AI streamed any text content for this response
    let hasStreamedText = false;

    const abort = sendToOpenAI(historyRef.current, {
      onText: (text) => {
        setIsThinking(false);
        hasStreamedText = true;
        updateMessageText(assistantMsgId, text);
      },

      onToolCall: (toolCall) => {
        setIsThinking(false);
        console.log('[AskBambooHR] onToolCall fired:', toolCall.name, toolCall.arguments);

        if (toolCall.name === 'present_draft_card') {
          // Validate the tool response before creating a card
          if (!validateCardArgs(toolCall.arguments)) {
            console.error('[AskBambooHR] Malformed present_draft_card arguments:', toolCall.arguments);
            debugLog?.logError('Malformed present_draft_card response', toolCall.arguments);
            updateMessageText(assistantMsgId,
              "I had trouble creating that form. Could you try describing what you need again?"
            );
            return;
          }

          const card = functionArgsToCard(toolCall.arguments);
          const incomingCardType = toolCall.arguments.cardType as string;

          // If the AI didn't stream any text, prepare a fallback intro
          const fallbackText = !hasStreamedText
            ? (CARD_INTRO_TEXT[incomingCardType] || "Here's what I've got — review and hit submit.")
            : null;

          // Detect conversational editing: same cardType as the active draft card
          const isConversationalEdit = activeCardTypeRef.current !== null &&
            activeCardTypeRef.current === incomingCardType;

          if (isConversationalEdit) {
            // ── Conversational Edit: update the EXISTING card in place ──
            // Find the message with the active draft card and update its fields + infoMessage.
            // Remove the empty streaming placeholder since the card update IS the response.
            console.log('[AskBambooHR] Conversational edit detected — updating existing card');
            setMessages(prev => {
              const updated = prev.map(m => {
                // Update the existing draft card with new field values
                if (m.card && m.card.state === 'draft') {
                  return {
                    ...m,
                    card: {
                      ...m.card,
                      fields: card.fields,
                      infoMessage: card.infoMessage,
                      infoWarning: card.infoWarning,
                    },
                  };
                }
                // Add the confirmation text to the streaming message (no card attached)
                if (m.id === assistantMsgId) {
                  return {
                    ...m,
                    text: fallbackText ? (m.text || fallbackText) : m.text,
                  };
                }
                return m;
              });
              return updated;
            });
          } else {
            // ── New Card: dismiss old drafts + attach new card ──
            console.log('[AskBambooHR] Attaching new card to message:', assistantMsgId);
            setMessages(prev => prev.map(m => {
              // Dismiss any existing draft cards
              if (m.card && m.card.state === 'draft' && m.id !== assistantMsgId) {
                return { ...m, card: { ...m.card, state: 'dismissed' as const } };
              }
              // Attach new card (and optional fallback text) to the current message
              if (m.id === assistantMsgId) {
                return {
                  ...m,
                  card,
                  text: fallbackText ? (m.text || fallbackText) : m.text,
                };
              }
              return m;
            }));
          }
        } else if (toolCall.name === 'present_suggestions') {
          const suggestions = toolCall.arguments.suggestions as string[];
          console.log('[AskBambooHR] Attaching suggestions to message:', assistantMsgId, suggestions);
          if (suggestions && suggestions.length > 0) {
            // Single atomic update: attach suggestions + optional fallback text
            const fallbackText = !hasStreamedText ? SUGGESTION_INTRO_TEXT : null;
            setMessages(prev => prev.map(m => {
              if (m.id === assistantMsgId) {
                return {
                  ...m,
                  options: suggestions,
                  text: fallbackText ? (m.text || fallbackText) : m.text,
                };
              }
              return m;
            }));
          }
        }
      },

      onComplete: (assistantMessage) => {
        setIsThinking(false);
        streamingMsgIdRef.current = null;
        abortRef.current = null;

        // Save the full assistant message to conversation history
        historyRef.current = [
          ...historyRef.current,
          assistantMessage,
        ];

        // If there were tool_calls, send back tool result messages
        // so the model knows the function was executed
        if (assistantMessage.tool_calls) {
          for (const tc of assistantMessage.tool_calls) {
            const result = { status: 'displayed_to_user' };
            historyRef.current = [
              ...historyRef.current,
              {
                role: 'tool' as const,
                tool_call_id: tc.id,
                content: JSON.stringify(result),
              },
            ];
            debugLog?.logToolResult(tc.id, result);
          }
        }

        // Fallback: if the AI responded with text only (no tool calls),
        // detect question patterns and auto-generate suggestion buttons
        if (!assistantMessage.tool_calls && assistantMessage.content) {
          const fallback = detectFallbackSuggestions(assistantMessage.content);
          if (fallback) {
            console.log('[AskBambooHR] Fallback suggestions detected:', fallback);
            attachOptions(assistantMsgId, fallback);
          }

          // ── Safety net: detect text summaries that should have been tool calls ──
          // If the model wrote out field values as text instead of calling present_draft_card,
          // nudge it to retry with the tool. Max 1 retry per user message to prevent loops.
          if (toolCallRetryCountRef.current < 1 && detectTextSummaryInsteadOfCard(assistantMessage.content)) {
            toolCallRetryCountRef.current++;
            console.warn('[AskBambooHR] Model responded with text summary instead of tool call — nudging retry');
            debugLog?.logError('Text summary detected instead of tool call — auto-retrying', {
              textContent: assistantMessage.content.slice(0, 200),
            });

            // Add a nudge message to conversation history
            historyRef.current = [
              ...historyRef.current,
              {
                role: 'user' as const,
                content: 'You must present this as a draft card using the present_draft_card tool. Do not describe it in text. Call present_draft_card now with the details you just described.',
              },
            ];

            // Replace the text-summary message with a thinking state and re-send
            setMessages(prev => prev.map(m =>
              m.id === assistantMsgId ? { ...m, text: '' } : m,
            ));
            setIsThinking(true);

            // Create a new assistant placeholder for the retry response
            const retryMsgId = nextId();
            streamingMsgIdRef.current = retryMsgId;
            setMessages(prev => [
              ...prev.filter(m => m.id !== assistantMsgId), // Remove the text-summary message
              { id: retryMsgId, role: 'assistant' as const, text: '', timestamp: Date.now() },
            ]);

            // Re-send to OpenAI (this uses the same sendToOpenAI but with the nudge in history)
            let retryHasStreamedText = false;
            const retryAbort = sendToOpenAI(historyRef.current, {
              onText: (text) => {
                setIsThinking(false);
                retryHasStreamedText = true;
                updateMessageText(retryMsgId, text);
              },
              onToolCall: (retryToolCall) => {
                setIsThinking(false);
                if (retryToolCall.name === 'present_draft_card' && validateCardArgs(retryToolCall.arguments)) {
                  const card = functionArgsToCard(retryToolCall.arguments);
                  const retryCardType = retryToolCall.arguments.cardType as string;
                  const retryFallbackText = !retryHasStreamedText
                    ? (CARD_INTRO_TEXT[retryCardType] || "Here's what I've got — review and hit submit.")
                    : null;

                  setMessages(prev => prev.map(m => {
                    if (m.card && m.card.state === 'draft' && m.id !== retryMsgId) {
                      return { ...m, card: { ...m.card, state: 'dismissed' as const } };
                    }
                    if (m.id === retryMsgId) {
                      return { ...m, card, text: retryFallbackText ? (m.text || retryFallbackText) : m.text };
                    }
                    return m;
                  }));
                } else if (retryToolCall.name === 'present_suggestions') {
                  const suggestions = retryToolCall.arguments.suggestions as string[];
                  if (suggestions?.length) {
                    setMessages(prev => prev.map(m =>
                      m.id === retryMsgId ? { ...m, options: suggestions } : m,
                    ));
                  }
                }
              },
              onComplete: (retryMsg) => {
                setIsThinking(false);
                streamingMsgIdRef.current = null;
                abortRef.current = null;
                historyRef.current = [...historyRef.current, retryMsg];
                if (retryMsg.tool_calls) {
                  for (const tc of retryMsg.tool_calls) {
                    historyRef.current = [
                      ...historyRef.current,
                      { role: 'tool' as const, tool_call_id: tc.id, content: JSON.stringify({ status: 'displayed_to_user' }) },
                    ];
                  }
                }
              },
              onError: (retryErr) => {
                setIsThinking(false);
                streamingMsgIdRef.current = null;
                abortRef.current = null;
                console.error('[AskBambooHR] Retry also failed:', retryErr);
                // Leave whatever text the model sent — at least the user sees something
              },
            }, buildDebugCallbacks());
            abortRef.current = retryAbort;
            return; // Skip the normal onComplete flow
          }
        }
      },

      onError: (error) => {
        setIsThinking(false);
        streamingMsgIdRef.current = null;
        abortRef.current = null;
        console.error('OpenAI API error:', error);

        // Show error in the streamed message with isError flag
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  text: m.text || `Sorry, I'm having trouble connecting right now. Please try again.`,
                  isError: true,
                }
              : m,
          ),
        );
      },
    }, buildDebugCallbacks());

    abortRef.current = abort;
  }, [updateMessageText, attachOptions, getActiveDraftCardType, buildDebugCallbacks, debugLog]);

  // ─── Golden Path: play a scripted step ───

  const playGoldenStep = useCallback((step: GoldenStep, userText?: string) => {
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);

      const msgId = nextId();
      // Resolve dynamic text and tool call using the user's text
      const text = resolveStepText(step, userText || '');
      const toolCall = resolveStepToolCall(step, userText || '');

      if (toolCall?.name === 'present_draft_card') {
        // Build card from the resolved tool call arguments
        const card = functionArgsToCard(toolCall.arguments);
        setMessages(prev => [
          ...prev,
          { id: msgId, role: 'assistant' as const, text, card, timestamp: Date.now() },
        ]);
      } else if (toolCall?.name === 'present_suggestions') {
        const suggestions = toolCall.arguments.suggestions as string[];
        setMessages(prev => [
          ...prev,
          { id: msgId, role: 'assistant' as const, text, options: suggestions, timestamp: Date.now() },
        ]);
      } else {
        // Plain text response (e.g., post-submit acknowledgment)
        setMessages(prev => [
          ...prev,
          { id: msgId, role: 'assistant' as const, text, timestamp: Date.now() },
        ]);
      }
    }, step.delay);
  }, []);

  // ─── Golden Path: play a conversational edit on an existing PTO card ───

  const playPTOEdit = useCallback((editResult: {
    newType?: string;
    newStartDate?: string;
    newEndDate?: string;
    newHours?: number;
    infoMessage: string;
  }) => {
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);

      // Update the existing draft card's fields in place
      setMessages(prev => {
        const updated = prev.map(m => {
          if (m.card && m.card.state === 'draft' && m.card.actionType === 'time-off') {
            // Determine the final type (new or existing)
            const currentType = m.card.fields.find(f => f.id === 'type')?.value || 'Vacation';
            const finalType = editResult.newType || currentType;

            // Determine final dates/hours
            const currentStart = m.card.fields.find(f => f.id === 'startDate')?.value;
            const currentEnd = m.card.fields.find(f => f.id === 'endDate')?.value;
            const finalStart = editResult.newStartDate || currentStart || '';
            const finalEnd = editResult.newEndDate || currentEnd || '';
            const finalHours = editResult.newHours != null
              ? String(editResult.newHours)
              : m.card.fields.find(f => f.id === 'hours')?.value || '8';

            // Compute the real infoMessage using the final type's balance
            const balance = employeeContext.timeOff.balances.find(b => b.type === finalType)?.available ?? 0;
            const hrs = parseInt(finalHours) || 0;
            const overBalance = hrs > balance;
            const infoMessage = overBalance
              ? `\u26A0\uFE0F You're requesting ${hrs} hrs but only have ${balance} hrs ${finalType} remaining. ${employeeContext.employee.manager.name} will be notified.`
              : `${employeeContext.employee.manager.name} will be notified`;

            return {
              ...m,
              card: {
                ...m.card,
                fields: m.card.fields.map(f => {
                  if (f.id === 'type' && editResult.newType) return { ...f, value: editResult.newType };
                  if (f.id === 'startDate' && editResult.newStartDate) return { ...f, value: editResult.newStartDate };
                  if (f.id === 'endDate' && editResult.newEndDate) return { ...f, value: editResult.newEndDate };
                  if (f.id === 'hours' && editResult.newHours != null) return { ...f, value: String(editResult.newHours) };
                  return f;
                }),
                infoMessage,
                infoWarning: overBalance,
              },
            };
          }
          return m;
        });

        // Build confirmation text
        const changes: string[] = [];
        if (editResult.newType) changes.push(`type to ${editResult.newType.toLowerCase()}`);
        if (editResult.newStartDate) {
          const dateStr = formatDateRange(editResult.newStartDate, editResult.newEndDate || editResult.newStartDate);
          changes.push(`dates to ${dateStr}`);
        }
        const confirmText = changes.length > 0
          ? `Updated! Changed the ${changes.join(' and ')}.`
          : 'Updated!';

        const msgId = nextId();
        return [
          ...updated,
          { id: msgId, role: 'assistant' as const, text: confirmText, timestamp: Date.now() },
        ];
      });
    }, 500);
  }, []);

  const sendMessage = useCallback((text: string) => {
    // Mark conversation as started — welcome state should never re-render
    setConversationStarted(true);

    // Clear option buttons from the last AI message
    clearOptions();

    // Reset tool call retry guard for this new user message
    toolCallRetryCountRef.current = 0;

    // Track for retry
    lastUserTextRef.current = text;

    // Debug logging
    debugLog?.logUser(text);

    // Add user message to UI
    addMessage('user', text);

    // ─── Demo mode: route through golden paths ───
    if (demoMode) {
      // Lazily build golden paths on first use
      if (!goldenPathsRef.current) {
        goldenPathsRef.current = buildGoldenPaths();
      }

      // If we have an active path, check for a matching step trigger (multi-step flows)
      if (activePathRef.current) {
        const stepIdx = findStepByTrigger(activePathRef.current, text);
        if (stepIdx !== -1) {
          activeStepRef.current = stepIdx;
          // For pill steps in missing-type flow, pass the INITIAL user text (has dates)
          // so the dynamic card builder can extract dates from it.
          // For matchFn steps (clarification step 1), pass the current user text (has type + dates).
          const step = activePathRef.current.steps[stepIdx];
          const textForBuilder = step.matchFn
            ? text
            : (activePathRef.current.initialUserText || text);
          playGoldenStep(step, textForBuilder);
          return;
        }

        // Check for conversational edit on active PTO card
        if (activePathRef.current.id.startsWith('pto-')) {
          const editResult = detectPTOEdit(text);
          if (editResult) {
            playPTOEdit(editResult);
            return;
          }
        }
      }

      // Try to match a new golden path
      const path = findGoldenPath(text, goldenPathsRef.current);
      if (path) {
        activePathRef.current = path;
        activeStepRef.current = 0;
        // Pass user text to the first step for dynamic card building (e.g., happy path)
        playGoldenStep(path.steps[0], text);
        return;
      }

      // No golden path match — fall through to live API
      console.log('[AskBambooHR] Demo mode: no golden path match, falling through to API');
    }

    // Send to OpenAI API
    callOpenAI(text);
  }, [addMessage, clearOptions, callOpenAI, debugLog, demoMode, playGoldenStep, playPTOEdit]);

  /** Retry the last failed message */
  const retryLastMessage = useCallback(() => {
    const lastText = lastUserTextRef.current;
    if (!lastText) return;

    debugLog?.logUser(`[Retry] ${lastText}`);

    // Remove the error message from the UI
    setMessages(prev => {
      // Remove the last error message
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].isError) {
          return [...prev.slice(0, i), ...prev.slice(i + 1)];
        }
      }
      return prev;
    });

    // Also remove the last failed assistant message and user message from API history
    // (they'll be re-sent)
    const history = historyRef.current;
    // Walk back from end: remove assistant (error) then user
    let trimIdx = history.length;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'assistant' || history[i].role === 'user') {
        trimIdx = i;
        if (history[i].role === 'user') break; // Found the user msg that triggered the error
      }
    }
    historyRef.current = history.slice(0, trimIdx);

    // Re-send
    callOpenAI(lastText);
  }, [callOpenAI, debugLog]);

  const updateField = useCallback((cardId: string, fieldId: string, value: string) => {
    setMessages(prev =>
      prev.map(m => {
        if (m.card?.id !== cardId) return m;
        return {
          ...m,
          card: {
            ...m.card,
            fields: m.card.fields.map(f =>
              f.id === fieldId ? { ...f, value } : f,
            ),
          },
        };
      }),
    );
  }, []);

  const submitCard = useCallback((cardId: string) => {
    // Mark card as submitted in UI
    setMessages(prev =>
      prev.map(m => {
        if (m.card?.id !== cardId) return m;
        return {
          ...m,
          card: { ...m.card, state: 'submitted' as const },
        };
      }),
    );

    // ─── Demo mode: play the post-submit acknowledgment step ───
    if (demoMode && activePathRef.current) {
      const path = activePathRef.current;

      // For PTO paths, build a dynamic confirmation from the actual card data
      if (path.id.startsWith('pto-')) {
        const submittedCard = messages.find(m => m.card?.id === cardId)?.card;
        if (submittedCard) {
          const type = submittedCard.fields.find(f => f.id === 'type')?.value || 'time off';
          const startDate = submittedCard.fields.find(f => f.id === 'startDate')?.value;
          const endDate = submittedCard.fields.find(f => f.id === 'endDate')?.value;
          const dateStr = startDate && endDate ? ` for ${formatDateRange(startDate, endDate)}` : '';
          const ctx = employeeContext;
          const confirmText = `All set, Morgan! Your ${type.toLowerCase()} request${dateStr} has been submitted. ${ctx.employee.manager.name} will be notified.`;

          setIsThinking(true);
          setTimeout(() => {
            setIsThinking(false);
            const msgId = nextId();
            setMessages(prev => [
              ...prev,
              { id: msgId, role: 'assistant' as const, text: confirmText, timestamp: Date.now() },
            ]);
          }, 500);

          activePathRef.current = null;
          activeStepRef.current = 0;
          return;
        }
      }

      // Non-PTO paths: find the next step with trigger === null (post-submit ack)
      const currentStep = activeStepRef.current;
      for (let i = currentStep + 1; i < path.steps.length; i++) {
        if (path.steps[i].trigger === null) {
          activeStepRef.current = i;
          playGoldenStep(path.steps[i]);
          // Clear active path after post-submit ack
          activePathRef.current = null;
          activeStepRef.current = 0;
          return;
        }
      }
      // No post-submit step found — clear path and fall through
      activePathRef.current = null;
      activeStepRef.current = 0;
    }

    // Get the submitted card title for context
    const submittedMsg = messages.find(m => m.card?.id === cardId);
    const cardTitle = submittedMsg?.card?.title || 'the request';

    // Tell OpenAI the card was submitted so it can respond
    const submitText = `I submitted the ${cardTitle}.`;
    historyRef.current = [
      ...historyRef.current,
      { role: 'user', content: submitText },
    ];

    // Get the AI's response to the submission
    setIsThinking(true);
    const ackMsgId = nextId();
    streamingMsgIdRef.current = ackMsgId;
    setMessages(prev => [
      ...prev,
      { id: ackMsgId, role: 'assistant', text: '', timestamp: Date.now() },
    ]);

    const abort = sendToOpenAI(historyRef.current, {
      onText: (text) => {
        setIsThinking(false);
        updateMessageText(ackMsgId, text);
      },
      onToolCall: () => {
        // Unlikely after submission, but handle gracefully
        setIsThinking(false);
      },
      onComplete: (assistantMessage) => {
        setIsThinking(false);
        streamingMsgIdRef.current = null;
        abortRef.current = null;
        historyRef.current = [
          ...historyRef.current,
          assistantMessage,
        ];
      },
      onError: (error) => {
        setIsThinking(false);
        streamingMsgIdRef.current = null;
        abortRef.current = null;
        console.error('OpenAI API error on submit ack:', error);
        // Fallback acknowledgment
        setMessages(prev =>
          prev.map(m =>
            m.id === ackMsgId
              ? { ...m, text: `Done! Sent that to ${approver} for approval. Need anything else?` }
              : m,
          ),
        );
      },
    }, buildDebugCallbacks());
    abortRef.current = abort;
  }, [messages, updateMessageText, buildDebugCallbacks, demoMode, playGoldenStep]);

  return {
    messages,
    isThinking,
    conversationStarted,
    sendMessage,
    updateField,
    submitCard,
    retryLastMessage,
  };
}
