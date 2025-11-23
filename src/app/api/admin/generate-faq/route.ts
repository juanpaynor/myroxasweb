import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { prompt, url, tone = 'professional' } = await request.json();

    if (!prompt && !url) {
      return NextResponse.json(
        { error: 'Either prompt or url is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let fullPrompt = '';

    if (url) {
      // Generate FAQs from URL
      fullPrompt = `You are an expert FAQ writer for Roxas City government services. 
      
Read and analyze the content from this website: ${url}

Based on the information you find, generate 5-10 frequently asked questions and detailed answers.

Requirements:
- Questions should be clear and commonly asked by citizens
- Answers should be accurate, helpful, and ${tone}
- Include specific details from the website content
- Focus on actionable information
- Format each FAQ as a JSON object

Return ONLY a valid JSON array with this structure:
[
  {
    "question": "Clear, specific question?",
    "answer": "Detailed, helpful answer with specific information from the website."
  }
]

Important: Return ONLY the JSON array, no markdown formatting, no explanations.`;
    } else {
      // Generate FAQs from prompt
      fullPrompt = `You are an expert FAQ writer for Roxas City government services.

Topic or question: ${prompt}

Generate 3-5 frequently asked questions and detailed answers about this topic.

Requirements:
- Questions should be clear and commonly asked by citizens
- Answers should be accurate, helpful, and ${tone}
- Include practical information and steps when applicable
- Make answers relevant to Roxas City context
- Format each FAQ as a JSON object

Return ONLY a valid JSON array with this structure:
[
  {
    "question": "Clear, specific question?",
    "answer": "Detailed, helpful answer."
  }
]

Important: Return ONLY the JSON array, no markdown formatting, no explanations.`;
    }

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the response as JSON
    let faqs;
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      faqs = JSON.parse(cleanText);
      
      // Validate structure
      if (!Array.isArray(faqs)) {
        throw new Error('Response is not an array');
      }
      
      // Validate each FAQ has question and answer
      for (const faq of faqs) {
        if (!faq.question || !faq.answer) {
          throw new Error('Invalid FAQ structure');
        }
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ faqs });
  } catch (error: any) {
    console.error('Generate FAQ error:', error);
    
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please check API key.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate FAQs' },
      { status: 500 }
    );
  }
}
