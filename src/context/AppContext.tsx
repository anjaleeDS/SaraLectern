import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppState, Screen, SpeakerProfile, Topic, VenueMatch, PitchDraft, OutreachItem, ChatMessage, IntakeData } from '../types';
import { ApiCallLog, setApiLogListener } from '../lib/claude';

interface AppContextValue extends AppState {
  setScreen: (s: Screen) => void;
  goBack: () => void;
  canGoBack: boolean;
  addChatMessage: (m: ChatMessage) => void;
  updateLastAssistantMessage: (text: string) => void;
  setProfile: (p: SpeakerProfile) => void;
  setIntakeData: (d: IntakeData) => void;
  setTopics: (t: Topic[]) => void;
  updateTopicTitle: (id: string, title: string) => void;
  lockTopics: () => void;
  setVenueMatches: (v: VenueMatch[]) => void;
  toggleVenueSelection: (id: string) => void;
  setPitchDrafts: (p: PitchDraft[] | ((prev: PitchDraft[]) => PitchDraft[])) => void;
  updatePitchBody: (venueId: string, body: string) => void;
  approvePitch: (venueId: string) => void;
  setOutreach: (o: OutreachItem[]) => void;
  advanceOutreachStatus: (venueId: string) => void;
  setIsLoading: (b: boolean) => void;
  apiLogs: ApiCallLog[];
  clearApiLogs: () => void;
}

const STATUS_ORDER: OutreachItem['status'][] = ['Queued', 'Sent', 'Opened', 'Responded', 'Confirmed', 'Declined'];

export const SCREEN_ORDER: Screen[] = ['intake', 'confirm', 'preferences', 'topics', 'venues', 'pitches', 'dashboard'];

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    screen: 'intake',
    chatMessages: [],
    profile: null,
    intakeData: null,
    topics: [],
    venueMatches: [],
    pitchDrafts: [],
    outreach: [],
    isLoading: false,
  });
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiCallLog[]>([]);

  React.useEffect(() => {
    setApiLogListener((log) => {
      setApiLogs(prev => {
        const existing = prev.findIndex(l => l.id === log.id);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = log;
          return next;
        }
        return [log, ...prev].slice(0, 100);
      });
    });
    return () => setApiLogListener(null);
  }, []);

  const setScreen = useCallback((screen: Screen) => {
    setState(s => {
      setScreenHistory(h => [...h, s.screen]);
      return { ...s, screen };
    });
  }, []);

  const goBack = useCallback(() => {
    setScreenHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setState(s => ({ ...s, screen: prev }));
      return h.slice(0, -1);
    });
  }, []);

  const canGoBack = screenHistory.length > 0;

  const setIsLoading = (isLoading: boolean) => setState(s => ({ ...s, isLoading }));

  const addChatMessage = (m: ChatMessage) =>
    setState(s => ({ ...s, chatMessages: [...s.chatMessages, m] }));

  const updateLastAssistantMessage = (text: string) =>
    setState(s => {
      const msgs = [...s.chatMessages];
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + text };
      }
      return { ...s, chatMessages: msgs };
    });

  const setProfile = (profile: SpeakerProfile) => setState(s => ({ ...s, profile }));

  const setIntakeData = (intakeData: IntakeData) => setState(s => ({ ...s, intakeData }));

  const setTopics = (topics: Topic[]) => setState(s => ({ ...s, topics }));

  const updateTopicTitle = (id: string, title: string) =>
    setState(s => ({
      ...s,
      topics: s.topics.map(t => t.id === id ? { ...t, title } : t),
    }));

  const lockTopics = () =>
    setState(s => ({
      ...s,
      topics: s.topics.map(t => ({ ...t, locked: true })),
    }));

  const setVenueMatches = (venueMatches: VenueMatch[]) => setState(s => ({ ...s, venueMatches }));

  const toggleVenueSelection = (id: string) =>
    setState(s => ({
      ...s,
      venueMatches: s.venueMatches.map(vm =>
        vm.venue.id === id ? { ...vm, selected: !vm.selected } : vm
      ),
    }));

  const setPitchDrafts = (pitchDrafts: PitchDraft[] | ((prev: PitchDraft[]) => PitchDraft[])) =>
    setState(s => ({
      ...s,
      pitchDrafts: typeof pitchDrafts === 'function' ? pitchDrafts(s.pitchDrafts) : pitchDrafts,
    }));

  const updatePitchBody = (venueId: string, body: string) =>
    setState(s => ({
      ...s,
      pitchDrafts: s.pitchDrafts.map(p =>
        p.venueId === venueId ? { ...p, body, edited: body !== p.originalBody } : p
      ),
    }));

  const approvePitch = (venueId: string) =>
    setState(s => ({
      ...s,
      pitchDrafts: s.pitchDrafts.map(p =>
        p.venueId === venueId ? { ...p, approved: true } : p
      ),
    }));

  const setOutreach = (outreach: OutreachItem[]) => setState(s => ({ ...s, outreach }));

  const advanceOutreachStatus = (venueId: string) =>
    setState(s => ({
      ...s,
      outreach: s.outreach.map(o => {
        if (o.venueId !== venueId) return o;
        const idx = STATUS_ORDER.indexOf(o.status);
        const next = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.indexOf('Confirmed'))];
        return { ...o, status: next, lastUpdated: new Date().toLocaleDateString() };
      }),
    }));

  const clearApiLogs = () => setApiLogs([]);

  return (
    <AppContext.Provider value={{
      ...state,
      setScreen,
      goBack,
      canGoBack,
      addChatMessage,
      updateLastAssistantMessage,
      setProfile,
      setIntakeData,
      setTopics,
      updateTopicTitle,
      lockTopics,
      setVenueMatches,
      toggleVenueSelection,
      setPitchDrafts,
      updatePitchBody,
      approvePitch,
      setOutreach,
      advanceOutreachStatus,
      setIsLoading,
      apiLogs,
      clearApiLogs,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
