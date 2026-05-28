import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { generatePitch } from '../lib/claude';
import { PitchDraft } from '../types';
import { Loader2, CheckCircle, AlertTriangle, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import BackButton from '../components/BackButton';

function VerifyHighlight({ text }: { text: string }) {
  const parts = text.split(/(\[VERIFY\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part === '[VERIFY]' ? (
          <span key={i} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-xs font-medium mx-0.5">
            <AlertTriangle size={11} />
            VERIFY
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function PitchCard({ draft, onEdit, onApprove, onRetry, error }: {
  draft: PitchDraft;
  onEdit: (venueId: string, body: string) => void;
  onApprove: (venueId: string) => void;
  onRetry?: () => void;
  error?: string | null;
}) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(draft.body);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setHasScrolled(true);
    }
  };

  useEffect(() => {
    setEditValue(draft.body);
  }, [draft.body]);

  const handleSaveEdit = () => {
    onEdit(draft.venueId, editValue);
    setEditing(false);
  };

  const hasVerify = draft.body.includes('[VERIFY]');

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all ${
      draft.approved ? 'border-emerald-300' : error ? 'border-red-200' : 'border-stone-200'
    }`}>
      <div className="px-5 py-4 border-b border-stone-100 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-medium text-stone-900 text-sm">{draft.venueName}</span>
            {draft.approved && <CheckCircle size={15} className="text-emerald-500" />}
            {draft.edited && !draft.approved && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Edited</span>
            )}
          </div>
          <div className="text-xs text-stone-500">Topic: {draft.topicTitle || '—'}</div>
        </div>
      </div>

      {error ? (
        <div className="px-5 py-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle size={15} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-red-800 font-medium mb-1">Pitch Drafting Agent failed</p>
              <p className="text-xs text-red-700 font-mono break-all">{error}</p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          )}
        </div>
      ) : draft.body ? (
        <>
          <div className="px-5 py-3 bg-stone-50 border-b border-stone-100">
            <div className="text-xs text-stone-500 mb-1">Subject line</div>
            <div className="text-sm font-medium text-stone-800">{draft.subjectLine}</div>
          </div>

          {hasVerify && (
            <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <AlertTriangle size={13} className="text-amber-600" />
              <span className="text-xs text-amber-800">This draft contains items flagged for verification before sending.</span>
            </div>
          )}

          {editing ? (
            <div className="p-5">
              <textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="w-full text-sm text-stone-800 leading-relaxed border border-stone-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none h-48"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSaveEdit}
                  className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditValue(draft.body); }}
                  className="text-xs text-stone-500 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="px-5 py-4 max-h-52 overflow-y-auto text-sm text-stone-700 leading-relaxed whitespace-pre-wrap"
            >
              <VerifyHighlight text={draft.body} />
            </div>
          )}

          {!editing && !draft.approved && (
            <div className="px-5 py-3 border-t border-stone-100 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-stone-600 hover:text-stone-900 transition-colors"
              >
                Edit draft
              </button>
              <button
                onClick={() => onApprove(draft.venueId)}
                disabled={!hasScrolled}
                title={!hasScrolled ? 'Scroll through the full draft to enable approval' : ''}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
              >
                <CheckCircle size={13} />
                Approve & Queue
              </button>
            </div>
          )}
          {draft.approved && (
            <div className="px-5 py-3 border-t border-emerald-100 bg-emerald-50">
              <span className="text-xs text-emerald-700 flex items-center gap-1.5">
                <CheckCircle size={13} />
                Approved {draft.edited ? '(edited)' : '(as-is)'} — queued for outreach
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="px-5 py-8 flex items-center gap-3 text-stone-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Pitch Drafting Agent is working...
        </div>
      )}
    </div>
  );
}

export default function PitchDrafts() {
  const {
    profile, topics, venueMatches, pitchDrafts, setPitchDrafts,
    updatePitchBody, approvePitch, setOutreach, setScreen
  } = useApp();

  const [generating, setGenerating] = useState(false);
  const [pitchErrors, setPitchErrors] = useState<Record<string, string>>({});
  const selectedMatches = venueMatches.filter(v => v.selected);

  const generateOne = (venueId: string) => {
    const vm = selectedMatches.find(v => v.venue.id === venueId);
    if (!vm) return;
    const i = selectedMatches.indexOf(vm);
    const matchingTopic = topics[i % topics.length];

    setPitchErrors(prev => { const next = { ...prev }; delete next[venueId]; return next; });

    generatePitch(
      profile!,
      matchingTopic,
      vm.venue.name,
      vm.venue.audience,
      vm.venue.vertical,
      () => {}
    ).then(({ subjectLine, body }) => {
      setPitchDrafts((prev: PitchDraft[]) => prev.map(p =>
        p.venueId === vm.venue.id
          ? { ...p, subjectLine, body, originalBody: body, topicTitle: matchingTopic.title }
          : p
      ));
    }).catch(err => {
      const msg = err instanceof Error ? err.message : String(err);
      setPitchErrors(prev => ({ ...prev, [venueId]: msg }));
    });
  };

  useEffect(() => {
    if (pitchDrafts.length === 0 && !generating) {
      setGenerating(true);
      const initial: PitchDraft[] = selectedMatches.map(vm => ({
        venueId: vm.venue.id,
        venueName: vm.venue.name,
        topicTitle: '',
        subjectLine: '',
        body: '',
        approved: false,
        edited: false,
        originalBody: '',
      }));
      setPitchDrafts(initial);
      selectedMatches.forEach(vm => generateOne(vm.venue.id));
      setGenerating(false);
    }
  }, []);

  const handleStartOutreach = () => {
    const approved = pitchDrafts.filter(p => p.approved);
    setOutreach(approved.map(p => ({
      venueId: p.venueId,
      venueName: p.venueName,
      topicTitle: p.topicTitle,
      status: 'Queued',
      lastUpdated: new Date().toLocaleDateString(),
      pitchBody: p.body,
      subjectLine: p.subjectLine,
    })));
    setScreen('dashboard');
  };

  const approvedCount = pitchDrafts.filter(p => p.approved).length;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 md:px-8 py-6 border-b border-stone-200">
        <div className="flex items-center gap-3 mb-1">
          <BackButton
            warningTitle="Go back to Venue Selection?"
            warningBody="All generated pitch drafts will be discarded. You'll need to regenerate pitches for any venues you re-select. This cannot be undone."
          />
          <h1 className="text-xl font-semibold text-stone-900">Pitch Drafts</h1>
        </div>
        <p className="text-sm text-stone-500 mt-1">Review each pitch carefully before approving. Scroll the full draft to enable approval.</p>
      </div>

      <div className="flex-1 px-4 md:px-8 py-6">
        <div className="max-w-2xl space-y-4">
          {pitchDrafts.map(draft => (
            <PitchCard
              key={draft.venueId}
              draft={draft}
              onEdit={updatePitchBody}
              onApprove={approvePitch}
              error={pitchErrors[draft.venueId] ?? null}
              onRetry={() => generateOne(draft.venueId)}
            />
          ))}
        </div>
      </div>

      <div className="px-4 md:px-8 py-5 border-t border-stone-200 bg-white">
        <button
          onClick={handleStartOutreach}
          disabled={approvedCount === 0}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Go to Outreach Dashboard ({approvedCount} approved)
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
