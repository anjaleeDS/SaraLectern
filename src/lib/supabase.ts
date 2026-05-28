import { createClient } from '@supabase/supabase-js';
import { IntakeData } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SESSION_KEY = 'intake_session_id';

export function getStoredSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function storeSessionId(id: string) {
  localStorage.setItem(SESSION_KEY, id);
}

export async function upsertIntakeSession(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('intake_sessions')
    .upsert({ email }, { onConflict: 'email' })
    .select('id')
    .maybeSingle();
  if (error || !data) return null;
  storeSessionId(data.id);
  return data.id;
}

export async function saveIntakeDraft(sessionId: string, intakeData: Partial<IntakeData>): Promise<void> {
  const { data: existing } = await supabase
    .from('intake_drafts')
    .select('id')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('intake_drafts')
      .update({ intake_json: intakeData, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('intake_drafts')
      .insert({ session_id: sessionId, intake_json: intakeData });
  }
}

export async function loadIntakeDraft(sessionId: string): Promise<{ data: IntakeData | null; updatedAt: string | null }> {
  const { data } = await supabase
    .from('intake_drafts')
    .select('intake_json, updated_at')
    .eq('session_id', sessionId)
    .maybeSingle();
  if (!data) return { data: null, updatedAt: null };
  return { data: data.intake_json as IntakeData, updatedAt: data.updated_at };
}
