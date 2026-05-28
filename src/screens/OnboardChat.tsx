import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { sendOnboardingMessage, extractProfile } from '../lib/claude';
import { ChatMessage } from '../types';
import { Send, RefreshCw, AlertCircle } from 'lucide-react';

export default function OnboardChat() {
  const { chatMessages, addChatMessage, updateLastAssistantMessage, setProfile, setScreen } = useApp();
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Full conversation history sent to the API (includes the hidden kick-off turn).
  const apiMessages = useRef<ChatMessage[]>([]);
  // Guard: prevents the kick-off from firing more than once (React StrictMode runs effects twice in dev).
  const kickedOff = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, error]);

  // ── core API call ──────────────────────────────────────────────────────────

  async function callApi(messages: ChatMessage[]) {
    setError(null);
    addChatMessage({ role: 'assistant', content: '' });
    setStreaming(true);
    try {
      const full = await sendOnboardingMessage(messages, (chunk) =>
        updateLastAssistantMessage(chunk)
      );
      setStreaming(false);
      const profile = extractProfile(full);
      if (profile) {
        setProfile(profile);
        setTimeout(() => setScreen('confirm'), 600);
      }
    } catch (err) {
      setStreaming(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // ── initial kick-off ───────────────────────────────────────────────────────

  useEffect(() => {
    if (kickedOff.current) return;
    kickedOff.current = true;
    if (chatMessages.length > 0) return; // resumed session
    const kickOff: ChatMessage[] = [{ role: 'user', content: 'Hello, I would like to get started.' }];
    apiMessages.current = kickOff;
    callApi(kickOff);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync completed assistant reply into apiMessages so subsequent turns include it.
  useEffect(() => {
    if (streaming) return;
    const last = chatMessages[chatMessages.length - 1];
    if (!last || last.role !== 'assistant' || !last.content) return;
    const prev = apiMessages.current;
    const lastApi = prev[prev.length - 1];
    if (lastApi?.role === 'assistant') {
      apiMessages.current = [...prev.slice(0, -1), last];
    } else {
      apiMessages.current = [...prev, last];
    }
  }, [streaming]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── send ───────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content: text };
    addChatMessage(userMsg);

    const prev = apiMessages.current.filter(m => !(m.role === 'assistant' && m.content === ''));
    const updated = [...prev, userMsg];
    apiMessages.current = updated;

    await callApi(updated);
  };

  const handleRetry = () => {
    const trimmed = apiMessages.current.filter(m => !(m.role === 'assistant' && !m.content));
    apiMessages.current = trimmed;
    callApi(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-8 py-6 border-b border-stone-200 bg-white">
        <h1 className="text-xl font-semibold text-stone-900">Speaker Onboarding</h1>
        <p className="text-sm text-stone-500 mt-1">
          Tell us about your professional background. We'll build your speaker profile from this conversation.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-5">
        {chatMessages.map((msg, i) => {
          const isLastStreaming = streaming && i === chatMessages.length - 1;
          const displayContent = msg.content.replace(/<profile>[\s\S]*?<\/profile>/g, '').trim();
          const isVisible = displayContent || isLastStreaming;
          if (!isVisible) return null;
          return (
            <div key={i} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                msg.role === 'assistant' ? 'bg-amber-500 text-white' : 'bg-stone-800 text-white'
              }`}>
                {msg.role === 'assistant' ? 'L' : 'You'}
              </div>
              <div className={`max-w-[85%] md:max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-white border border-stone-200 text-stone-800 shadow-sm'
                  : 'bg-stone-800 text-white'
              }`}>
                {displayContent || (
                  <span className="flex items-center gap-2 text-stone-400 text-xs">
                    <span className="inline-flex gap-1">
                      {[0, 150, 300].map(delay => (
                        <span
                          key={delay}
                          className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </span>
                    Thinking…
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {error && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 shrink-0">
              <AlertCircle size={16} className="text-red-600" />
            </div>
            <div className="flex-1 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <p className="text-sm font-medium text-red-800 mb-1">Something went wrong</p>
              <p className="text-xs text-red-700 font-mono break-all mb-3">{error}</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-4 md:px-8 py-5 border-t border-stone-200 bg-white">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response…"
            disabled={streaming}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:opacity-50 disabled:bg-stone-50 transition-shadow"
          />
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
