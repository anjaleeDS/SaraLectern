import { useState } from 'react';
import { KeyRound, ExternalLink } from 'lucide-react';

interface Props {
  missingAnthropic: boolean;
  missingGemini: boolean;
  onKeys: (keys: { anthropic?: string; gemini?: string }) => void;
}

export default function ApiKeyGate({ missingAnthropic, missingGemini, onKeys }: Props) {
  const [anthropic, setAnthropic] = useState('');
  const [gemini, setGemini] = useState('');
  const [errors, setErrors] = useState<{ anthropic?: string; gemini?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};

    if (missingAnthropic) {
      if (!anthropic.trim().startsWith('sk-ant-')) {
        next.anthropic = 'Key must start with sk-ant-';
      }
    }
    if (missingGemini) {
      if (gemini.trim().length < 10) {
        next.gemini = 'Please enter a valid Gemini API key';
      }
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    onKeys({
      ...(missingAnthropic ? { anthropic: anthropic.trim() } : {}),
      ...(missingGemini ? { gemini: gemini.trim() } : {}),
    });
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm max-w-md w-full p-8">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-5">
          <KeyRound size={22} className="text-amber-700" />
        </div>
        <h1 className="text-xl font-semibold text-stone-900 mb-1">API Keys Required</h1>
        <p className="text-sm text-stone-500 mb-6 leading-relaxed">
          Lectern uses Claude for conversation and pitch drafting, and Gemini for processing
          uploaded files and videos. Your keys are stored only in your browser session.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {missingAnthropic && (
            <div>
              <label className="text-xs font-medium text-stone-600 uppercase tracking-wider block mb-1.5">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={anthropic}
                onChange={e => { setAnthropic(e.target.value); setErrors(p => ({ ...p, anthropic: undefined })); }}
                placeholder="sk-ant-api03-..."
                autoFocus
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
              />
              {errors.anthropic && <p className="text-xs text-red-600 mt-1.5">{errors.anthropic}</p>}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors mt-1.5"
              >
                <ExternalLink size={11} />
                console.anthropic.com
              </a>
            </div>
          )}

          {missingGemini && (
            <div>
              <label className="text-xs font-medium text-stone-600 uppercase tracking-wider block mb-1.5">
                Gemini API Key
              </label>
              <input
                type="password"
                value={gemini}
                onChange={e => { setGemini(e.target.value); setErrors(p => ({ ...p, gemini: undefined })); }}
                placeholder="AIza..."
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
              />
              {errors.gemini && <p className="text-xs text-red-600 mt-1.5">{errors.gemini}</p>}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors mt-1.5"
              >
                <ExternalLink size={11} />
                aistudio.google.com
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={
              (missingAnthropic && !anthropic.trim()) ||
              (missingGemini && !gemini.trim())
            }
            className="w-full bg-stone-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Lectern
          </button>
        </form>
      </div>
    </div>
  );
}
