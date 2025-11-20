import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tkgjbddrdrzljfjsgtyl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrZ2piZGRyZHJ6bGpmanNndHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NTE3OTUsImV4cCI6MjA3OTAyNzc5NX0.eo46eubeYAR_4LR6zUU-7kk4AZOPZSd9DHaFoNEGgUE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
