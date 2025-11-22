// Supabase Edge Functions Client Wrapper
// Use these helpers to call Edge Functions from Next.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for function responses
export interface RequestAgentResponse {
  success: boolean;
  conversation_id: string;
  queue_position: number;
  estimated_wait_minutes: number;
  stream_chat_channel_id: string;
  stream_user_token: string;
}

export interface QueueStatusResponse {
  status: 'waiting_agent' | 'with_agent' | 'resolved' | 'closed';
  queue_position: number;
  estimated_wait_minutes: number;
  assigned_agent: {
    id: string;
    name: string;
  } | null;
  created_at: string;
  assigned_at: string | null;
}

export interface CloseConversationResponse {
  success: boolean;
  message: string;
}

// Request human agent
export async function requestAgent(params: {
  user_id: string;
  user_name: string;
  user_email?: string;
  chat_summary: Array<{
    role: 'user' | 'ai';
    message: string;
    timestamp: string;
  }>;
  reason?: string;
  language_preference?: string;
  priority?: number;
  subject?: string;
}): Promise<RequestAgentResponse> {
  const { data, error } = await supabase.functions.invoke('request-agent', {
    body: params,
  });

  if (error) throw error;
  return data;
}

// Check queue status
export async function checkQueueStatus(
  conversationId: string
): Promise<QueueStatusResponse> {
  const { data, error } = await supabase.functions.invoke('queue-status', {
    body: { conversation_id: conversationId },
  });

  if (error) throw error;
  return data;
}

// Close conversation
export async function closeConversation(
  conversationId: string,
  satisfactionRating?: number
): Promise<CloseConversationResponse> {
  const { data, error } = await supabase.functions.invoke('close-conversation', {
    body: {
      conversation_id: conversationId,
      satisfaction_rating: satisfactionRating,
    },
  });

  if (error) throw error;
  return data;
}
