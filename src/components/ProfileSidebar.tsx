import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ProfileSidebar() {
  const { profile, topics, outreach, screen } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!profile || screen === 'intake') return null;

  const lockedTopics = topics.filter(t => t.locked);
  const totalSent = outreach.filter(o => o.status !== 'Queued').length;
  const totalResponded = outreach.filter(o => ['Responded', 'Confirmed'].includes(o.status)).length;
  const responseRate = totalSent > 0 ? Math.round((totalResponded / totalSent) * 100) : 0;

  const content = (
    <>
      <div className="mb-5">
        <div className="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center text-sm font-semibold mb-3">
          {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="font-semibold text-stone-900 text-sm">{profile.name}</div>
        <div className="text-xs text-stone-500 mt-0.5">{profile.title}</div>
      </div>

      <div className="border-t border-stone-200 pt-4 mb-4">
        <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Expertise</div>
        <div className="flex flex-wrap gap-1">
          {profile.expertise_areas.map(e => (
            <span key={e} className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
              {e}
            </span>
          ))}
        </div>
      </div>

      {lockedTopics.length > 0 && (
        <div className="border-t border-stone-200 pt-4 mb-4">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Topics</div>
          <div className="space-y-1.5">
            {lockedTopics.map(t => (
              <div key={t.id} className="text-xs text-stone-700 flex items-start gap-1.5">
                <span className="text-stone-400 mt-0.5">—</span>
                <span>{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {outreach.length > 0 && (
        <div className="border-t border-stone-200 pt-4">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Outreach</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded border border-stone-200 p-2 text-center">
              <div className="text-lg font-semibold text-stone-900">{totalSent}</div>
              <div className="text-xs text-stone-500">Sent</div>
            </div>
            <div className="bg-white rounded border border-stone-200 p-2 text-center">
              <div className="text-lg font-semibold text-stone-900">{responseRate}%</div>
              <div className="text-xs text-stone-500">Response</div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile collapsible bar */}
      <div className="md:hidden fixed bottom-8 left-0 right-0 z-40 px-4">
        <div className="bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-stone-800 text-white flex items-center justify-center text-xs font-semibold">
                {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-stone-900">{profile.name}</div>
                <div className="text-xs text-stone-500">{profile.title}</div>
              </div>
            </div>
            {mobileOpen ? <ChevronDown size={16} className="text-stone-400" /> : <ChevronUp size={16} className="text-stone-400" />}
          </button>
          {mobileOpen && (
            <div className="px-4 pb-4 border-t border-stone-100">
              <div className="pt-3">
                <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Expertise</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {profile.expertise_areas.map(e => (
                    <span key={e} className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded">{e}</span>
                  ))}
                </div>
                {lockedTopics.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Topics</div>
                    <div className="space-y-1">
                      {lockedTopics.map(t => (
                        <div key={t.id} className="text-xs text-stone-700 flex items-start gap-1.5">
                          <span className="text-stone-400">—</span>
                          <span>{t.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {outreach.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-stone-50 rounded border border-stone-200 p-2 text-center">
                      <div className="text-base font-semibold text-stone-900">{totalSent}</div>
                      <div className="text-xs text-stone-500">Sent</div>
                    </div>
                    <div className="bg-stone-50 rounded border border-stone-200 p-2 text-center">
                      <div className="text-base font-semibold text-stone-900">{responseRate}%</div>
                      <div className="text-xs text-stone-500">Response</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-l border-stone-200 bg-stone-50 p-5 overflow-y-auto">
        {content}
      </aside>
    </>
  );
}
