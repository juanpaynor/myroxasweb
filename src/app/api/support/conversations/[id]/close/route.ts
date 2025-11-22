import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSystemMessage } from '@/lib/streamchat';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
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

    // Create Supabase client
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify user owns this conversation
    if (conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { satisfaction_rating, feedback } = body;

    // Validate rating if provided
    if (satisfaction_rating && (satisfaction_rating < 1 || satisfaction_rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' }, 
        { status: 400 }
      );
    }

    // Update conversation to closed
    const { error: updateError } = await supabase
      .from('support_conversations')
      .update({
        status: 'closed',
        user_satisfaction_rating: satisfaction_rating || null,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return NextResponse.json(
        { error: 'Failed to close conversation' }, 
        { status: 500 }
      );
    }

    // Remove from queue if still in queue
    await supabase
      .from('agent_queue')
      .delete()
      .eq('conversation_id', conversationId);

    // Send system message to Stream Chat
    try {
      await sendSystemMessage(
        conversationId, 
        'This conversation has been closed. Thank you for contacting support!'
      );
    } catch (streamError) {
      console.error('Error sending system message:', streamError);
      // Don't fail the request if Stream message fails
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Conversation closed successfully',
    });

  } catch (error) {
    console.error('Error in close conversation endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
