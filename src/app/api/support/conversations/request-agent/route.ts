import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { upsertStreamUser, createSupportChannel } from '@/lib/streamchat';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get user from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    // Create Supabase client with user's token
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      user_id, 
      user_name,
      user_email,
      chat_summary,      // Array of {role, message, timestamp}
      reason,
      language_preference = 'English',
      priority = 5,
      subject 
    } = body;

    // Validate required fields
    if (!user_id || !user_name) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, user_name' }, 
        { status: 400 }
      );
    }

    // Ensure user_id matches authenticated user
    if (user_id !== user.id) {
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user_id)
      .single();

    const displayName = profile?.full_name || user_name;
    const emailAddress = profile?.email || user_email;

    // Create Stream Chat user and get token
    const streamToken = await upsertStreamUser(user_id, displayName, 'user');

    // Create conversation in database
    const conversationId = crypto.randomUUID();
    const streamChannelId = `support-${conversationId}`;

    // Extract last user message for subject if not provided
    const lastUserMsg = chat_summary?.filter((m: any) => m.role === 'user').pop();
    const conversationSubject = subject || lastUserMsg?.message?.substring(0, 100) || 'Support Request';

    const { error: conversationError } = await supabase
      .from('support_conversations')
      .insert({
        id: conversationId,
        user_id: user_id,
        stream_channel_id: streamChannelId,
        status: 'waiting_agent',
        priority: priority,
        subject: conversationSubject,
        ai_conversation_summary: JSON.stringify(chat_summary || []),
        language_preference: language_preference,
      });

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      return NextResponse.json(
        { error: 'Failed to create conversation' }, 
        { status: 500 }
      );
    }

    // Create Stream Chat channel
    const channel = await createSupportChannel(conversationId, user_id);
    
    // Send chat history to Stream Chat channel as system messages
    if (chat_summary && Array.isArray(chat_summary)) {
      for (const msg of chat_summary) {
        try {
          await channel.sendMessage({
            text: `[${msg.role.toUpperCase()}]: ${msg.message}`,
            user_id: 'system',
          });
        } catch (error) {
          console.error('Error sending chat history:', error);
          // Continue even if history fails
        }
      }
    }

    // Add to agent queue
    const { error: queueError } = await supabase
      .from('agent_queue')
      .insert({
        conversation_id: conversationId,
        priority: priority,
      });

    if (queueError) {
      console.error('Error adding to queue:', queueError);
      return NextResponse.json(
        { error: 'Failed to add to queue' }, 
        { status: 500 }
      );
    }

    // Get queue position
    const { data: queueData, error: queuePosError } = await supabase
      .from('agent_queue')
      .select('id')
      .order('priority', { ascending: false })
      .order('waiting_since', { ascending: true });

    const queuePosition = queuePosError ? 0 : 
      queueData?.findIndex(item => item.id === conversationId) + 1 || 1;

    // Estimate wait time (5 minutes per person in queue)
    const estimatedWaitMinutes = Math.max(queuePosition * 5, 2);

    // Return response matching mobile team's expected format
    return NextResponse.json({
      success: true,
      conversation_id: conversationId,
      queue_position: queuePosition,
      estimated_wait_minutes: estimatedWaitMinutes,
      stream_chat_channel_id: streamChannelId,
      stream_user_token: streamToken,
    });

  } catch (error) {
    console.error('Error in request-agent endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
