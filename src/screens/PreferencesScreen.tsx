import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SpeakerPreferences } from '../types';
import { ChevronRight, Mic, Users, BookOpen, Globe, Tv, Presentation as PresentationIcon, Info } from 'lucide-react';
import BackButton from '../components/BackButton';

const FORMAT_OPTIONS = [
  { id: 'podcast', label: 'Podcast', icon: Mic },
  { id: 'video_podcast', label: 'Video Podcast', icon: Tv },
  { id: 'conference_talk', label: 'Conference Talk', icon: PresentationIcon },
  { id: 'panel', label: 'Panel', icon: Users },
  { id: 'workshop', label: 'Workshop', icon: BookOpen },
  { id: 'digital_event', label: 'Digital Event / Webinar', icon: Globe },
];

const STYLE_OPTIONS = [
  { id: 'inspirational', label: 'Inspirational' },
  { id: 'technical', label: 'Technical deep-dive' },
  { id: 'practical', label: 'Practical how-to' },
  { id: 'provocative', label: 'Provocative' },
  { id: 'storytelling', label: 'Storytelling' },
];

const GEO_OPTIONS = [
  { id: 'remote', label: 'Remote / Virtual' },
  { id: 'domestic', label: 'Domestic travel' },
  { id: 'international', label: 'International' },
];

const AUDIENCE_SIZE_OPTIONS = [
  {
    id: 'intimate',
    label: 'Intimate',
    range: '1–100',
    desc: 'Roundtables, workshop rooms, podcast recording sessions',
    icon: Mic,
  },
  {
    id: 'mid',
    label: 'Mid-size',
    range: '100–500',
    desc: 'Industry meetups, conference breakouts, niche summits',
    icon: Users,
  },
  {
    id: 'growing',
    label: 'Growing',
    range: '500–1,500',
    desc: 'Regional conferences, multi-track events, large video podcasts',
    icon: PresentationIcon,
  },
  {
    id: 'any',
    label: 'Any size',
    range: 'Open',
    desc: 'Open to whatever the right fit looks like',
    icon: Globe,
  },
];

const DEFAULT_PREFS: SpeakerPreferences = {
  formats: [],
  audience_size: 'any',
  audience_gender: 'any',
  audience_demo: '',
  geography: ['remote', 'domestic'],
  timing: 'flexible',
  compensation: 'open_unpaid',
  focus_topics: [],
  avoid_topics: [],
  style: [],
  said_no_to: '',
  dream_opportunity: '',
};

const AUDIENCE_GENDER_OPTIONS = [
  { id: 'women_only', label: 'Women only' },
  { id: 'mixed', label: 'Mixed audiences' },
  { id: 'any', label: 'Any audience' },
];

function ChipButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
        active
          ? 'bg-stone-900 text-white border-stone-900'
          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-900'
      }`}
    >
      {children}
    </button>
  );
}

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');

  const add = () => {
    const t = input.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput('');
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-stone-200 rounded-lg bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-transparent">
      {value.map(tag => (
        <span key={tag} className="flex items-center gap-1 text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter(v => v !== tag))}
            className="text-stone-400 hover:text-stone-700 ml-0.5"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={value.length === 0 ? placeholder : '+ add'}
        className="flex-1 min-w-[80px] text-xs outline-none placeholder:text-stone-400 bg-transparent py-0.5"
      />
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-stone-300 hover:text-stone-500 transition-colors"
      >
        <Info size={12} />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 text-xs bg-stone-900 text-stone-100 rounded-lg px-3 py-2 z-50 shadow-lg leading-relaxed pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
        </span>
      )}
    </span>
  );
}

export default function PreferencesScreen() {
  const { profile, setProfile, setScreen } = useApp();

  const initialPrefs: SpeakerPreferences = profile?.preferences ?? DEFAULT_PREFS;
  const [prefs, setPrefs] = useState<SpeakerPreferences>(initialPrefs);

  const updatePref = <K extends keyof SpeakerPreferences>(key: K, value: SpeakerPreferences[K]) => {
    setPrefs(p => ({ ...p, [key]: value }));
  };

  const toggleArrayPref = (key: 'formats' | 'geography' | 'style', id: string) => {
    setPrefs(p => {
      const arr = p[key] as string[];
      return { ...p, [key]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
    });
  };

  const handleContinue = () => {
    if (!profile) return;
    setProfile({ ...profile, preferences: prefs });
    setScreen('topics');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 md:px-8 py-6 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-3 mb-1">
          <BackButton
            warningTitle="Go back to profile review?"
            warningBody="Your preference selections on this page will be discarded. Your profile will remain saved."
          />
          <h1 className="text-xl font-semibold text-stone-900">What does a great opportunity look like?</h1>
        </div>
        <p className="text-sm text-stone-500 mt-1 ml-9">
          These aren't filters — they help us rank opportunities that are genuinely right for you.
        </p>
        <p className="text-xs text-stone-400 mt-0.5 ml-9">
          We focus on venues under 1,500 — where rising speakers get real traction.
        </p>
      </div>

      <div className="flex-1 px-4 md:px-8 py-6">
        <div className="max-w-2xl space-y-5">

          {/* Format */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <div className="text-sm font-semibold text-stone-800 mb-3">Format</div>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleArrayPref('formats', opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    prefs.formats.includes(opt.id)
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <opt.icon size={12} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audience size */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <div className="text-sm font-semibold text-stone-800 mb-3">Audience size</div>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCE_SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updatePref('audience_size', opt.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    prefs.audience_size === opt.id
                      ? 'bg-stone-900 border-stone-900'
                      : 'bg-white border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <opt.icon size={12} className={prefs.audience_size === opt.id ? 'text-amber-300' : 'text-stone-400'} />
                    <span className={`text-xs font-semibold ${prefs.audience_size === opt.id ? 'text-white' : 'text-stone-800'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs ml-auto text-stone-400">{opt.range}</span>
                  </div>
                  <p className={`text-xs leading-snug ${prefs.audience_size === opt.id ? 'text-stone-300' : 'text-stone-400'}`}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <div className="text-sm font-semibold text-stone-800 mb-1">Your speaking style</div>
            <p className="text-xs text-stone-400 mb-3">How would your audience describe you?</p>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map(opt => (
                <ChipButton
                  key={opt.id}
                  active={prefs.style.includes(opt.id)}
                  onClick={() => toggleArrayPref('style', opt.id)}
                >
                  {opt.label}
                </ChipButton>
              ))}
            </div>
          </div>

          {/* Geography */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <div className="text-sm font-semibold text-stone-800 mb-3">Geography</div>
            <div className="flex flex-wrap gap-2">
              {GEO_OPTIONS.map(opt => (
                <ChipButton
                  key={opt.id}
                  active={prefs.geography.includes(opt.id)}
                  onClick={() => toggleArrayPref('geography', opt.id)}
                >
                  {opt.label}
                </ChipButton>
              ))}
            </div>
          </div>

          {/* Timing */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <div className="text-sm font-semibold text-stone-800 mb-3">Timing</div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'next_3mo', label: 'Next 3 months' },
                { id: 'next_6mo', label: 'Next 6 months' },
                { id: 'flexible', label: 'Flexible' },
              ].map(opt => (
                <ChipButton
                  key={opt.id}
                  active={prefs.timing === opt.id}
                  onClick={() => updatePref('timing', opt.id)}
                >
                  {opt.label}
                </ChipButton>
              ))}
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-center text-sm font-semibold text-stone-800 mb-1">
              Compensation expectation
              <Tooltip text="Venues that don't meet your standard are quietly filtered out before you ever see them." />
            </div>
            <p className="text-xs text-stone-400 mb-3">We'll use this to filter out opportunities that don't meet your standard.</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'paid_only', label: 'Paid only' },
                { id: 'open_unpaid', label: 'Open to unpaid for right fit' },
                { id: 'travel_min', label: 'Travel reimbursement minimum' },
              ].map(opt => (
                <ChipButton
                  key={opt.id}
                  active={prefs.compensation === opt.id}
                  onClick={() => updatePref('compensation', opt.id)}
                >
                  {opt.label}
                </ChipButton>
              ))}
            </div>
          </div>

          {/* Audience demographic */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
            <div>
              <div className="text-sm font-semibold text-stone-800 mb-1">Audience gender targeting</div>
              <p className="text-xs text-stone-400 mb-3">Used as a hard match signal — we'll only surface venues whose audience aligns with your selection.</p>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_GENDER_OPTIONS.map(opt => (
                  <ChipButton
                    key={opt.id}
                    active={prefs.audience_gender === opt.id}
                    onClick={() => updatePref('audience_gender', opt.id)}
                  >
                    {opt.label}
                  </ChipButton>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-stone-800 mb-1">Audience details</div>
              <p className="text-xs text-stone-400 mb-2">Who do you most want in the room?</p>
              <input
                type="text"
                value={prefs.audience_demo}
                onChange={e => updatePref('audience_demo', e.target.value)}
                placeholder="e.g. senior women in pharma, women executives over 45, early-stage founders"
                className="w-full text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg border border-stone-200 px-3 py-2.5 transition-shadow"
              />
            </div>
          </div>

          {/* Focus + avoid topics */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
            <div>
              <div className="text-sm font-semibold text-stone-800 mb-1">Topics to focus on</div>
              <p className="text-xs text-stone-400 mb-2">We'll prioritize venues that feature these topics.</p>
              <TagInput
                value={prefs.focus_topics}
                onChange={v => updatePref('focus_topics', v)}
                placeholder="e.g. AI adoption, leadership (press Enter)"
              />
            </div>
            <div>
              <div className="flex items-center text-sm font-semibold text-stone-800 mb-1">
                Topics to avoid
                <Tooltip text="We use this to protect your reputation — you'll never be matched with venues focused on these topics." />
              </div>
              <p className="text-xs text-stone-400 mb-2">We won't match you with venues focused on these.</p>
              <TagInput
                value={prefs.avoid_topics}
                onChange={v => updatePref('avoid_topics', v)}
                placeholder="e.g. crypto, politics (press Enter)"
              />
            </div>
          </div>

          {/* Said no to */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-center text-sm font-semibold text-stone-800 mb-1">
              What have you said no to before?
              <Tooltip text="Past patterns reveal deal-breakers better than abstract filters. The more you share, the sharper your matches." />
            </div>
            <p className="text-xs text-stone-400 mb-3">Past patterns reveal deal-breakers better than abstract filters.</p>
            <textarea
              value={prefs.said_no_to}
              onChange={e => updatePref('said_no_to', e.target.value)}
              placeholder="e.g. Unpaid keynotes for large for-profit events. Panels where I'm the only practitioner. Events that require NDAs on my content."
              rows={3}
              className="w-full text-sm text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg border border-stone-200 px-3 py-2.5 transition-shadow"
            />
          </div>

          {/* Dream opportunity */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-center text-sm font-semibold text-stone-800 mb-1">
              Describe your ideal speaking engagement
              <Tooltip text="This becomes the ranking signal for every match we surface. Specificity wins." />
            </div>
            <p className="text-xs text-stone-400 mb-3">In one sentence. This is the north star for your matches.</p>
            <textarea
              value={prefs.dream_opportunity}
              onChange={e => updatePref('dream_opportunity', e.target.value)}
              placeholder="e.g. A mid-size B2B tech conference where I can give a 40-minute talk to CTOs and engineering leaders, with Q&A."
              rows={2}
              className="w-full text-sm text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg border border-stone-200 px-3 py-2.5 transition-shadow"
            />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-5 border-t border-stone-200 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={handleContinue}
            className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors"
          >
            Find my opportunities
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => {
              if (profile) setProfile({ ...profile, preferences: prefs });
              setScreen('topics');
            }}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
