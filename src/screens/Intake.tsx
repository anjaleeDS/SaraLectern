import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { buildProfileFromIntake, extractProfile } from '../lib/claude';
import { extractFromBio, extractFromVideo, extractFromLinkedIn, extractFromFile, suggestTopics } from '../lib/gemini';
import { IntakeData, SpeakerPreferences, UploadedFile } from '../types';
import {
  Upload, Link, FileText, Video, Loader2, ChevronRight, Shield, Users, Mic,
  Presentation as PresentationIcon, BookOpen, AlertCircle, X,
  CheckCircle2, Plus, Lock, Sparkles, Info, Save, Globe, Tv,
} from 'lucide-react';
import { upsertIntakeSession, saveIntakeDraft, loadIntakeDraft, getStoredSessionId } from '../lib/supabase';

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

const PROCESSING_MESSAGES = [
  'Reading your background...',
  'Identifying expertise areas...',
  'Extracting key achievements...',
  'Mapping your speaking angles...',
  'Finding venues that fit where you are now...',
  'Building your speaker profile...',
];

const SOCIAL_PROOF_VENUES = [
  'Future of Work Podcast',
  'She Is AI Summit',
  'ICF Global Conference',
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
          <button type="button" onClick={() => onChange(value.filter(v => v !== tag))} className="text-stone-400 hover:text-stone-700">
            <X size={10} />
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

function VideoCard({ url, onRemove }: { url: string; onRemove: () => void }) {
  let host = '';
  try { host = new URL(url).hostname.replace('www.', ''); } catch { host = url; }
  return (
    <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
      <Video size={13} className="text-rose-500 shrink-0" />
      <span className="text-xs text-stone-600 truncate flex-1">{host}</span>
      <button type="button" onClick={onRemove} className="text-stone-300 hover:text-stone-600 shrink-0">
        <X size={12} />
      </button>
    </div>
  );
}

function FileCard({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  const kb = Math.round(file.size / 1024);
  return (
    <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
      <FileText size={13} className="text-amber-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-stone-700 truncate">{file.name}</div>
        <div className="text-xs text-stone-400">{kb > 0 ? `${kb} KB` : 'text'}</div>
      </div>
      <button type="button" onClick={onRemove} className="text-stone-300 hover:text-stone-600 shrink-0">
        <X size={12} />
      </button>
    </div>
  );
}

function SourceCounter({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${i <= count ? 'bg-amber-400' : 'bg-stone-200'}`} />
        ))}
      </div>
      <span className="text-xs text-stone-500">
        {count === 0
          ? 'Add sources below'
          : count >= 3
          ? `${count} sources — excellent depth`
          : count >= 2
          ? `${count} sources — good depth`
          : `${count} source — add more for better matches`}
      </span>
    </div>
  );
}

export default function Intake() {
  const { setProfile, setIntakeData, setScreen } = useApp();

  const [bioText, setBioText] = useState('');
  const [careerHistory, setCareerHistory] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoInput, setVideoInput] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [bestTalk, setBestTalk] = useState('');
  const [prefs, setPrefs] = useState<SpeakerPreferences>(DEFAULT_PREFS);

  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState(PROCESSING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(getStoredSessionId());
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftDate, setDraftDate] = useState<string | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sourceCount = [
    bioText.trim().length > 0,
    careerHistory.trim().length > 0,
    linkedinUrl.trim().length > 0,
    videoUrls.length > 0,
    files.length > 0,
    bestTalk.trim().length > 0,
  ].filter(Boolean).length;

  const hasContent = !!(bioText.trim() || careerHistory.trim() || linkedinUrl.trim() || videoUrls.length > 0 || files.length > 0);

  const profileStrengthPts = (bioText.trim() ? 3 : 0)
    + (careerHistory.trim() ? 2 : 0)
    + (linkedinUrl.trim() ? 2 : 0)
    + (videoUrls.length > 0 ? 2 : 0)
    + (files.length > 0 ? 2 : 0)
    + (bestTalk.trim() ? 1 : 0);

  const strengthLabel = profileStrengthPts >= 9 ? 'Excellent' : profileStrengthPts >= 7 ? 'Strong' : profileStrengthPts >= 4 ? 'Good' : 'Weak';
  const strengthColor = profileStrengthPts >= 7 ? 'bg-emerald-500' : profileStrengthPts >= 4 ? 'bg-amber-400' : 'bg-rose-400';
  const ctaReady = profileStrengthPts >= 7;

  // Load draft on mount
  useEffect(() => {
    const sid = getStoredSessionId();
    if (!sid) return;
    loadIntakeDraft(sid).then(({ data, updatedAt }) => {
      if (!data) return;
      setDraftDate(updatedAt ? new Date(updatedAt).toLocaleDateString() : null);
      setShowResumeBanner(true);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
      if (autosaveDebounceRef.current) clearTimeout(autosaveDebounceRef.current);
    };
  }, []);

  const buildBackground = useCallback(() => {
    return [bioText, careerHistory, linkedinUrl, ...videoUrls, ...files.map(f => f.text), bestTalk].filter(Boolean).join('\n\n');
  }, [bioText, careerHistory, linkedinUrl, videoUrls, files, bestTalk]);

  const triggerSuggestions = useCallback(() => {
    const bg = buildBackground();
    if (bg.trim().length < 80 || suggestionsDismissed) return;
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    suggestDebounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const topics = await suggestTopics(bg);
        if (topics.length > 0) setSuggestedTopics(topics);
      } catch { /* silent */ }
      setSuggestionsLoading(false);
    }, 1500);
  }, [buildBackground, suggestionsDismissed]);

  const triggerAutosave = useCallback(() => {
    if (!sessionId) return;
    if (autosaveDebounceRef.current) clearTimeout(autosaveDebounceRef.current);
    autosaveDebounceRef.current = setTimeout(async () => {
      const draft: Partial<IntakeData> = {
        linkedin_url: linkedinUrl,
        bio_text: bioText,
        career_history: careerHistory,
        video_urls: videoUrls,
        best_talk: bestTalk,
        files,
        preferences: prefs,
      };
      await saveIntakeDraft(sessionId, draft);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }, 15000);
  }, [sessionId, bioText, careerHistory, linkedinUrl, videoUrls, files, bestTalk, prefs]);

  useEffect(() => { triggerSuggestions(); }, [bioText, careerHistory, linkedinUrl, videoUrls.length, files.length]);
  useEffect(() => { triggerAutosave(); }, [bioText, careerHistory, linkedinUrl, videoUrls, files, bestTalk, prefs]);

  const handleResumedraft = async () => {
    const sid = getStoredSessionId();
    if (!sid) return;
    const { data } = await loadIntakeDraft(sid);
    if (!data) return;
    if (data.bio_text) setBioText(data.bio_text);
    if (data.career_history) setCareerHistory(data.career_history);
    if (data.linkedin_url) setLinkedinUrl(data.linkedin_url);
    if (data.video_urls) setVideoUrls(data.video_urls);
    if (data.best_talk) setBestTalk(data.best_talk);
    if (data.files) setFiles(data.files);
    if (data.preferences) setPrefs(data.preferences);
    setShowResumeBanner(false);
  };

  const handleEmailSave = async () => {
    if (!email.trim() || !email.includes('@')) return;
    const sid = await upsertIntakeSession(email.trim());
    if (sid) {
      setSessionId(sid);
      const draft: Partial<IntakeData> = { linkedin_url: linkedinUrl, bio_text: bioText, career_history: careerHistory, video_urls: videoUrls, best_talk: bestTalk, files, preferences: prefs };
      await saveIntakeDraft(sid, draft);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }
  };

  const updatePref = <K extends keyof SpeakerPreferences>(key: K, value: SpeakerPreferences[K]) => {
    setPrefs(p => ({ ...p, [key]: value }));
  };

  const toggleArrayPref = (key: 'formats' | 'geography' | 'style', id: string) => {
    setPrefs(p => {
      const arr = p[key] as string[];
      return { ...p, [key]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
    });
  };

  const handleFile = (file: File) => {
    if (files.length >= 3) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = (e.target?.result as string) ?? '';
      setFiles(prev => [...prev, { name: file.name, text, size: file.size }]);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).slice(0, 3 - files.length).forEach(handleFile);
  };

  const addVideoUrl = () => {
    const url = videoInput.trim();
    if (!url || videoUrls.length >= 3 || videoUrls.includes(url)) return;
    setVideoUrls(prev => [...prev, url]);
    setVideoInput('');
  };

  const startProcessingMessages = () => {
    let idx = 0;
    setProcessingMsg(PROCESSING_MESSAGES[0]);
    msgIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % PROCESSING_MESSAGES.length;
      setProcessingMsg(PROCESSING_MESSAGES[idx]);
    }, 2000);
  };

  const handleBuild = async () => {
    if (!hasContent) return;
    setError(null);
    setProcessing(true);
    startProcessingMessages();

    try {
      const extractions: Promise<string>[] = [];

      if (linkedinUrl.trim()) extractions.push(extractFromLinkedIn(linkedinUrl.trim()));
      videoUrls.forEach(url => extractions.push(extractFromVideo(url)));
      files.forEach(f => extractions.push(extractFromFile(f.text, f.name)));
      if (bioText.trim() && !linkedinUrl.trim()) extractions.push(extractFromBio(bioText.trim()));
      if (careerHistory.trim()) extractions.push(Promise.resolve(careerHistory.trim()));

      const summaries = await Promise.allSettled(extractions).then(results =>
        results.map(r => r.status === 'fulfilled' ? r.value : '')
      );

      const intake: IntakeData = {
        linkedin_url: linkedinUrl,
        bio_text: bioText,
        career_history: careerHistory,
        video_urls: videoUrls,
        best_talk: bestTalk,
        files,
        preferences: prefs,
      };

      let fullText = '';
      await buildProfileFromIntake(intake, summaries, (chunk) => {
        fullText += chunk;
      });

      const profile = extractProfile(fullText);
      if (!profile) throw new Error('Could not extract profile from AI response. Please try again.');

      profile.preferences = prefs;
      setProfile(profile);
      setIntakeData(intake);

      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
      setScreen('confirm');
    } catch (err) {
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
      setError(err instanceof Error ? err.message : String(err));
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-stone-50">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-stone-900 tracking-tight">Tell us about yourself</h1>
            <p className="text-sm text-stone-500 mt-0.5">Built for speakers who are ready to grow — not just get booked.</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <Shield size={13} className="text-emerald-500" />
              <span>Your profile is private</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Venues under 1,500 only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resume banner */}
      {showResumeBanner && (
        <div className="px-4 md:px-8 py-3 bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <Save size={14} className="text-amber-600 shrink-0" />
            <span className="text-sm text-amber-800 flex-1">
              You have a saved draft{draftDate ? ` from ${draftDate}` : ''}. Continue where you left off?
            </span>
            <button onClick={handleResumedraft} className="text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900">
              Resume draft
            </button>
            <button onClick={() => setShowResumeBanner(false)} className="text-amber-400 hover:text-amber-600">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Email save row */}
      <div className="px-4 md:px-8 pt-4 pb-2">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleEmailSave(); }}
              placeholder="Enter your email to save progress and resume across devices"
              className="flex-1 text-xs text-stone-700 placeholder:text-stone-400 border border-stone-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow"
            />
            <button
              onClick={handleEmailSave}
              disabled={!email.includes('@')}
              className="flex items-center gap-1.5 text-xs font-medium text-stone-600 border border-stone-200 rounded-lg px-3 py-2 bg-white hover:bg-stone-50 disabled:opacity-40 transition-all whitespace-nowrap"
            >
              <Save size={12} />
              Save progress
            </button>
            {draftSaved && (
              <span className="text-xs text-emerald-600 flex items-center gap-1 whitespace-nowrap">
                <CheckCircle2 size={12} />
                Draft saved
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-8 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT COLUMN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Your Background</h2>
                <SourceCounter count={sourceCount} />
              </div>

              {/* Bio */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 mb-2">
                  <FileText size={14} className="text-amber-500" />
                  Bio, About section, or LinkedIn summary
                  <span className="ml-auto text-amber-600 font-semibold text-xs">Recommended</span>
                </label>
                <textarea
                  value={bioText}
                  onChange={e => setBioText(e.target.value)}
                  onBlur={triggerSuggestions}
                  placeholder="e.g. I've spoken at 10+ meetups and workshops on change management. I help mid-size teams navigate org transformation — not the Fortune 500 way, but the human way..."
                  rows={5}
                  className="w-full text-sm text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg border border-stone-200 px-3 py-2.5 transition-shadow"
                />
              </div>

              {/* Career history */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 mb-2">
                  <BookOpen size={14} className="text-stone-500" />
                  Career background
                  <Tooltip text="This is your secret weapon — share professional history that isn't public. Employers, industries, and roles that shaped your expertise but won't show up in a web search." />
                  <span className="ml-auto text-stone-400 text-xs font-normal">Especially helpful for non-public history</span>
                </label>
                <textarea
                  value={careerHistory}
                  onChange={e => setCareerHistory(e.target.value)}
                  onBlur={triggerSuggestions}
                  placeholder="e.g. 20 years at a major pharmaceutical company in Learning & Development and Research. Led org-wide talent transformation across 5,000 employees. Author of a children's book on resilience."
                  rows={3}
                  className="w-full text-sm text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg border border-stone-200 px-3 py-2.5 transition-shadow"
                />
              </div>

              {/* LinkedIn */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 mb-2">
                  <Link size={14} className="text-sky-500" />
                  LinkedIn profile URL
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  onBlur={triggerSuggestions}
                  placeholder="https://linkedin.com/in/yourname"
                  className="w-full text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg border border-stone-200 px-3 py-2.5 transition-shadow"
                />
              </div>

              {/* Video URLs */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 mb-2">
                  <Video size={14} className="text-rose-500" />
                  Talk or interview videos
                  <span className="ml-auto text-stone-400 text-xs font-normal">YouTube, Loom, Vimeo · up to 3</span>
                </label>
                {videoUrls.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {videoUrls.map((url, i) => (
                      <VideoCard key={i} url={url} onRemove={() => setVideoUrls(prev => prev.filter((_, j) => j !== i))} />
                    ))}
                  </div>
                )}
                {videoUrls.length < 3 && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={videoInput}
                      onChange={e => setVideoInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVideoUrl(); } }}
                      placeholder="Paste a video URL and press Enter"
                      className="flex-1 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg border border-stone-200 px-3 py-2 transition-shadow"
                    />
                    <button
                      type="button"
                      onClick={addVideoUrl}
                      disabled={!videoInput.trim()}
                      className="p-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* File upload */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 mb-2">
                  <Upload size={14} className="text-stone-500" />
                  Documents
                  <span className="ml-auto text-stone-400 text-xs font-normal">Resume, one-pager, speaker kit · up to 3</span>
                </label>
                {files.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {files.map((file, i) => (
                      <FileCard key={i} file={file} onRemove={() => setFiles(prev => prev.filter((_, j) => j !== i))} />
                    ))}
                  </div>
                )}
                {files.length < 3 && (
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-lg border-2 border-dashed p-3 cursor-pointer text-center transition-all ${
                      dragOver ? 'border-amber-400 bg-amber-50' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.docx,.doc"
                      multiple
                      className="hidden"
                      onChange={e => { Array.from(e.target.files ?? []).slice(0, 3 - files.length).forEach(handleFile); }}
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-stone-500">
                      <Upload size={13} className="text-stone-400" />
                      Drop files here or click to browse
                      <span className="text-stone-400">PDF, DOCX, TXT</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Best talk / credentials */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 mb-2">
                  <Mic size={14} className="text-amber-500" />
                  Best talk, book, or notable credential
                  <span className="ml-auto text-stone-400 text-xs font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={bestTalk}
                  onChange={e => setBestTalk(e.target.value)}
                  placeholder='e.g. "Why AI Transformation Fails" (talk) or "The Brave Little Spark" (book)'
                  className="w-full text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg border border-stone-200 px-3 py-2.5 transition-shadow"
                />
              </div>

              {/* Profile strength */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-stone-600">Profile strength</span>
                  <span className={`text-xs font-semibold ${profileStrengthPts >= 7 ? 'text-emerald-600' : profileStrengthPts >= 4 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {strengthLabel}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${strengthColor}`}
                    style={{ width: `${(profileStrengthPts / 10) * 100}%` }}
                  />
                </div>
                {profileStrengthPts >= 7 && (
                  <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    Ready to find your next room
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">What a Great Opportunity Looks Like</h2>
                <p className="text-xs text-stone-400 mt-1">We focus on venues under 1,500 — where rising speakers get real traction.</p>
              </div>

              {/* Coaching interrupt: topic suggestions */}
              {(suggestionsLoading || (suggestedTopics.length > 0 && !suggestionsDismissed)) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-500" />
                      <span className="text-xs font-semibold text-amber-800">
                        {suggestionsLoading ? 'Reading what you could own...' : "Based on what you've shared, you could own:"}
                      </span>
                    </div>
                    {!suggestionsLoading && (
                      <button type="button" onClick={() => setSuggestionsDismissed(true)} className="text-amber-300 hover:text-amber-600 ml-2">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  {suggestionsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                      <Loader2 size={12} className="animate-spin" />
                      Analyzing your background...
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {suggestedTopics.map((t, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (!prefs.focus_topics.includes(t)) updatePref('focus_topics', [...prefs.focus_topics, t]);
                            }}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                              prefs.focus_topics.includes(t)
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            {prefs.focus_topics.includes(t) ? '✓ ' : '+ '}
                            {t}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-amber-600">Click any to add it to your focus topics below.</p>
                    </>
                  )}
                </div>
              )}

              {/* Format */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <div className="text-xs font-medium text-stone-600 mb-2.5">Format</div>
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
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <div className="text-xs font-medium text-stone-600 mb-3">Audience size</div>
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
                        <span className={`text-xs ml-auto ${prefs.audience_size === opt.id ? 'text-stone-400' : 'text-stone-400'}`}>
                          {opt.range}
                        </span>
                      </div>
                      <p className={`text-xs leading-snug ${prefs.audience_size === opt.id ? 'text-stone-300' : 'text-stone-400'}`}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <div className="text-xs font-medium text-stone-600 mb-1.5">Your speaking style</div>
                <p className="text-xs text-stone-400 mb-2">How would your audience describe you?</p>
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
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <div className="text-xs font-medium text-stone-600 mb-2.5">Geography</div>
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

              {/* Compensation */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <div className="flex items-center text-xs font-medium text-stone-600 mb-2.5">
                  Compensation
                  <Tooltip text="Venues that don't meet your standard are quietly filtered out before you ever see them." />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'paid_only', label: 'Paid only' },
                    { id: 'open_unpaid', label: 'Open to unpaid for right fit' },
                    { id: 'travel_min', label: 'Travel minimum required' },
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
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-3">
                <div>
                  <div className="text-xs font-medium text-stone-600 mb-2">Audience gender targeting</div>
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
                  <div className="text-xs font-medium text-stone-600 mb-1.5">Audience details</div>
                  <input
                    type="text"
                    value={prefs.audience_demo}
                    onChange={e => updatePref('audience_demo', e.target.value)}
                    placeholder="e.g. senior women in pharma, women executives over 45"
                    className="w-full text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg border border-stone-200 px-3 py-2 transition-shadow"
                  />
                </div>
              </div>

              {/* Topics */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-3">
                <div>
                  <div className="text-xs font-medium text-stone-600 mb-1.5">Topics to focus on</div>
                  <TagInput
                    value={prefs.focus_topics}
                    onChange={v => updatePref('focus_topics', v)}
                    placeholder="e.g. AI adoption, leadership (press Enter)"
                  />
                </div>
                <div>
                  <div className="flex items-center text-xs font-medium text-stone-600 mb-1.5">
                    Topics to avoid
                    <Tooltip text="We use this to protect your reputation — you'll never be matched with venues focused on these topics." />
                  </div>
                  <TagInput
                    value={prefs.avoid_topics}
                    onChange={v => updatePref('avoid_topics', v)}
                    placeholder="e.g. crypto, politics (press Enter)"
                  />
                </div>
              </div>

              {/* Said no to */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <div className="flex items-center text-xs font-medium text-stone-600 mb-2">
                  What have you said no to before?
                  <Tooltip text="Past patterns predict future fit better than any filter. The more you share, the sharper your matches." />
                </div>
                <textarea
                  value={prefs.said_no_to}
                  onChange={e => updatePref('said_no_to', e.target.value)}
                  placeholder="e.g. Unpaid keynotes for large for-profit events. Panels where I'm the only practitioner. Events that require NDAs on my content."
                  rows={2}
                  className="w-full text-sm text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg border border-stone-200 px-3 py-2.5 transition-shadow"
                />
              </div>

              {/* Dream opportunity */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <div className="flex items-center text-xs font-medium text-stone-600 mb-2">
                  Describe your ideal speaking engagement
                  <Tooltip text="This becomes the ranking signal for every match we surface. The more specific, the more accurate your results." />
                </div>
                <textarea
                  value={prefs.dream_opportunity}
                  onChange={e => updatePref('dream_opportunity', e.target.value)}
                  placeholder="e.g. A mid-size B2B tech conference where I can give a 40-minute talk to CTOs and engineering leaders, with Q&A."
                  rows={2}
                  className="w-full text-sm text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg border border-stone-200 px-3 py-2.5 transition-shadow"
                />
              </div>

              {/* Social proof strip */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <div className="text-xs text-stone-400 mb-2">Speakers like you have matched with</div>
                <div className="flex flex-wrap gap-2">
                  {SOCIAL_PROOF_VENUES.map((name, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs bg-stone-50 border border-stone-200 rounded-full px-3 py-1.5 text-stone-400 select-none">
                      <Lock size={9} />
                      {name}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-stone-300 mt-2">Complete your profile to unlock real matches.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-4 md:px-8 py-5 border-t border-stone-200 bg-white sticky bottom-0">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex-1">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
              <span className="text-xs">{error}</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-4">
            {!hasContent && (
              <p className="text-xs text-stone-400">Add your background above to continue</p>
            )}

            <button
              onClick={handleBuild}
              disabled={!hasContent || processing}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                ctaReady && !processing
                  ? 'bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-200 ring-offset-1'
                  : 'bg-stone-900 text-white hover:bg-stone-700'
              }`}
            >
              {processing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>{processingMsg}</span>
                </>
              ) : (
                <>
                  Build my profile
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
