// Supabase Client Configuration
// ================================
// You need to set up these environment variables in your .env file:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key
//
// Get these from: https://supabase.com/dashboard/project/_/settings/api

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Only create client if credentials are present
export const supabase: SupabaseClient | null = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase credentials not found. Running in local-only mode. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file for cloud sync.');
}

// Database Types
export interface ShowRow {
    id: string;
    date: string;
    time: string | null;
    venue: string;
    city: string;
    country: string;
    ticket_url: string | null;
    flyer_image: string | null;
    description: string | null;
    is_past: boolean;
    created_at: string;
    updated_at: string;
}
