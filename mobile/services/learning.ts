// Learning library: series, modules, and per-user progress.
// Content lives in Supabase (learning_series / learning_series_modules, seeded by
// migration 012); progress is couple-visible via learning_series_progress.

import { supabase } from './supabase';

export interface LearningSection {
  title: string;
  body: string;
  research?: { text: string; source: string; year: number };
  example?: { scenario: string; dialogue?: string; analysis?: string };
  tip?: { title: string; steps: string[] };
}

export interface LearningModule {
  series_key: string;
  module_key: string;
  title: string;
  summary: string;
  description: string | null;
  duration: string;
  sort_order: number;
  frameworks: string[];
  content: { introduction: string; sections: LearningSection[]; conclusion: string } | null;
  key_takeaways: string[];
  exercises: { title: string; description?: string; duration?: string; instructions: string[] }[];
  reflection: { question: string; followUp?: string } | null;
}

export interface LearningSeries {
  series_key: string;
  title: string;
  summary: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  modules: Pick<LearningModule, 'module_key' | 'title' | 'summary' | 'duration' | 'sort_order'>[];
}

const MODULE_LIST_COLUMNS = 'module_key, title, summary, duration, sort_order';

function sortModules<T extends { sort_order: number }>(modules: T[] | null | undefined): T[] {
  return (modules || []).slice().sort((a, b) => a.sort_order - b.sort_order);
}

/** All series with their module outlines (no lesson bodies), in display order. */
export async function fetchSeriesList(): Promise<LearningSeries[]> {
  const { data, error } = await supabase
    .from('learning_series')
    .select(`series_key, title, summary, description, icon, sort_order, learning_series_modules(${MODULE_LIST_COLUMNS})`)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(({ learning_series_modules, ...series }: any) => ({
    ...series,
    modules: sortModules(learning_series_modules),
  }));
}

/** One series with its module outlines, or null if the key is unknown. */
export async function fetchSeries(seriesKey: string): Promise<LearningSeries | null> {
  const { data, error } = await supabase
    .from('learning_series')
    .select(`series_key, title, summary, description, icon, sort_order, learning_series_modules(${MODULE_LIST_COLUMNS})`)
    .eq('series_key', seriesKey)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { learning_series_modules, ...series } = data as any;
  return { ...series, modules: sortModules(learning_series_modules) };
}

/** A full lesson, or null if it doesn't exist. */
export async function fetchModule(seriesKey: string, moduleKey: string): Promise<LearningModule | null> {
  const { data, error } = await supabase
    .from('learning_series_modules')
    .select('*')
    .eq('series_key', seriesKey)
    .eq('module_key', moduleKey)
    .maybeSingle();
  if (error) throw error;
  return (data as LearningModule) || null;
}

/** Titles for the given series keys (e.g. onboarding recommendations), keyed by series_key. */
export async function fetchSeriesTitles(seriesKeys: string[]): Promise<Record<string, string>> {
  if (!seriesKeys.length) return {};
  const { data, error } = await supabase
    .from('learning_series')
    .select('series_key, title')
    .in('series_key', seriesKeys);
  if (error) throw error;
  return Object.fromEntries((data || []).map((row) => [row.series_key, row.title]));
}

/** Module keys the given user has completed, per series. */
export async function fetchCompletedModules(userId: string, seriesKey?: string): Promise<Record<string, Set<string>>> {
  let query = supabase
    .from('learning_series_progress')
    .select('series_key, module_key')
    .eq('user_id', userId)
    .eq('completed', true);
  if (seriesKey) query = query.eq('series_key', seriesKey);
  const { data, error } = await query;
  if (error) throw error;
  const completed: Record<string, Set<string>> = {};
  for (const row of data || []) {
    (completed[row.series_key] ||= new Set()).add(row.module_key);
  }
  return completed;
}

/** Mark a lesson complete for the signed-in user (linked to their active couple, if any). */
export async function markModuleComplete(userId: string, seriesKey: string, moduleKey: string): Promise<void> {
  const { data: couple } = await supabase
    .from('couple_units')
    .select('id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'active')
    .maybeSingle();

  const now = new Date().toISOString();
  const { error } = await supabase.from('learning_series_progress').upsert(
    {
      user_id: userId,
      couple_unit_id: couple?.id ?? null,
      series_key: seriesKey,
      module_key: moduleKey,
      completed: true,
      completed_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id,series_key,module_key' }
  );
  if (error) throw error;
}
