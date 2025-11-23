import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addAgentToChannel } from '@/lib/streamchat';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated and is CSM
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is CSM
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'csm') {
      return NextResponse.json({ error: 'Only CSM agents can join channels' }, { status: 403 });
    }

    // Parse request body
    const { conversation_id, agent_id } = await request.json();

    if (!conversation_id || !agent_id) {
      return NextResponse.json(
        { error: 'Missing conversation_id or agent_id' },
        { status: 400 }
      );
    }

    // Verify the agent_id matches the authenticated user
    if (agent_id !== user.id) {
      return NextResponse.json({ error: 'Agent ID mismatch' }, { status: 403 });
    }

    // Fetch conversation to get original creator (user_id)
    const { data: conversation, error: convError } = await supabase
      .from('support_conversations')
      .select('id, user_id')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Add agent to Stream Chat channel using conversation owner as creator
    await addAgentToChannel(conversation_id, agent_id, conversation.user_id);

    // Get agent name for system message
    const { data: agentProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', agent_id)
      .single();

    const agentName = agentProfile?.full_name || 'A support agent';

    // Send system message to notify user
    try {
      const { getStreamServerClient } = await import('@/lib/streamchat');
      const streamClient = getStreamServerClient();
      const channel = streamClient.channel('team', `support-${conversation_id}`);
      
      await channel.sendMessage({
        text: `👋 ${agentName} has joined the conversation and is ready to help!`,
        user_id: 'system',
      });
    } catch (msgError) {
      console.error('Error sending system message:', msgError);
      // Don't fail the request if message fails
    }

    return NextResponse.json({
      success: true,
      message: 'Agent added to channel successfully'
    });

  } catch (error) {
    console.error('Error adding agent to channel:', error);
    return NextResponse.json(
      { error: 'Failed to add agent to channel' },
      { status: 500 }
    );
  }
}
