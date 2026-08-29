"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Lazy initialization - only creates client when env vars are available
export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null; // Server-side: use server client
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) return null;
  
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return client;
}

// Convenience export - returns null if not configured
export const supabase = typeof window !== "undefined" ? getSupabase() : null;
