import { useState, useEffect, useRef } from 'react';

/**
 * Simulates word-by-word streaming of text.
 * Split by whitespace boundaries to preserve markdown-safe tokens.
 *
 * @param text      Full text to stream
 * @param isActive  Whether streaming should run (false → returns full text immediately)
 * @param speed     Interval in ms between token advances (default 25 → ~40 words/sec)
 * @returns { displayText, isStreaming }
 */
export function useStreamingText(
  text: string,
  isActive: boolean,
  speed = 25,
): { displayText: string; isStreaming: boolean } {
  const [tokenIndex, setTokenIndex] = useState(0);
  const tokensRef = useRef<string[]>([]);
  const prevTextRef = useRef('');

  // Tokenise whenever the source text changes
  useEffect(() => {
    if (text !== prevTextRef.current) {
      // split preserving whitespace tokens: ["word", " ", "word", " ", ...]
      tokensRef.current = text.split(/(\s+)/);
      prevTextRef.current = text;
      setTokenIndex(0);
    }
  }, [text]);

  // Advance tokens while active
  useEffect(() => {
    if (!isActive) return;

    const tokens = tokensRef.current;
    if (tokens.length === 0) return;

    const interval = setInterval(() => {
      setTokenIndex(prev => {
        // Advance by 2 tokens per tick (word + whitespace)
        const next = prev + 2;
        if (next >= tokens.length) {
          clearInterval(interval);
          return tokens.length;
        }
        return next;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isActive, speed, text]);

  // Build display text
  const tokens = tokensRef.current;
  const isStreaming = isActive && tokenIndex < tokens.length;
  const displayText = isActive ? tokens.slice(0, tokenIndex).join('') : text;

  return { displayText, isStreaming };
}
