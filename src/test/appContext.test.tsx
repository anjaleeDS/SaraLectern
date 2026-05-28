import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';
import { SpeakerProfile, Topic, OutreachItem } from '../types';
import React, { useEffect } from 'react';

// Helper: renders children inside AppProvider and captures context value
function renderWithApp(Child: React.FC) {
  let ctx: ReturnType<typeof useApp> | null = null;
  function Capture() {
    ctx = useApp();
    return <Child />;
  }
  const utils = render(
    <AppProvider>
      <Capture />
    </AppProvider>
  );
  return { utils, getCtx: () => ctx! };
}

const MOCK_PROFILE: SpeakerProfile = {
  name: 'Jane Smith',
  title: 'CTO',
  expertise_areas: ['AI', 'Leadership'],
  years_experience: 12,
  key_achievements: ['Founded AI startup'],
  speaking_experience: 'TEDx 2023',
  target_audience: 'tech executives',
};

const MOCK_TOPICS: Topic[] = [
  { id: 't1', title: 'AI in Leadership', rationale: 'Timely topic', venue_type: 'podcast', locked: false },
  { id: 't2', title: 'Future of Work', rationale: 'High demand', venue_type: 'conference', locked: false },
];

// ─── screen navigation ────────────────────────────────────────────────────────

describe('screen navigation', () => {
  it('starts on intake screen', () => {
    const { getCtx } = renderWithApp(() => null);
    expect(getCtx().screen).toBe('intake');
  });

  it('setScreen updates screen and adds to history', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setScreen('confirm'));
    expect(getCtx().screen).toBe('confirm');
    expect(getCtx().canGoBack).toBe(true);
  });

  it('goBack returns to previous screen', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setScreen('confirm'));
    act(() => getCtx().setScreen('topics'));
    expect(getCtx().screen).toBe('topics');
    act(() => getCtx().goBack());
    expect(getCtx().screen).toBe('confirm');
  });

  it('canGoBack is false at start', () => {
    const { getCtx } = renderWithApp(() => null);
    expect(getCtx().canGoBack).toBe(false);
  });

  it('canGoBack is false after going back to the beginning', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setScreen('confirm'));
    act(() => getCtx().goBack());
    expect(getCtx().screen).toBe('intake');
    expect(getCtx().canGoBack).toBe(false);
  });
});

// ─── profile ──────────────────────────────────────────────────────────────────

describe('profile management', () => {
  it('setProfile updates profile', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setProfile(MOCK_PROFILE));
    expect(getCtx().profile?.name).toBe('Jane Smith');
  });
});

// ─── chat messages ────────────────────────────────────────────────────────────

describe('chat messages', () => {
  it('addChatMessage appends a message', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().addChatMessage({ role: 'user', content: 'Hello' }));
    expect(getCtx().chatMessages).toHaveLength(1);
    expect(getCtx().chatMessages[0].content).toBe('Hello');
  });

  it('updateLastAssistantMessage appends to last assistant message', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().addChatMessage({ role: 'assistant', content: 'Hi' }));
    act(() => getCtx().updateLastAssistantMessage(' there'));
    expect(getCtx().chatMessages[0].content).toBe('Hi there');
  });

  it('updateLastAssistantMessage does nothing if last message is from user', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().addChatMessage({ role: 'user', content: 'Hello' }));
    act(() => getCtx().updateLastAssistantMessage(' world'));
    expect(getCtx().chatMessages[0].content).toBe('Hello');
  });
});

// ─── topics ───────────────────────────────────────────────────────────────────

describe('topics', () => {
  it('setTopics replaces topics', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setTopics(MOCK_TOPICS));
    expect(getCtx().topics).toHaveLength(2);
  });

  it('updateTopicTitle updates a specific topic title', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setTopics(MOCK_TOPICS));
    act(() => getCtx().updateTopicTitle('t1', 'Updated Title'));
    expect(getCtx().topics.find(t => t.id === 't1')?.title).toBe('Updated Title');
    expect(getCtx().topics.find(t => t.id === 't2')?.title).toBe('Future of Work');
  });

  it('lockTopics sets all topics to locked=true', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setTopics(MOCK_TOPICS));
    act(() => getCtx().lockTopics());
    expect(getCtx().topics.every(t => t.locked)).toBe(true);
  });
});

// ─── venue selection ──────────────────────────────────────────────────────────

describe('venue selection', () => {
  it('toggleVenueSelection selects an unselected venue', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setVenueMatches([
      { venue: { id: 'v1', name: 'Test Podcast', type: 'podcast', vertical: 'tech', audience: 'devs', audience_size_range: 'intimate', topic_tags: ['tech'], cfp_url: '#' }, score: 'High', reason: 'Great match', selected: false },
    ]));
    act(() => getCtx().toggleVenueSelection('v1'));
    expect(getCtx().venueMatches[0].selected).toBe(true);
  });

  it('toggleVenueSelection deselects a selected venue', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setVenueMatches([
      { venue: { id: 'v1', name: 'Test Podcast', type: 'podcast', vertical: 'tech', audience: 'devs', audience_size_range: 'intimate', topic_tags: ['tech'], cfp_url: '#' }, score: 'Medium', reason: 'OK match', selected: true },
    ]));
    act(() => getCtx().toggleVenueSelection('v1'));
    expect(getCtx().venueMatches[0].selected).toBe(false);
  });
});

// ─── pitch drafts ─────────────────────────────────────────────────────────────

describe('pitch drafts', () => {
  const DRAFT = { venueId: 'v1', venueName: 'Test', topicTitle: 'AI', subjectLine: 'Pitch', body: 'Hello world', approved: false, edited: false, originalBody: 'Hello world' };

  it('setPitchDrafts sets drafts directly', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setPitchDrafts([DRAFT]));
    expect(getCtx().pitchDrafts).toHaveLength(1);
  });

  it('setPitchDrafts accepts a functional update', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setPitchDrafts([DRAFT]));
    act(() => getCtx().setPitchDrafts(prev => prev.map(p => ({ ...p, approved: true }))));
    expect(getCtx().pitchDrafts[0].approved).toBe(true);
  });

  it('updatePitchBody sets edited=true when body differs from original', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setPitchDrafts([DRAFT]));
    act(() => getCtx().updatePitchBody('v1', 'Changed body'));
    const d = getCtx().pitchDrafts[0];
    expect(d.body).toBe('Changed body');
    expect(d.edited).toBe(true);
  });

  it('updatePitchBody sets edited=false when body matches original', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setPitchDrafts([DRAFT]));
    act(() => getCtx().updatePitchBody('v1', 'Hello world'));
    expect(getCtx().pitchDrafts[0].edited).toBe(false);
  });

  it('approvePitch marks a draft approved', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setPitchDrafts([DRAFT]));
    act(() => getCtx().approvePitch('v1'));
    expect(getCtx().pitchDrafts[0].approved).toBe(true);
  });
});

// ─── outreach status ──────────────────────────────────────────────────────────

describe('outreach status', () => {
  const OUTREACH_ITEM: OutreachItem = {
    venueId: 'v1', venueName: 'Test', topicTitle: 'AI', status: 'Queued',
    lastUpdated: '1/1/2025', pitchBody: 'body', subjectLine: 'subject',
  };

  it('advanceOutreachStatus advances from Queued to Sent', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setOutreach([OUTREACH_ITEM]));
    act(() => getCtx().advanceOutreachStatus('v1'));
    expect(getCtx().outreach[0].status).toBe('Sent');
  });

  it('advanceOutreachStatus advances through full pipeline', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setOutreach([OUTREACH_ITEM]));
    const pipeline = ['Sent', 'Opened', 'Responded', 'Confirmed'];
    for (const expected of pipeline) {
      act(() => getCtx().advanceOutreachStatus('v1'));
      expect(getCtx().outreach[0].status).toBe(expected);
    }
  });

  it('advanceOutreachStatus does not advance past Confirmed', () => {
    const { getCtx } = renderWithApp(() => null);
    act(() => getCtx().setOutreach([{ ...OUTREACH_ITEM, status: 'Confirmed' }]));
    act(() => getCtx().advanceOutreachStatus('v1'));
    expect(getCtx().outreach[0].status).toBe('Confirmed');
  });
});
