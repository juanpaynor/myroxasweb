// Supabase Edge Function: close-conversation
// Deploy to: supabase/functions/close-conversation/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { StreamChat } from 'https://esm.sh/stream-chat@8'

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

    const { conversation_id, satisfaction_rating } = await req.json()

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ error: 'Missing conversation_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify ownership
    const { data: conversation } = await supabaseClient
      .from('support_conversations')
      .select('user_id, stream_channel_id')
      .eq('id', conversation_id)
      .single()

    if (!conversation || conversation.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update conversation
    const updateData: any = {
      status: 'closed',
      closed_at: new Date().toISOString(),
    }

    if (satisfaction_rating !== undefined && satisfaction_rating >= 1 && satisfaction_rating <= 5) {
      updateData.satisfaction_rating = satisfaction_rating
    }

    const { error: updateError } = await supabaseClient
      .from('support_conversations')
      .update(updateData)
      .eq('id', conversation_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to close conversation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Remove from queue
    await supabaseClient
      .from('agent_queue')
      .delete()
      .eq('conversation_id', conversation_id)

    // Send system message to Stream Chat
    try {
      const streamClient = StreamChat.getInstance(
        Deno.env.get('STREAM_CHAT_API_KEY') ?? '',
        Deno.env.get('STREAM_CHAT_SECRET') ?? ''
      )

      const channel = streamClient.channel('messaging', conversation.stream_channel_id)
      await channel.sendMessage({
        text: 'This conversation has been closed. Thank you for contacting Roxas City support!',
        user_id: 'system',
      })
    } catch (error) {
      console.error('Error sending close message:', error)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conversation closed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in close-conversation function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
