import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bug, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { MODEL } from '../lib/claude';

export default function DebugPanel() {
  const { apiLogs, clearApiLogs } = useApp();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const pending = apiLogs.filter(l => l.status === 'pending').length;
  const errors = apiLogs.filter(l => l.status === 'error').length;

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full md:w-[480px]">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-2 text-xs font-mono border-t transition-colors ${
          errors > 0
            ? 'bg-red-900 text-red-100 border-red-700'
            : pending > 0
            ? 'bg-amber-900 text-amber-100 border-amber-700'
            : 'bg-stone-900 text-stone-300 border-stone-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <Bug size={13} />
          <span>Debug Panel — model: {MODEL}</span>
          {errors > 0 && <span className="bg-red-500 text-white px-1.5 rounded">{errors} error{errors > 1 ? 's' : ''}</span>}
          {pending > 0 && <span className="bg-amber-500 text-stone-900 px-1.5 rounded">{pending} pending</span>}
          <span className="text-stone-500">{apiLogs.length} calls</span>
        </div>
        <div className="flex items-center gap-2">
          {open && (
            <button
              onClick={e => { e.stopPropagation(); clearApiLogs(); }}
              className="hover:text-white transition-colors"
              title="Clear logs"
            >
              <Trash2 size={13} />
            </button>
          )}
          {open ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </div>
      </button>

      {open && (
        <div className="bg-stone-950 border-t border-stone-700 max-h-72 overflow-y-auto">
          {apiLogs.length === 0 ? (
            <div className="px-4 py-6 text-xs text-stone-500 font-mono text-center">No API calls yet.</div>
          ) : (
            <div className="divide-y divide-stone-800">
              {apiLogs.map(log => (
                <div key={log.id} className="px-4 py-2.5">
                  <div
                    className="flex items-center justify-between gap-2 cursor-pointer"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        log.status === 'pending' ? 'bg-amber-400 animate-pulse' :
                        log.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                      }`} />
                      <span className="text-xs font-mono text-stone-200 truncate">{log.fn}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {log.durationMs !== undefined && (
                        <span className="text-xs font-mono text-stone-500">{log.durationMs}ms</span>
                      )}
                      {log.inputTokens !== undefined && (
                        <span className="text-xs font-mono text-stone-500">{log.inputTokens}in/{log.outputTokens}out</span>
                      )}
                      <span className="text-xs font-mono text-stone-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      {expanded === log.id ? <ChevronDown size={11} className="text-stone-500" /> : <ChevronUp size={11} className="text-stone-500" />}
                    </div>
                  </div>
                  {expanded === log.id && (
                    <div className="mt-2 text-xs font-mono">
                      <div className="text-stone-400">id: <span className="text-stone-300">{log.id}</span></div>
                      <div className="text-stone-400">model: <span className="text-stone-300">{log.model}</span></div>
                      <div className="text-stone-400">status: <span className={
                        log.status === 'success' ? 'text-emerald-400' : log.status === 'error' ? 'text-red-400' : 'text-amber-400'
                      }>{log.status}</span></div>
                      {log.error && (
                        <div className="mt-1.5 bg-red-950 border border-red-800 rounded p-2 text-red-300 whitespace-pre-wrap break-all">
                          {log.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
