import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_* env vars. See .env.local.example for required values.')
}

let client: SupabaseClient | undefined

async function getSupabaseClient() {
  // Wait until we're in the browser
  if (typeof window === 'undefined') {
    // Return a promise that will never resolve on the server
    // This prevents SSR errors while still working in the browser
    return new Promise<SupabaseClient>(() => {})
  }
  
  if (!client) {
    const { createBrowserClient } = await import('@supabase/ssr')
    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  
  return client
}

// Export a promise that resolves to the client
export const supabase = getSupabaseClient()

// TypeScript types for database tables
export type Report = {
  id: string
  user_id: string
  category_id: string
  title: string
  description: string
  location_lat: number | null
  location_lng: number | null
  location_address: string | null
  urgency: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
  assigned_to: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export type ReportCategory = {
  id: string
  name: string
  description: string | null
  icon: string
  color: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export type ReportAttachment = {
  id: string
  report_id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  uploaded_by: string
  created_at: string
}

export type ReportComment = {
  id: string
  report_id: string
  user_id: string
  comment: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export type ReportStatusHistory = {
  id: string
  report_id: string
  old_status: string
  new_status: string
  changed_by: string
  notes: string | null
  created_at: string
}
