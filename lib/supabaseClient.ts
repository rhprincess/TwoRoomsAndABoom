import { createClient } from '@supabase/supabase-js';

// Access environment variables safely for Vite
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://rkbutmsmzzxivziaqklg.supabase.com';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYnV0bXNtenp4aXZ6aWFxa2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NzUxMDEsImV4cCI6MjA4MDE1MTEwMX0.5rJEjXo8hkYhxWIx4IAyj2Rtv2Gtci1HOwTlzIT3p5g';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing! App will not function correctly.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});