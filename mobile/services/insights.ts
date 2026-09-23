// AI insights come from the backend (backend/routes/insights.py), which loads the data,
// generates once, and stores the result. The app only asks for them by id.

import { supabase } from './supabase';
import { logError } from './sentry';

export type InsightStatus = 'ready' | 'pending' | 'limit' | 'unavailable' | 'failed' | 'not_ready';

export interface InsightResponse<T = any> {
  status: InsightStatus;
  content?: T;
  message?: string;
}

export interface IndividualInsight {
  headline: string;
  summary: string;
  strengths: string[];
  growth_edges: string[];
  connections: string | null;
  try_this_week: string[];
  reflection_question: string | null;
  safety_note: string | null;
}

export interface CoupleInsight {
  headline: string;
  narrative: string;
  shared_strengths: string[];
  growth_opportunities: string[];
  how_you_differ: string | null;
  conversation_starters: string[];
  try_together: string[];
  strength_affirmation: string;
  safety_note: string | null;
}

export interface RelationshipSummary {
  headline: string;
  overview: string;
  highlights: string[];
  patterns: string[];
  focus_for_next_month: string[];
  strength_affirmation: string;
  safety_note: string | null;
}

/** POST to the backend with the signed-in user's session token. */
export async function backendPost(path: string, body?: unknown): Promise<{ status: number; data: any }> {
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (!backendUrl) throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured; set it in .env before building.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in');
  const response = await fetch(`${backendUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // non-JSON error bodies are reported by status alone
  }
  return { status: response.status, data };
}

async function requestInsight<T>(path: string): Promise<InsightResponse<T>> {
  try {
    const { status, data } = await backendPost(path);
    if (status === 200 && data?.status === 'ready') return { status: 'ready', content: data.content };
    if (status === 202) return { status: 'pending' };
    if (status === 402) return { status: 'limit', message: data?.detail };
    if (status === 409) return { status: 'not_ready', message: data?.detail };
    if (status === 503) return { status: 'unavailable', message: data?.detail };
    logError(new Error(`Insight request failed with ${status}`), { tags: { feature: 'ai_insights' }, extra: { path } });
    return { status: 'failed', message: data?.detail };
  } catch (error) {
    logError(error, { tags: { feature: 'ai_insights' }, extra: { path } });
    return { status: 'failed' };
  }
}

export const requestIndividualInsight = (sessionId: string) =>
  requestInsight<IndividualInsight>(`/api/insights/individual/${sessionId}`);

export const requestCoupleInsight = (coupleResultId: string) =>
  requestInsight<CoupleInsight>(`/api/insights/couple/${coupleResultId}`);

export const requestRelationshipSummary = () => requestInsight<RelationshipSummary>('/api/insights/summary');
