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
    
    // Get Bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's session
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Verify user is a CSM and assigned to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('support_conversations')
      .select('assigned_agent_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.assigned_agent_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Not assigned to this conversation' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { resolution_notes } = body;

    if (!resolution_notes || typeof resolution_notes !== 'string' || !resolution_notes.trim()) {
      return NextResponse.json(
        { error: 'Resolution notes are required' },
        { status: 400 }
      );
    }

    // Update conversation to resolved status
    const { error: updateError } = await supabase
      .from('support_conversations')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: resolution_notes.trim(),
      })
      .eq('id', conversationId);

    if (updateError) throw updateError;

    // Send system message to Stream Chat
    await sendSystemMessage(
      conversationId,
      `This conversation has been resolved. Resolution notes: ${resolution_notes.trim()}`
    );

    return NextResponse.json({
      success: true,
      message: 'Conversation resolved successfully',
    });
  } catch (error) {
    console.error('Error resolving conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
