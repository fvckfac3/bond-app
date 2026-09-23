// The signed-in user and their active couple, for screens that read couple-scoped tables.

import { supabase } from './supabase';

export interface CoupleContext {
  userId: string;
  coupleUnitId: string | null;
  partnerId: string | null;
}

/** Null when signed out; coupleUnitId/partnerId are null until the user is paired. */
export async function getCoupleContext(): Promise<CoupleContext | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: couple, error } = await supabase
    .from('couple_units')
    .select('id, user1_id, user2_id')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;

  return {
    userId: user.id,
    coupleUnitId: couple?.id ?? null,
    partnerId: couple ? (couple.user1_id === user.id ? couple.user2_id : couple.user1_id) : null,
  };
}
