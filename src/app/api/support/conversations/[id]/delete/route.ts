import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStreamServerClient } from '@/lib/streamchat';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { id: conversationId } = await params;

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with service role for deletion
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
      return NextResponse.json({ error: 'Only CSM agents can delete conversations' }, { status: 403 });
    }

    // Get conversation details for Stream channel ID
    const { data: conversation, error: convError } = await supabase
      .from('support_conversations')
      .select('stream_channel_id, user_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // End Stream Chat session and delete channel
    try {
      const streamClient = getStreamServerClient();
      const channelId = conversation.stream_channel_id || `support-${conversationId}`;
      const channel = streamClient.channel('team', channelId);
      
      // Send a final system message before deleting
      await channel.sendMessage({
        text: '❌ This conversation has been ended by an agent.',
        user_id: 'system',
      });

      // Delete the channel (this ends the chat session)
      await channel.delete();
    } catch (streamError) {
      console.error('Error deleting Stream channel:', streamError);
      // Continue even if Stream deletion fails
    }

    // Delete from agent_queue if exists
    await supabase
      .from('agent_queue')
      .delete()
      .eq('conversation_id', conversationId);

    // Delete the conversation from database
    const { error: deleteError } = await supabase
      .from('support_conversations')
      .delete()
      .eq('id', conversationId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ 
      success: true,
      message: 'Conversation ended and deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
