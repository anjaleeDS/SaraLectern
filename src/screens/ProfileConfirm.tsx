import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SpeakerProfile } from '../types';
import { AlertCircle, Check, ChevronRight, Mic, Users } from 'lucide-react';
import BackButton from '../components/BackButton';

function EditableField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="group">
      <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">{label}</div>
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          className="w-full text-sm text-stone-900 border border-amber-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="text-sm text-stone-800 cursor-pointer hover:text-amber-700 transition-colors px-1 -mx-1 rounded hover:bg-amber-50 py-0.5"
        >
          {value || <span className="text-stone-400 italic">Click to add</span>}
        </div>
      )}
    </div>
  );
}

function EditableNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="group">
      <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">{label}</div>
      {editing ? (
        <input
          autoFocus
          type="number"
          value={value}
          onChange={e => onChange(parseInt(e.target.value) || 0)}
          onBlur={() => setEditing(false)}
          className="w-full text-sm text-stone-900 border border-amber-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="text-sm text-stone-800 cursor-pointer hover:text-amber-700 transition-colors px-1 -mx-1 rounded hover:bg-amber-50 py-0.5"
        >
          {value > 0 ? `${value} years` : <span className="text-stone-400 italic">Click to set</span>}
        </div>
      )}
    </div>
  );
}

function EditableArray({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [newItem, setNewItem] = useState('');

  return (
    <div>
      <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, i) => (
          editingIdx === i ? (
            <input
              key={i}
              autoFocus
              value={item}
              onChange={e => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
              onBlur={() => setEditingIdx(null)}
              onKeyDown={e => e.key === 'Enter' && setEditingIdx(null)}
              className="text-xs border border-amber-400 rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-amber-300 w-40"
            />
          ) : (
            <span
              key={i}
              onClick={() => setEditingIdx(i)}
              className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full cursor-pointer hover:bg-amber-100 hover:text-amber-800 transition-colors"
            >
              {item}
            </span>
          )
        ))}
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && newItem.trim()) {
              onChange([...value, newItem.trim()]);
              setNewItem('');
            }
          }}
          placeholder="+ add"
          className="text-xs border border-dashed border-stone-300 rounded-full px-3 py-1 focus:outline-none focus:border-amber-400 w-20 text-stone-500 placeholder:text-stone-400"
        />
      </div>
    </div>
  );
}

function computeCompleteness(p: SpeakerProfile): { score: number; missing: string[] } {
  const checks: [boolean, string][] = [
    [!!p.name?.trim(), 'Full name'],
    [!!p.title?.trim(), 'Title'],
    [p.years_experience > 0, 'Years of experience'],
    [!!p.target_audience?.trim(), 'Target audience'],
    [!!p.speaking_experience?.trim(), 'Speaking experience'],
    [p.expertise_areas.length >= 2, 'Expertise areas (2+)'],
    [p.key_achievements.length >= 1, 'Key achievements'],
  ];
  const done = checks.filter(([v]) => v);
  return {
    score: Math.round((done.length / checks.length) * 100),
    missing: checks.filter(([v]) => !v).map(([, label]) => label),
  };
}

const VENUE_TEASERS = [
  { type: 'podcast', label: 'B2B leadership podcasts', icon: Mic, color: 'bg-sky-100 text-sky-700' },
  { type: 'conference', label: 'Mid-size tech conferences', icon: Users, color: 'bg-emerald-100 text-emerald-700' },
  { type: 'podcast', label: 'Industry-specific interview shows', icon: Mic, color: 'bg-amber-100 text-amber-700' },
];

export default function ProfileConfirm() {
  const { profile, setProfile, setScreen } = useApp();
  const [local, setLocal] = useState<SpeakerProfile | null>(profile);

  useEffect(() => {
    if (profile && !local) setLocal(profile);
  }, [profile]);

  const update = <K extends keyof SpeakerProfile>(key: K, value: SpeakerProfile[K]) => {
    setLocal(p => p ? { ...p, [key]: value } : p);
  };

  const handleConfirm = () => {
    if (!local) return;
    setProfile(local);
    setScreen('preferences');
  };

  if (!local) return null;

  const { score, missing } = computeCompleteness(local);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 md:px-8 py-6 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <BackButton
            warningTitle="Go back to intake?"
            warningBody="Your AI-extracted profile will be cleared. You'll need to re-submit your background. Any manual edits on this page will be lost."
          />
          <h1 className="text-xl font-semibold text-stone-900">Your Profile</h1>
        </div>

        {/* Completeness bar */}
        <div className="mt-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-stone-500">Profile completeness</span>
            <span className={`text-xs font-semibold ${score >= 85 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
              {score}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                score >= 85 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
          {missing.length > 0 && (
            <p className="text-xs text-stone-400 mt-1.5">
              Add {missing.slice(0, 2).join(' and ')}{missing.length > 2 ? ` +${missing.length - 2} more` : ''} for better matches
            </p>
          )}
        </div>

        <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">Review carefully. Your pitch content will be built from this profile only. Click any field to edit.</p>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-8 py-6">
        <div className="max-w-2xl space-y-6">
          <div className="bg-white border border-stone-200 rounded-xl p-5 md:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <EditableField label="Full Name" value={local.name} onChange={v => update('name', v)} />
              <EditableField label="Title" value={local.title} onChange={v => update('title', v)} />
            </div>
            <EditableNumber label="Years of Experience" value={local.years_experience} onChange={v => update('years_experience', v)} />
            <EditableField label="Target Audience" value={local.target_audience} onChange={v => update('target_audience', v)} />
            <EditableField label="Speaking Experience" value={local.speaking_experience} onChange={v => update('speaking_experience', v)} />
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5 md:p-6 space-y-5">
            <EditableArray
              label="Expertise Areas"
              value={local.expertise_areas}
              onChange={v => update('expertise_areas', v)}
            />
            <EditableArray
              label="Key Achievements"
              value={local.key_achievements}
              onChange={v => update('key_achievements', v)}
            />
          </div>

          {/* Venue teaser */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-stone-700">Based on your profile, you match well with...</p>
              <span className="text-xs text-stone-400">Confirm profile to unlock</span>
            </div>
            <div className="space-y-2">
              {VENUE_TEASERS.map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100 relative overflow-hidden">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${t.color}`}>
                    <t.icon size={11} />
                    {t.type}
                  </span>
                  <span className="text-sm text-stone-500 blur-sm select-none flex-1">{t.label}</span>
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-5 border-t border-stone-200 bg-white">
        <button
          onClick={handleConfirm}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors"
        >
          <Check size={16} />
          These look right
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
