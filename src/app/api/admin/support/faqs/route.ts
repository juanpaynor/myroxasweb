import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/admin/support/faqs - Get all FAQs with optional filters
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('support_faqs')
      .select('*')
      .order('category', { ascending: true })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }

    if (search) {
      query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);
    }

    const { data: faqs, error } = await query;

    if (error) {
      console.error('Error fetching FAQs:', error);
      return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
    }

    return NextResponse.json(faqs);
  } catch (error) {
    console.error('Error in GET /api/admin/support/faqs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/support/faqs - Create new FAQ
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const { category, question, answer, keywords, display_order, is_active } = body;

    // Validation
    if (!category || !question || !answer) {
      return NextResponse.json(
        { error: 'Category, question, and answer are required' },
        { status: 400 }
      );
    }

    // Insert FAQ
    const { data: newFaq, error } = await supabase
      .from('support_faqs')
      .insert({
        category,
        question,
        answer,
        keywords: keywords || [],
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating FAQ:', error);
      return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
    }

    return NextResponse.json(newFaq, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/support/faqs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/support/faqs - Bulk update (activate/deactivate)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const { ids, is_active } = body;

    // Validation
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (is_active === undefined) {
      return NextResponse.json(
        { error: 'is_active is required' },
        { status: 400 }
      );
    }

    // Update FAQs
    const { data, error } = await supabase
      .from('support_faqs')
      .update({ is_active, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();

    if (error) {
      console.error('Error bulk updating FAQs:', error);
      return NextResponse.json({ error: 'Failed to update FAQs' }, { status: 500 });
    }

    return NextResponse.json({ updated_count: data?.length || 0, data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/support/faqs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
