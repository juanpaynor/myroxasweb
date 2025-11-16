'use server';

export interface RecommendationState {
  recommendations: string[] | null;
  error: string | null;
  timestamp: number;
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
