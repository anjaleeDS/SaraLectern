import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateTopics } from '../lib/claude';
import { VENUES } from '../venues';
import { VenueMatch, MatchScore, AudienceSizeRange } from '../types';
import { Lock, Loader2, Mic, Users, Globe, Tv, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import BackButton from '../components/BackButton';

const AUDIENCE_SIZE_ORDER: AudienceSizeRange[] = ['intimate', 'mid', 'growing'];

function computeVenueMatches(
  expertiseAreas: string[],
  topics: { title: string; venue_type: string }[],
  focusTopics?: string[],
  avoidTopics?: string[],
  preferredFormats?: string[],
  preferredAudienceSize?: string,
  preferredAudienceGender?: string
): VenueMatch[] {
  const tokens = [
    ...expertiseAreas.map(e => e.toLowerCase()),
    ...topics.flatMap(t => t.title.toLowerCase().split(/\W+/)),
    ...(focusTopics ?? []).map(f => f.toLowerCase()),
  ];

  const avoidTokens = (avoidTopics ?? []).map(a => a.toLowerCase());

  return VENUES.map(venue => {
    const venueTags = venue.topic_tags.map(t => t.toLowerCase());

    const hasAvoid = avoidTokens.some(avoid =>
      venueTags.some(tag => tag.includes(avoid) || avoid.includes(tag))
    );

    // Hard filter: women_only speakers only see women-focused venues or general venues
    const genderMismatch = preferredAudienceGender === 'women_only'
      ? venue.audience_gender === 'mixed' || (!venue.audience_gender && !venueTags.some(t => t.includes('women') || t.includes('woman')))
      : false;

    const matches = venueTags.filter(tag =>
      tokens.some(tok => tok.includes(tag) || tag.includes(tok))
    );

    const formatBoost = preferredFormats?.length
      ? preferredFormats.some(f => {
          if (f === 'podcast' && venue.type === 'podcast') return true;
          if (f === 'video_podcast' && venue.type === 'video_podcast') return true;
          if ((f === 'conference_talk' || f === 'panel' || f === 'workshop') && venue.type === 'conference') return true;
          if (f === 'digital_event' && venue.type === 'digital_event') return true;
          return false;
        })
      : false;

    const audienceBoost = preferredAudienceSize && preferredAudienceSize !== 'any'
      ? venue.audience_size_range === preferredAudienceSize
      : false;

    const genderBoost = preferredAudienceGender === 'women_only' && venue.audience_gender === 'women';

    // Demote if audience size significantly mismatches (speaker wants intimate, venue is growing)
    const audiencePenalty = preferredAudienceSize && preferredAudienceSize !== 'any'
      ? Math.abs(
          AUDIENCE_SIZE_ORDER.indexOf(venue.audience_size_range) -
          AUDIENCE_SIZE_ORDER.indexOf(preferredAudienceSize as AudienceSizeRange)
        ) >= 2
      : false;

    const effectiveMatches = hasAvoid || audiencePenalty || genderMismatch
      ? 0
      : matches.length + (formatBoost ? 1 : 0) + (audienceBoost ? 1 : 0) + (genderBoost ? 2 : 0);

    const score: MatchScore = effectiveMatches >= 2 ? 'High' : 'Medium';

    const firstMatch = matches[0] || venue.topic_tags[0];
    const matchingTopic = topics.find(t =>
      t.title.toLowerCase().split(/\W+/).some(w => firstMatch.includes(w) || w.includes(firstMatch))
    );
    const reason = matchingTopic
      ? `Your topic on "${matchingTopic.title}" aligns with their audience of ${venue.audience}`
      : `Your expertise aligns with their audience of ${venue.audience}`;

    return { venue, score, reason, selected: false };
  }).sort((a, b) => (a.score === 'High' ? -1 : 1) - (b.score === 'High' ? -1 : 1));
}

function venueTypeIcon(type: string) {
  if (type === 'podcast') return <Mic size={13} className="text-sky-400" />;
  if (type === 'video_podcast') return <Tv size={13} className="text-rose-400" />;
  if (type === 'conference') return <Users size={13} className="text-emerald-400" />;
  if (type === 'digital_event') return <Globe size={13} className="text-amber-400" />;
  return <Users size={13} className="text-stone-400" />;
}

function venueTypeBadgeColor(type: string) {
  if (type === 'podcast') return 'bg-sky-100 text-sky-700';
  if (type === 'video_podcast') return 'bg-rose-100 text-rose-700';
  if (type === 'conference') return 'bg-emerald-100 text-emerald-700';
  if (type === 'digital_event') return 'bg-amber-100 text-amber-700';
  return 'bg-stone-100 text-stone-600';
}

function topicBadgeColor(venue_type: string) {
  if (venue_type === 'podcast') return 'bg-sky-100 text-sky-700';
  if (venue_type === 'video_podcast') return 'bg-rose-100 text-rose-700';
  if (venue_type === 'conference') return 'bg-emerald-100 text-emerald-700';
  if (venue_type === 'digital_event') return 'bg-amber-100 text-amber-700';
  return 'bg-stone-100 text-stone-600';
}

export default function TopicsVenues() {
  const {
    profile, topics, setTopics, updateTopicTitle, lockTopics,
    venueMatches, setVenueMatches, toggleVenueSelection, setScreen
  } = useApp();
  const [step, setStep] = useState<'topics' | 'venues'>(topics.length > 0 ? (topics[0].locked ? 'venues' : 'topics') : 'topics');
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runGenerate = () => {
    setGeneratingTopics(true);
    setError(null);
    generateTopics(profile!, () => {})
      .then(result => {
        setTopics(result);
        setGeneratingTopics(false);
      })
      .catch(err => {
        setGeneratingTopics(false);
        setError(err instanceof Error ? err.message : String(err));
      });
  };

  useEffect(() => {
    if (topics.length === 0 && !generatingTopics) {
      runGenerate();
    }
  }, []);

  const handleLockTopics = () => {
    lockTopics();
    const prefs = profile!.preferences;
    const matches = computeVenueMatches(
      profile!.expertise_areas,
      topics,
      prefs?.focus_topics,
      prefs?.avoid_topics,
      prefs?.formats,
      prefs?.audience_size,
      prefs?.audience_gender
    );
    setVenueMatches(matches);
    setStep('venues');
  };

  const selectedCount = venueMatches.filter(v => v.selected).length;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 md:px-8 py-6 border-b border-stone-200">
        <div className="flex items-center gap-3 mb-1">
          {step === 'venues' ? (
            <BackButton
              warningTitle="Go back to Topics?"
              warningBody="Your locked topics will be unlocked and you'll need to re-confirm them. Any venue selections you've made will be cleared."
              onBack={() => setStep('topics')}
            />
          ) : (
            <BackButton
              warningTitle="Go back to Profile Review?"
              warningBody="Your AI-generated topics will be discarded and you'll need to regenerate them. This will use additional API credits."
            />
          )}
          <h1 className="text-xl font-semibold text-stone-900">
            {step === 'topics' ? 'Topic Generation' : 'Venue Matching'}
          </h1>
        </div>
        <p className="text-sm text-stone-500 mt-1">
          {step === 'topics'
            ? 'AI-generated topics grounded in your confirmed profile.'
            : 'Venues matched to your locked topics and expertise.'}
        </p>
      </div>

      <div className="flex-1 px-4 md:px-8 py-6">
        {step === 'topics' && (
          <div>
            {generatingTopics ? (
              <div className="flex items-center gap-3 text-sm text-stone-500 py-8">
                <Loader2 size={18} className="animate-spin" />
                Topic Generation Agent is working...
              </div>
            ) : error ? (
              <div className="max-w-2xl bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium mb-1">Topic Generation Agent failed</p>
                    <p className="text-xs text-red-700 font-mono break-all mb-3">{error}</p>
                    <button
                      onClick={runGenerate}
                      className="flex items-center gap-1.5 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <RefreshCw size={12} />
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl space-y-4">
                {topics.map(topic => (
                  <div key={topic.id} className="bg-white border border-stone-200 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      {topic.locked ? (
                        <div className="flex items-center gap-2">
                          <Lock size={14} className="text-stone-400 shrink-0" />
                          <span className="font-medium text-stone-900 text-sm">{topic.title}</span>
                        </div>
                      ) : (
                        <input
                          value={topic.title}
                          onChange={e => updateTopicTitle(topic.id, e.target.value)}
                          className="flex-1 font-medium text-stone-900 text-sm border-b border-transparent hover:border-stone-300 focus:border-amber-400 focus:outline-none bg-transparent py-0.5 transition-colors"
                        />
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${topicBadgeColor(topic.venue_type)}`}>
                        {topic.venue_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">{topic.rationale}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'venues' && (
          <div className="max-w-2xl space-y-3">
            {venueMatches.map(vm => (
              <label
                key={vm.venue.id}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  vm.selected
                    ? 'bg-stone-900 border-stone-900 text-white'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={vm.selected}
                  onChange={() => toggleVenueSelection(vm.venue.id)}
                  className="mt-0.5 accent-amber-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-medium text-sm ${vm.selected ? 'text-white' : 'text-stone-900'}`}>
                      {vm.venue.name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      vm.score === 'High'
                        ? vm.selected ? 'bg-amber-400 text-stone-900' : 'bg-amber-100 text-amber-700'
                        : vm.selected ? 'bg-stone-700 text-stone-300' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {vm.score}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      vm.selected ? 'bg-stone-700 text-stone-300' : venueTypeBadgeColor(vm.venue.type)
                    }`}>
                      {vm.venue.type.replace('_', ' ')}
                    </span>
                    {venueTypeIcon(vm.venue.type)}
                  </div>
                  <p className={`text-xs leading-relaxed ${vm.selected ? 'text-stone-300' : 'text-stone-500'}`}>
                    {vm.reason}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 md:px-8 py-5 border-t border-stone-200 bg-white">
        {step === 'topics' ? (
          <button
            onClick={handleLockTopics}
            disabled={topics.length === 0 || generatingTopics || !!error}
            className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Lock size={15} />
            Lock Topics
          </button>
        ) : (
          <button
            onClick={() => setScreen('pitches')}
            disabled={selectedCount === 0}
            className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Start Outreach ({selectedCount} selected)
            <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
