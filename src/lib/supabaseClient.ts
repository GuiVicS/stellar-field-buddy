/**
 * Supabase client for self-hosted deployments.
 * Checks window.__RUNTIME_CONFIG__ first (injected by docker-entrypoint.sh),
 * then falls back to import.meta.env (Lovable/local dev).
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_PUBLISHABLE_KEY: string;
    };
  }
}

function getUrl(): string {
  const rt = window.__RUNTIME_CONFIG__?.VITE_SUPABASE_URL;
  if (rt && !rt.includes('__PLACEHOLDER')) return rt;
  return import.meta.env.VITE_SUPABASE_URL;
}

function getKey(): string {
  const rt = window.__RUNTIME_CONFIG__?.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (rt && !rt.includes('__PLACEHOLDER')) return rt;
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
}

export const supabase = createClient<Database>(getUrl(), getKey(), {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
