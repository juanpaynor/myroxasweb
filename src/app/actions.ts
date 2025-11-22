'use server';

import { createClient } from '@supabase/supabase-js';

export interface RecommendationState {
  recommendations: string[] | null;
  error: string | null;
  timestamp: number;
}

// Server action to create user with admin privileges (doesn't affect current session)
export async function createUserServerAction(
  email: string,
  password: string,
  fullName: string,
  role: string
) {
  // Access environment variables at runtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Debug logging
  console.log('Environment check:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseServiceKey?.length
  });

  if (!supabaseUrl || !supabaseServiceKey) {
    return { error: `Server configuration error - missing ${!supabaseUrl ? 'URL' : 'service key'}` };
  }

  // Create admin client with service role key
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Create auth user using admin API (won't affect current session)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: role
      }
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'Failed to create user' };
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        role,
        full_name: fullName,
      });

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { error: profileError.message };
    }

    return { success: true, userId: authData.user.id };
  } catch (err: any) {
    return { error: err.message || 'Failed to create user' };
  }
}

// Mock service recommendations based on keywords
const getServiceRecommendations = (description: string): string[] => {
  const desc = description.toLowerCase();
  
  // Basic keyword matching for common city services
  if (desc.includes('pothole') || desc.includes('road') || desc.includes('street')) {
    return [
      'Public Works Department - Road Maintenance',
      'City Engineering Office - Infrastructure Repairs',
      'Traffic Management Office - Road Safety'
    ];
  }
  
  if (desc.includes('water') || desc.includes('pipe') || desc.includes('leak')) {
    return [
      'Water District - Water Supply Services',
      'Public Works - Pipe Maintenance',
      'Emergency Services - Water Issues'
    ];
  }
  
  if (desc.includes('garbage') || desc.includes('trash') || desc.includes('waste')) {
    return [
      'Waste Management Office - Garbage Collection',
      'Environmental Services - Waste Disposal',
      'Sanitation Department - Clean-up Services'
    ];
  }
  
  if (desc.includes('permit') || desc.includes('license') || desc.includes('document')) {
    return [
      'Business Permits Office - Licensing Services',
      'Civil Registry - Document Services',
      'City Hall - General Permits'
    ];
  }
  
  if (desc.includes('health') || desc.includes('medical') || desc.includes('hospital')) {
    return [
      'City Health Office - Public Health Services',
      'Roxas City Hospital - Medical Services',
      'Rural Health Units - Community Health'
    ];
  }
  
  // Default recommendations
  return [
    'City Hall Information Desk - General Inquiries',
    'Mayor\'s Office - Public Concerns',
    'Public Affairs Office - Citizen Services'
  ];
};

export async function getServiceRecommendation(
  prevState: RecommendationState,
  formData: FormData
): Promise<RecommendationState> {
  const description = formData.get('description') as string;

  if (!description || description.trim().length < 10) {
    return {
      recommendations: null,
      error: 'Please enter a more detailed description (at least 10 characters).',
      timestamp: Date.now(),
    };
  }

  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const recommendations = getServiceRecommendations(description);
    
    return {
      recommendations,
      error: null,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error getting service recommendation:', error);
    return {
      recommendations: null,
      error: 'An error occurred. Please try again later.',
      timestamp: Date.now(),
    };
  }
}
