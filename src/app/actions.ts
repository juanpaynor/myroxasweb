'use server';

import { recommendService, type RecommendServiceOutput } from '@/ai/flows/service-recommendation';

export interface RecommendationState {
  recommendations: string[] | null;
  error: string | null;
  timestamp: number;
}

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
    const result: RecommendServiceOutput = await recommendService({ description });
    if (!result.serviceRecommendations || result.serviceRecommendations.length === 0) {
        return {
            recommendations: ["We couldn't find a specific service for your request. Please try rephrasing, or contact city support directly."],
            error: null,
            timestamp: Date.now(),
        }
    }
    return {
      recommendations: result.serviceRecommendations,
      error: null,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error getting service recommendation:', error);
    return {
      recommendations: null,
      error: 'An AI-related error occurred. Please try again later.',
      timestamp: Date.now(),
    };
  }
}
