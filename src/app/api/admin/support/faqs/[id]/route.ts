import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/admin/support/faqs/:id - Get single FAQ
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: faq, error } = await supabase
      .from('support_faqs')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching FAQ:', error);
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json(faq);
  } catch (error) {
    console.error('Error in GET /api/admin/support/faqs/:id:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/support/faqs/:id - Update FAQ
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { category, question, answer, keywords, display_order, is_active } = body;

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (category !== undefined) updateData.category = category;
    if (question !== undefined) updateData.question = question;
    if (answer !== undefined) updateData.answer = answer;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update FAQ
    const { data: updatedFaq, error } = await supabase
      .from('support_faqs')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating FAQ:', error);
      return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
    }

    return NextResponse.json(updatedFaq);
  } catch (error) {
    console.error('Error in PUT /api/admin/support/faqs/:id:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/support/faqs/:id - Delete FAQ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('support_faqs')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting FAQ:', error);
      return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/support/faqs/:id:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
