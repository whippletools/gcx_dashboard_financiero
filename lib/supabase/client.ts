import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Use GCX credentials if available, otherwise fallback to default
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}
