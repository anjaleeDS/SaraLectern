import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from '../context/AppContext';
import ApiKeyGate from '../screens/ApiKeyGate';
import ProfileConfirm from '../screens/ProfileConfirm';
import OutreachDashboard from '../screens/OutreachDashboard';
import PitchDrafts from '../screens/PitchDrafts';
import React, { useEffect } from 'react';
import { SpeakerProfile, OutreachItem, PitchDraft } from '../types';

// Mock the claude module so no real API calls happen
vi.mock('../lib/claude', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/claude')>();
  return {
    ...actual,
    buildProfileFromIntake: vi.fn().mockResolvedValue('<profile>{"name":"Jane Smith","title":"CTO","expertise_areas":["AI","Leadership"],"years_experience":12,"key_achievements":["Founded AI startup"],"speaking_experience":"TEDx 2023","target_audience":"tech executives"}</profile>'),
    generateTopics: vi.fn().mockResolvedValue([
      { id: 't1', title: 'AI in Leadership', rationale: 'High demand topic', venue_type: 'podcast', locked: false },
      { id: 't2', title: 'Future of Work', rationale: 'Timely subject', venue_type: 'conference', locked: false },
      { id: 't3', title: 'Ethical AI', rationale: 'Growing concern', venue_type: 'workshop', locked: false },
    ]),
    generatePitch: vi.fn().mockResolvedValue({
      subjectLine: 'Speaking Opportunity: AI in Leadership',
      body: 'Dear Host,\n\nI would love to speak on your show.\n\nBest,\nJane',
    }),
    hasApiKey: vi.fn().mockReturnValue(true),
    setApiKey: vi.fn(),
  };
});

const MOCK_PROFILE: SpeakerProfile = {
  name: 'Jane Smith', title: 'CTO',
  expertise_areas: ['AI', 'Leadership'],
  years_experience: 12,
  key_achievements: ['Founded AI startup'],
  speaking_experience: 'TEDx 2023',
  target_audience: 'tech executives',
};

// Helper: renders a screen with profile pre-loaded in context
function renderWithProfile(Component: React.FC) {
  function Setup() {
    const ctx = useApp();
    useEffect(() => {
      act(() => {
        ctx.setProfile(MOCK_PROFILE);
        ctx.setScreen('confirm');
      });
    }, []);
    return <Component />;
  }
  return render(<AppProvider><Setup /></AppProvider>);
}

// ─── ApiKeyGate ───────────────────────────────────────────────────────────────

describe('ApiKeyGate', () => {
  it('renders the API key form', () => {
    render(<ApiKeyGate missingAnthropic={true} missingGemini={false} onKeys={vi.fn()} />);
    expect(screen.getByText('API Keys Required')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/sk-ant/)).toBeInTheDocument();
  });

  it('submit button is disabled when input is empty', () => {
    render(<ApiKeyGate missingAnthropic={true} missingGemini={false} onKeys={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });

  it('shows error when key does not start with sk-ant-', async () => {
    const user = userEvent.setup();
    render(<ApiKeyGate missingAnthropic={true} missingGemini={false} onKeys={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/sk-ant/), 'invalid-key');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(screen.getByText(/must start with sk-ant/i)).toBeInTheDocument();
  });

  it('calls onKeys with valid key', async () => {
    const user = userEvent.setup();
    const onKeys = vi.fn();
    render(<ApiKeyGate missingAnthropic={true} missingGemini={false} onKeys={onKeys} />);
    await user.type(screen.getByPlaceholderText(/sk-ant/), 'sk-ant-api03-validkey');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(onKeys).toHaveBeenCalledWith({ anthropic: 'sk-ant-api03-validkey' });
  });

  it('clears error when user types again after error', async () => {
    const user = userEvent.setup();
    render(<ApiKeyGate missingAnthropic={true} missingGemini={false} onKeys={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/sk-ant/), 'bad');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(screen.getByText(/must start with sk-ant/i)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/sk-ant/), 'x');
    expect(screen.queryByText(/must start with sk-ant/i)).not.toBeInTheDocument();
  });
});

// ─── ProfileConfirm ───────────────────────────────────────────────────────────

describe('ProfileConfirm', () => {
  it('renders the profile name', async () => {
    renderWithProfile(ProfileConfirm);
    await waitFor(() => expect(screen.getByText('Jane Smith')).toBeInTheDocument());
  });

  it('renders confirm button', async () => {
    renderWithProfile(ProfileConfirm);
    await waitFor(() => expect(screen.getByRole('button', { name: /These look right/i })).toBeInTheDocument());
  });

  it('renders expertise areas', async () => {
    renderWithProfile(ProfileConfirm);
    await waitFor(() => expect(screen.getByText('AI')).toBeInTheDocument());
  });

  it('renders the amber warning notice', async () => {
    renderWithProfile(ProfileConfirm);
    await waitFor(() => expect(screen.getByText(/Review carefully/i)).toBeInTheDocument());
  });

  it('renders nothing when profile is not yet set', () => {
    render(<AppProvider><ProfileConfirm /></AppProvider>);
    expect(screen.queryByText(/Your Profile/i)).not.toBeInTheDocument();
  });
});

// ─── OutreachDashboard ────────────────────────────────────────────────────────

describe('OutreachDashboard', () => {
  const ITEMS: OutreachItem[] = [
    { venueId: 'v1', venueName: 'AI Podcast', topicTitle: 'AI Leadership', status: 'Queued', lastUpdated: '5/24/2026', pitchBody: 'body', subjectLine: 'Subject' },
    { venueId: 'v2', venueName: 'Tech Summit', topicTitle: 'Future of Work', status: 'Sent', lastUpdated: '5/23/2026', pitchBody: 'body2', subjectLine: 'Subject 2' },
  ];

  function renderDashboard(items = ITEMS) {
    let ctx: ReturnType<typeof useApp>;
    function Setup() {
      ctx = useApp();
      useEffect(() => { act(() => ctx.setOutreach(items)); }, []);
      return <OutreachDashboard />;
    }
    render(<AppProvider><Setup /></AppProvider>);
    return { getCtx: () => ctx! };
  }

  it('renders venue names', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('AI Podcast')).toBeInTheDocument());
    expect(screen.getByText('Tech Summit')).toBeInTheDocument();
  });

  it('renders status badges', async () => {
    renderDashboard();
    await waitFor(() => {
      const queuedEls = screen.getAllByText('Queued');
      expect(queuedEls.some(el => el.classList.contains('rounded-full'))).toBe(true);
      const sentEls = screen.getAllByText('Sent');
      expect(sentEls.some(el => el.classList.contains('rounded-full'))).toBe(true);
    });
  });

  it('renders Mark Sent button for Queued item', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Mark Sent')).toBeInTheDocument());
  });

  it('clicking Mark Sent advances status to Sent', async () => {
    const { getCtx } = renderDashboard();
    await waitFor(() => screen.getByText('Mark Sent'));
    fireEvent.click(screen.getByText('Mark Sent'));
    await waitFor(() => expect(getCtx().outreach.find(o => o.venueId === 'v1')?.status).toBe('Sent'));
  });

  it('does not show Mark button for Confirmed items', async () => {
    renderDashboard([{ ...ITEMS[0], status: 'Confirmed' }]);
    await waitFor(() => {
      const els = screen.getAllByText('Confirmed');
      expect(els.some(el => el.classList.contains('rounded-full'))).toBe(true);
    });
    expect(screen.queryByText(/Mark /)).not.toBeInTheDocument();
  });

  it('does not show Mark button for Declined items', async () => {
    renderDashboard([{ ...ITEMS[0], status: 'Declined' }]);
    await waitFor(() => screen.getByText('Declined'));
    expect(screen.queryByText(/Mark /)).not.toBeInTheDocument();
  });
});

// ─── BackButton warning modal ─────────────────────────────────────────────────

describe('BackButton warning modal', () => {
  it('shows warning modal when back is clicked', async () => {
    const user = userEvent.setup();
    renderWithProfile(ProfileConfirm);

    await waitFor(() => screen.getByText('Back'));
    await user.click(screen.getByText('Back'));

    await waitFor(() => expect(screen.getByText('Go back to intake?')).toBeInTheDocument());
    expect(screen.getByText('Yes, go back anyway')).toBeInTheDocument();
    expect(screen.getByText('Stay on this page')).toBeInTheDocument();
  });

  it('dismisses modal when Stay on this page is clicked', async () => {
    const user = userEvent.setup();
    renderWithProfile(ProfileConfirm);

    await waitFor(() => screen.getByText('Back'));
    await user.click(screen.getByText('Back'));
    await waitFor(() => screen.getByText('Stay on this page'));
    await user.click(screen.getByText('Stay on this page'));

    await waitFor(() => expect(screen.queryByText('Go back to intake?')).not.toBeInTheDocument());
  });

  it('navigates back when Yes go back is confirmed', async () => {
    const user = userEvent.setup();
    let capturedCtx: ReturnType<typeof useApp>;
    function Capture() {
      capturedCtx = useApp();
      useEffect(() => {
        act(() => {
          capturedCtx.setProfile(MOCK_PROFILE);
          capturedCtx.setScreen('confirm');
        });
      }, []);
      return <ProfileConfirm />;
    }
    render(<AppProvider><Capture /></AppProvider>);

    await waitFor(() => screen.getByText('Back'));
    await user.click(screen.getByText('Back'));
    await waitFor(() => screen.getByText('Yes, go back anyway'));
    await user.click(screen.getByText('Yes, go back anyway'));

    await waitFor(() => expect(capturedCtx!.screen).toBe('intake'));
  });
});

// ─── PitchDrafts ─────────────────────────────────────────────────────────────

describe('PitchDrafts', () => {
  const MOCK_DRAFTS: PitchDraft[] = [
    {
      venueId: 'v1', venueName: 'AI Podcast', topicTitle: 'AI Leadership',
      subjectLine: 'Speaking Opportunity', body: 'Hello, I would love to speak.\n\nLine 2.\n\nLine 3.\n\nLine 4.',
      approved: false, edited: false, originalBody: 'Hello, I would love to speak.\n\nLine 2.\n\nLine 3.\n\nLine 4.',
    },
  ];

  function renderPitches(drafts: PitchDraft[]) {
    let ctx: ReturnType<typeof useApp>;
    function Setup() {
      ctx = useApp();
      useEffect(() => {
        act(() => {
          ctx.setProfile(MOCK_PROFILE);
          ctx.setPitchDrafts(drafts);
        });
      }, []);
      return <PitchDrafts />;
    }
    render(<AppProvider><Setup /></AppProvider>);
    return { getCtx: () => ctx! };
  }

  it('renders venue name in pitch card', async () => {
    renderPitches(MOCK_DRAFTS);
    await waitFor(() => expect(screen.getByText('AI Podcast')).toBeInTheDocument());
  });

  it('renders subject line', async () => {
    renderPitches(MOCK_DRAFTS);
    await waitFor(() => expect(screen.getByText('Speaking Opportunity')).toBeInTheDocument());
  });

  it('Approve button is disabled before scrolling', async () => {
    renderPitches(MOCK_DRAFTS);
    await waitFor(() => screen.getByText(/Approve & Queue/));
    expect(screen.getByRole('button', { name: /Approve & Queue/i })).toBeDisabled();
  });

  it('Go to Outreach Dashboard button is disabled when no pitches approved', async () => {
    renderPitches(MOCK_DRAFTS);
    await waitFor(() => screen.getByText(/Go to Outreach Dashboard/));
    expect(screen.getByRole('button', { name: /Go to Outreach Dashboard/i })).toBeDisabled();
  });

  it('renders VERIFY badge when pitch body contains [VERIFY]', async () => {
    const verifyDraft = {
      ...MOCK_DRAFTS[0],
      body: 'You have [VERIFY] spoken at Fortune 500 events.',
      originalBody: 'You have [VERIFY] spoken at Fortune 500 events.',
    };
    renderPitches([verifyDraft]);
    await waitFor(() => expect(screen.getByText('VERIFY')).toBeInTheDocument());
  });

  it('renders amber warning banner when [VERIFY] is in body', async () => {
    const verifyDraft = {
      ...MOCK_DRAFTS[0],
      body: 'Check [VERIFY] this claim.',
      originalBody: 'Check [VERIFY] this claim.',
    };
    renderPitches([verifyDraft]);
    await waitFor(() =>
      expect(screen.getByText(/flagged for verification/i)).toBeInTheDocument()
    );
  });

  it('shows Edit draft button', async () => {
    renderPitches(MOCK_DRAFTS);
    await waitFor(() => expect(screen.getByText('Edit draft')).toBeInTheDocument());
  });

  it('clicking Edit draft shows textarea', async () => {
    const user = userEvent.setup();
    renderPitches(MOCK_DRAFTS);
    await waitFor(() => screen.getByText('Edit draft'));
    await user.click(screen.getByText('Edit draft'));
    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument());
  });

  it('approved pitch shows approved banner', async () => {
    const approvedDraft = { ...MOCK_DRAFTS[0], approved: true };
    renderPitches([approvedDraft]);
    await waitFor(() =>
      expect(screen.getByText(/Approved .* — queued for outreach/)).toBeInTheDocument()
    );
  });
});
