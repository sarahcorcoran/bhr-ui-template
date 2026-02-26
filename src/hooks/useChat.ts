import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, DraftCardData } from '../components/DraftCard/types';
import {
  allScripts,
  fallbackResponse,
  type ConversationScript,
  type ScriptStep,
} from '../data/scriptedConversations';
import { approver } from '../data/employeeContext';

let msgCounter = 0;
function nextId() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

interface ActiveScript {
  script: ConversationScript;
  stepIndex: number;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const activeScriptRef = useRef<ActiveScript | null>(null);

  const addMessage = useCallback((
    role: ChatMessage['role'],
    text: string,
    card?: DraftCardData,
  ): string => {
    const id = nextId();
    setMessages(prev => [...prev, { id, role, text, card, timestamp: Date.now() }]);
    return id;
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    activeScriptRef.current = null;
    setIsThinking(false);
  }, []);

  const processStep = useCallback((step: ScriptStep) => {
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      // Deep-clone card data so each instance is independent
      const cardCopy = step.card ? JSON.parse(JSON.stringify(step.card)) : undefined;
      addMessage('assistant', step.aiText, cardCopy);
    }, step.thinkDuration);
  }, [addMessage]);

  const sendMessage = useCallback((text: string) => {
    addMessage('user', text);

    // Check if we're mid-script (e.g., low-context flow waiting for step 2)
    const active = activeScriptRef.current;
    if (active) {
      const nextIndex = active.stepIndex + 1;
      if (nextIndex < active.script.steps.length) {
        activeScriptRef.current = { ...active, stepIndex: nextIndex };
        processStep(active.script.steps[nextIndex]);
        return;
      }
      // Script exhausted — clear and try matching a new one
      activeScriptRef.current = null;
    }

    // Try to match a new script
    for (const script of allScripts) {
      if (script.triggers.some(pattern => pattern.test(text))) {
        activeScriptRef.current = { script, stepIndex: 0 };
        processStep(script.steps[0]);
        return;
      }
    }

    // No match — fallback
    processStep(fallbackResponse);
  }, [addMessage, processStep]);

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
    // Find the card to build dynamic summary
    const msg = messages.find(m => m.card?.id === cardId);
    const card = msg?.card;

    setMessages(prev =>
      prev.map(m => {
        if (m.card?.id !== cardId) return m;
        return {
          ...m,
          card: { ...m.card, state: 'submitted' as const },
        };
      }),
    );

    // Post-submit AI message after 500ms
    setTimeout(() => {
      addMessage(
        'assistant',
        `Done! Sent that to ${approver} for approval. Need anything else?`,
      );
    }, 500);
  }, [messages, addMessage]);

  return {
    messages,
    isThinking,
    sendMessage,
    updateField,
    submitCard,
    clearChat,
  };
}
