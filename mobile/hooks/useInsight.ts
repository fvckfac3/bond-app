// Request an AI insight and keep polling while the backend reports it's being written.

import { useCallback, useEffect, useRef, useState } from 'react';
import { InsightResponse, InsightStatus } from '../services/insights';

const POLL_MS = 4000;
const MAX_POLLS = 30; // ~2 minutes

export interface InsightState<T> {
  status: InsightStatus | 'idle';
  content?: T;
  message?: string;
}

/**
 * `request` asks the backend (idempotent: a ready insight comes straight back).
 * `initial` is what's already stored (e.g. read from Supabase) so a ready insight shows instantly.
 * Pass `auto: false` to wait for an explicit `start()` (e.g. a "Get summary" button).
 */
export function useInsight<T>(
  request: (() => Promise<InsightResponse<T>>) | null,
  initial?: T | null,
  auto = true
) {
  const [state, setState] = useState<InsightState<T>>(
    initial ? { status: 'ready', content: initial } : { status: 'idle' }
  );
  const polls = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (initial) setState({ status: 'ready', content: initial });
  }, [initial]);

  const run = useCallback(async () => {
    if (!request) return;
    const result = await request();
    if (!active.current) return;
    if (result.status === 'pending' && polls.current < MAX_POLLS) {
      polls.current += 1;
      setState({ status: 'pending' });
      timer.current = setTimeout(run, POLL_MS);
      return;
    }
    setState(result.status === 'pending' ? { status: 'failed' } : result);
  }, [request]);

  const start = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    polls.current = 0;
    setState({ status: 'pending' });
    run();
  }, [run]);

  useEffect(() => {
    if (auto && request && !initial && state.status === 'idle') start();
  }, [auto, request, initial, state.status, start]);

  return { ...state, start };
}
