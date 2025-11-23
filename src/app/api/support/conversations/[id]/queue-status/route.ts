import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;

    // Get user from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with service role for querying
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication separately
    const userSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await userSupabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get conversation using service role (bypass RLS)
    const { data: conversation, error: convError } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('❌ Error fetching conversation:', {
        conversationId,
        error: convError,
        message: convError.message,
        code: convError.code,
        details: convError.details
      });
      return NextResponse.json({ 
        error: 'Conversation not found', 
        conversationId,
        errorDetails: convError.message 
      }, { status: 404 });
    }
    
    if (!conversation) {
      console.error('❌ Conversation is null:', { conversationId });
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    console.log('✅ Conversation found:', { 
      conversationId, 
      status: conversation.status,
      userId: conversation.user_id,
      requestingUserId: user.id
    });

    // Verify user owns this conversation
    if (conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get queue position if waiting
    let queuePosition = 0;
    let estimatedWaitMinutes = 0;

    if (conversation.status === 'waiting_agent') {
      const { data: queueData } = await supabase
        .from('agent_queue')
        .select('conversation_id, waiting_since')
        .order('priority', { ascending: false })
        .order('waiting_since', { ascending: true });

      if (queueData) {
        queuePosition = queueData.findIndex(item => item.conversation_id === conversationId) + 1;
        estimatedWaitMinutes = Math.max(queuePosition * 5, 2);
      }
    }

    // Get assigned agent info if active
    let assignedAgent = null;
    if (conversation.assigned_agent_id) {
      const { data: agentProfile } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('id', conversation.assigned_agent_id)
        .single();

      if (agentProfile) {
        assignedAgent = {
          id: agentProfile.id,
          name: agentProfile.full_name,
          email: agentProfile.email,
        };
      }
    }

    // Return status
    return NextResponse.json({
      status: conversation.status,
      queue_position: queuePosition,
      estimated_wait_minutes: estimatedWaitMinutes,
      assigned_agent: assignedAgent,
      created_at: conversation.created_at,
      assigned_at: conversation.assigned_at,
    });

  } catch (error) {
    console.error('Error in queue-status endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
