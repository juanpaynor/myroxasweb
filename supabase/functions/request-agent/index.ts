// Supabase Edge Function: request-agent
// Deploy to: supabase/functions/request-agent/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from JWT token (automatically validated by Supabase)
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const {
      user_id,
      user_name,
      user_email,
      chat_summary,
      reason = 'user_requested',
      priority = 5,
      subject,
    } = await req.json()

    // Validate required fields
    if (!user_id || !user_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, user_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user_id matches authenticated user
    if (user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user_id)
      .single()

    const displayName = profile?.full_name || user_name
    const emailAddress = profile?.email || user_email

    // Generate conversation ID
    const conversationId = crypto.randomUUID()
    const streamChannelId = `support-${conversationId}`

    // Extract subject from last user message if not provided
    const lastUserMsg = chat_summary?.filter((m: any) => m.role === 'user').pop()
    const conversationSubject = subject || lastUserMsg?.message?.substring(0, 100) || 'Support Request'

    // Create conversation in database
    const { error: conversationError } = await supabaseClient
      .from('support_conversations')
      .insert({
        id: conversationId,
        user_id: user_id,
        stream_channel_id: streamChannelId,
        status: 'waiting_agent',
        priority: priority,
        subject: conversationSubject,
        ai_conversation_summary: JSON.stringify(chat_summary || []),
      })

    if (conversationError) {
      console.error('Error creating conversation:', conversationError)
      return new Response(
        JSON.stringify({ error: 'Failed to create conversation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Just skip Stream Chat creation in Edge Function
    // The Next.js API will handle it when needed
    const streamApiKey = Deno.env.get('STREAM_CHAT_API_KEY');
    const streamSecret = Deno.env.get('STREAM_CHAT_SECRET');
    
    if (!streamApiKey || !streamSecret) {
      console.error('Stream Chat credentials missing!');
      return new Response(
        JSON.stringify({ error: 'Stream Chat not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate a simple token for the user (they'll use this to connect)
    // We'll create users and channels via the Next.js API which has the working SDK
    const streamToken = 'placeholder-token-' + user_id;

    // Stream Chat setup will be handled by Next.js API endpoints
    // which have the working SDK

    // Add to agent queue
    const { error: queueError } = await supabaseClient
      .from('agent_queue')
      .insert({
        conversation_id: conversationId,
        priority: priority,
      })

    if (queueError) {
      console.error('Error adding to queue:', queueError)
      return new Response(
        JSON.stringify({ error: 'Failed to add to queue' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get queue position
    const { data: queueData } = await supabaseClient
      .from('agent_queue')
      .select('id')
      .order('priority', { ascending: false })
      .order('waiting_since', { ascending: true })

    const queuePosition = queueData?.findIndex((item: any) => item.id === conversationId) + 1 || 1
    const estimatedWaitMinutes = Math.max(queuePosition * 5, 2)

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conversationId,
        queue_position: queuePosition,
        estimated_wait_minutes: estimatedWaitMinutes,
        stream_chat_channel_id: streamChannelId,
        stream_user_token: streamToken,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in request-agent function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
