import type { BillingCycle, Tier } from './institutional';

export interface Clinic {
  id: string;
  name: string;
  tier: Tier;
  base_seat_limit: number;
  extra_seats: number;
  billing_cycle: BillingCycle;
}

export interface Membership {
  id: string;
  clinic_id: string;
  role: 'admin' | 'clinician';
  full_name: string | null;
  clinic: Clinic;
}

export interface RosterRow {
  clinic_couple_id: string;
  couple_unit_id: string;
  status: 'pending' | 'active' | 'archived';
  last_active_at: string;
  partner_names: string[] | null;
  primary_clinician_name: string | null;
  unread_shared_reflections: number;
}

export interface DashboardMetrics {
  active_couples: number;
  connection_activities_this_week: number;
  unread_shared_reflections: number;
}

export interface SharedReflection {
  id: string;
  exercise_title: string | null;
  content: string;
  synced_at: string;
  clinician_read_at: string | null;
}

export interface ExerciseCompletionRow {
  week_start: string;
  category: string;
  gottman_informed: boolean;
  completions: number;
}

export interface DailyConnectionRow {
  day: string;
  check_ins: number;
  avg_connection: number | null;
  daily_answers: number;
}
