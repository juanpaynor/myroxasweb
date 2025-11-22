// Supabase Edge Function: queue-status
// Deploy to: supabase/functions/queue-status/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { conversation_id } = await req.json()

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ error: 'Missing conversation_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabaseClient
      .from('support_conversations')
      .select(`
        *,
        user:user_profiles!inner(full_name, email)
      `)
      .eq('id', conversation_id)
      .single()

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify ownership
    if (conversation.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let queuePosition = 0
    let estimatedWaitMinutes = 0
    let assignedAgent = null

    // If waiting, calculate queue position
    if (conversation.status === 'waiting_agent') {
      const { data: queueData } = await supabaseClient
        .from('agent_queue')
        .select('id, waiting_since')
        .order('priority', { ascending: false })
        .order('waiting_since', { ascending: true })

      queuePosition = queueData?.findIndex((item: any) => item.id === conversation_id) + 1 || 0
      estimatedWaitMinutes = Math.max(queuePosition * 5, 2)
    }

    // If active, get agent info
    if (conversation.status === 'with_agent' && conversation.assigned_agent_id) {
      const { data: agentData } = await supabaseClient
        .from('user_profiles')
        .select('id, full_name')
        .eq('id', conversation.assigned_agent_id)
        .single()

      assignedAgent = agentData ? {
        id: agentData.id,
        name: agentData.full_name,
      } : null
    }

    return new Response(
      JSON.stringify({
        status: conversation.status,
        queue_position: queuePosition,
        estimated_wait_minutes: estimatedWaitMinutes,
        assigned_agent: assignedAgent,
        created_at: conversation.created_at,
        assigned_at: conversation.assigned_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in queue-status function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
