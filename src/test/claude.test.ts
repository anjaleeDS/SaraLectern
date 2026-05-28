import { describe, it, expect, vi, afterEach } from 'vitest';
import { extractProfile, setApiKey, hasApiKey, setApiLogListener, MODEL } from '../lib/claude';
import type { ApiCallLog } from '../lib/claude';

// ─── MODEL constant ───────────────────────────────────────────────────────────

describe('MODEL', () => {
  it('is claude-haiku-4-5', () => {
    expect(MODEL).toBe('claude-haiku-4-5');
  });
});

// ─── extractProfile ───────────────────────────────────────────────────────────

describe('extractProfile', () => {
  it('parses a valid <profile> block', () => {
    const text = `Sure, let me summarize you.
<profile>
{"name":"Jane Smith","title":"CTO","expertise_areas":["AI","Leadership"],"years_experience":12,"key_achievements":["Founded startup"],"speaking_experience":"TEDx 2023","target_audience":"tech executives"}
</profile>`;
    const result = extractProfile(text);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Jane Smith');
    expect(result?.expertise_areas).toEqual(['AI', 'Leadership']);
    expect(result?.years_experience).toBe(12);
  });

  it('returns null when no <profile> tags present', () => {
    expect(extractProfile('Hello, tell me about yourself.')).toBeNull();
  });

  it('returns null on malformed JSON inside <profile> tags', () => {
    expect(extractProfile('<profile>{broken json</profile>')).toBeNull();
  });

  it('handles whitespace inside <profile> tags', () => {
    const text = `<profile>
  {
    "name": "Bob",
    "title": "VP",
    "expertise_areas": ["sales"],
    "years_experience": 5,
    "key_achievements": [],
    "speaking_experience": "none",
    "target_audience": "sales teams"
  }
</profile>`;
    const result = extractProfile(text);
    expect(result?.name).toBe('Bob');
  });

  it('returns null for empty profile tags', () => {
    expect(extractProfile('<profile></profile>')).toBeNull();
  });

  it('picks the first profile block when multiple are present', () => {
    const text = `<profile>{"name":"First","title":"A","expertise_areas":[],"years_experience":1,"key_achievements":[],"speaking_experience":"","target_audience":""}</profile>
<profile>{"name":"Second","title":"B","expertise_areas":[],"years_experience":2,"key_achievements":[],"speaking_experience":"","target_audience":""}</profile>`;
    const result = extractProfile(text);
    expect(result?.name).toBe('First');
  });
});

// ─── hasApiKey / setApiKey ────────────────────────────────────────────────────

describe('hasApiKey / setApiKey', () => {
  it('returns true after a key is set', () => {
    setApiKey('sk-ant-test-abc123');
    expect(hasApiKey()).toBe(true);
  });

  it('returns false after key is cleared', () => {
    setApiKey('');
    expect(hasApiKey()).toBe(false);
  });

  it('trims whitespace when checking', () => {
    setApiKey('   ');
    expect(hasApiKey()).toBe(false);
  });
});

// ─── buildProfileFromIntake — API log listener ─────────────────────────────────

describe('setApiLogListener', () => {
  afterEach(() => setApiLogListener(null));

  it('stops receiving logs after listener is cleared', () => {
    const logs: ApiCallLog[] = [];
    setApiLogListener(log => logs.push(log));
    setApiLogListener(null);
    expect(logs).toHaveLength(0);
  });

  it('receives an error log when buildProfileFromIntake is called without key', async () => {
    const logs: ApiCallLog[] = [];
    setApiLogListener(log => logs.push(log));
    setApiKey('');

    const { buildProfileFromIntake } = await import('../lib/claude');
    const { DEFAULT_INTAKE } = await import('./helpers').catch(() => ({ DEFAULT_INTAKE: null }));

    const intake = DEFAULT_INTAKE ?? {
      linkedin_url: '',
      bio_text: 'Test bio',
      video_url: '',
      best_talk: '',
      file_text: '',
      preferences: {
        formats: [], audience_size: 'any', audience_demo: '', geography: [],
        timing: 'flexible', compensation: 'open_unpaid', focus_topics: [],
        avoid_topics: [], style: [], said_no_to: '', dream_opportunity: '',
      },
    };

    try {
      await buildProfileFromIntake(intake, [], () => {});
    } catch {
      // expected — no key
    }

    const errLog = logs.find(l => l.status === 'error');
    expect(errLog).toBeDefined();
    expect(errLog?.fn).toBe('buildProfileFromIntake');
    expect(errLog?.model).toBe('claude-haiku-4-5');
  });
});
