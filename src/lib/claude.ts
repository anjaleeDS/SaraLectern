import Anthropic from '@anthropic-ai/sdk';
import { SpeakerProfile, Topic, IntakeData } from '../types';

let _apiKey: string = import.meta.env.VITE_ANTHROPIC_API_KEY ?? '';

export function setApiKey(key: string) {
  _apiKey = key;
}

export function hasApiKey(): boolean {
  return _apiKey.trim().length > 0;
}

function getClient() {
  return new Anthropic({ apiKey: _apiKey, dangerouslyAllowBrowser: true });
}

export const MODEL = 'claude-haiku-4-5';

export interface ApiCallLog {
  id: string;
  timestamp: string;
  fn: string;
  model: string;
  status: 'pending' | 'success' | 'error';
  durationMs?: number;
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
}

let _logListener: ((log: ApiCallLog) => void) | null = null;
export function setApiLogListener(fn: ((log: ApiCallLog) => void) | null) {
  _logListener = fn;
}

function emitLog(log: ApiCallLog) {
  _logListener?.(log);
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export async function buildProfileFromIntake(
  intake: IntakeData,
  extractedSummaries: string[],
  onChunk: (text: string) => void
): Promise<string> {
  const sources: string[] = [];
  if (intake.bio_text.trim()) sources.push(`Bio/About:\n${intake.bio_text.trim()}`);
  if (intake.best_talk.trim()) sources.push(`Best talk: ${intake.best_talk.trim()}`);
  extractedSummaries.forEach((s, i) => {
    if (s.trim()) sources.push(`Extracted summary ${i + 1}:\n${s.trim()}`);
  });

  const sourceText = sources.length > 0
    ? sources.join('\n\n---\n\n')
    : 'No source material provided — create a minimal placeholder profile.';

  const system = `You are a profile extraction agent for Lectern, a speaker placement platform. Given one or more source documents about a speaker, synthesize a complete, accurate speaker profile.

Rules:
- Use ONLY information present in the source material. Never fabricate credentials.
- If a field cannot be determined from the sources, use a reasonable placeholder like "Not specified" for text fields, 0 for years_experience, or empty arrays.
- expertise_areas: extract 3-6 specific, concrete expertise areas as short phrases (e.g. "executive coaching", "AI ethics", "organizational change").
- key_achievements: extract 2-5 specific notable credentials, publications, awards, or accomplishments.
- speaking_experience: one sentence summarizing their speaking history, or "No speaking history provided."
- target_audience: one short phrase describing who they primarily serve.

After synthesizing, output ONLY this JSON wrapped in <profile> tags:

<profile>
{"name": "...", "title": "...", "expertise_areas": [...], "years_experience": 0, "key_achievements": [...], "speaking_experience": "...", "target_audience": "..."}
</profile>`;

  const logId = makeId();
  const start = Date.now();
  emitLog({ id: logId, timestamp: new Date().toISOString(), fn: 'buildProfileFromIntake', model: MODEL, status: 'pending' });

  try {
    const stream = getClient().messages.stream({
      model: MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: sourceText }],
    });

    stream.on('text', (delta) => onChunk(delta));

    const msg = await stream.finalMessage();
    const full = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    emitLog({
      id: logId, timestamp: new Date().toISOString(), fn: 'buildProfileFromIntake', model: MODEL,
      status: 'success', durationMs: Date.now() - start,
      inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens,
    });
    return full;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    emitLog({ id: logId, timestamp: new Date().toISOString(), fn: 'buildProfileFromIntake', model: MODEL, status: 'error', durationMs: Date.now() - start, error });
    throw err;
  }
}

export function extractProfile(text: string): SpeakerProfile | null {
  const match = text.match(/<profile>([\s\S]*?)<\/profile>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

export async function generateTopics(
  profile: SpeakerProfile,
  onChunk: (text: string) => void
): Promise<Topic[]> {
  const prefsContext = profile.preferences
    ? `\n\nSpeaker preferences: They prefer ${profile.preferences.formats.join(', ')} formats, ${profile.preferences.style.join('/')} style, targeting ${profile.preferences.audience_demo || profile.target_audience} audiences.${profile.preferences.focus_topics.length ? ` Focus areas: ${profile.preferences.focus_topics.join(', ')}.` : ''}${profile.preferences.avoid_topics.length ? ` Avoid: ${profile.preferences.avoid_topics.join(', ')}.` : ''}`
    : '';

  const system = `You are a topic generation agent. Based on this speaker profile, propose exactly 3 talking topics. For each topic: title, 2-sentence rationale (why this topic fits current market demand and what makes this speaker's angle distinctive), and best venue type (podcast / conference / workshop). Ground every topic strictly in the confirmed profile. Do not fabricate expertise. Return ONLY a JSON array with objects: {id, title, rationale, venue_type}`;

  const logId = makeId();
  const start = Date.now();
  emitLog({ id: logId, timestamp: new Date().toISOString(), fn: 'generateTopics', model: MODEL, status: 'pending' });

  try {
    const stream = getClient().messages.stream({
      model: MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: `Speaker profile:\n${JSON.stringify(profile, null, 2)}${prefsContext}` }],
    });

    stream.on('text', (delta) => onChunk(delta));

    const msg = await stream.finalMessage();
    const full = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    emitLog({
      id: logId, timestamp: new Date().toISOString(), fn: 'generateTopics', model: MODEL,
      status: 'success', durationMs: Date.now() - start,
      inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens,
    });

    const jsonMatch = full.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const raw = JSON.parse(jsonMatch[0]);
    return raw.map((t: { title: string; rationale: string; venue_type: string }, i: number) => ({
      id: `t${i + 1}`,
      title: t.title,
      rationale: t.rationale,
      venue_type: t.venue_type as Topic['venue_type'],
      locked: false,
    }));
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    emitLog({ id: logId, timestamp: new Date().toISOString(), fn: 'generateTopics', model: MODEL, status: 'error', durationMs: Date.now() - start, error });
    throw err;
  }
}

export async function generatePitch(
  profile: SpeakerProfile,
  topic: Topic,
  venueName: string,
  venueAudience: string,
  venueVertical: string,
  onChunk: (text: string) => void
): Promise<{ subjectLine: string; body: string }> {
  const prefsContext = profile.preferences
    ? `\n\nSpeaker tone preference: ${profile.preferences.style.length ? profile.preferences.style.join(', ') : 'professional'}. Dream opportunity: "${profile.preferences.dream_opportunity || 'not specified'}".`
    : '';

  const system = `You are a pitch drafting agent for Lectern. Write a personalized pitch email from the speaker to the venue. Rules: (1) Use ONLY facts from the confirmed speaker profile — never fabricate credentials. (2) If you are uncertain whether a claim is supported by the profile, flag it with [VERIFY]. (3) Keep it under 200 words. (4) Frame as: you are offering your perspective to an audience that needs it, not promoting yourself. (5) Include: one specific reason why this speaker fits this venue's audience, one concrete topic proposal with a one-line description, and a simple call to action. (6) Match the speaker's stated tone preference if provided. Return the pitch in this format:
SUBJECT: <subject line here>

<pitch body here>`;

  const logId = makeId();
  const start = Date.now();
  emitLog({ id: logId, timestamp: new Date().toISOString(), fn: `generatePitch:${venueName}`, model: MODEL, status: 'pending' });

  try {
    const stream = getClient().messages.stream({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{
        role: 'user',
        content: `Speaker profile:\n${JSON.stringify(profile, null, 2)}${prefsContext}\n\nVenue: ${venueName}\nVenue audience: ${venueAudience}\nVenue vertical: ${venueVertical}\nProposed topic: ${topic.title}\nTopic rationale: ${topic.rationale}`
      }],
    });

    stream.on('text', (delta) => onChunk(delta));

    const msg = await stream.finalMessage();
    const full = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    emitLog({
      id: logId, timestamp: new Date().toISOString(), fn: `generatePitch:${venueName}`, model: MODEL,
      status: 'success', durationMs: Date.now() - start,
      inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens,
    });

    const subjectMatch = full.match(/SUBJECT:\s*(.+)/);
    const subjectLine = subjectMatch ? subjectMatch[1].trim() : 'Speaking Opportunity Inquiry';
    const body = full.replace(/SUBJECT:\s*.+\n+/, '').trim();

    return { subjectLine, body };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    emitLog({ id: logId, timestamp: new Date().toISOString(), fn: `generatePitch:${venueName}`, model: MODEL, status: 'error', durationMs: Date.now() - start, error });
    throw err;
  }
}
