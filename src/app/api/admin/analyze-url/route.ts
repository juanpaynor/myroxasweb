import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyRoxas-Bot/1.0)'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    
    // Simple HTML stripping (extract text content)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!textContent || textContent.length < 100) {
      return NextResponse.json(
        { error: 'Could not extract meaningful content from URL' },
        { status: 400 }
      );
    }

    // Analyze with Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const prompt = `Analyze the following webpage content and generate comprehensive FAQ entries. 
For each FAQ entry, provide:
1. A clear, concise question
2. A detailed, helpful answer
3. Relevant keywords (comma-separated)
4. Suggested category (one of: general, technical, billing, account, service)

Format your response as a JSON array with this structure:
[
  {
    "question": "Question text here?",
    "answer": "Detailed answer here.",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "category": "general"
  }
]

Generate 5-10 high-quality FAQ entries based on the most important information in the webpage.

Webpage URL: ${url}

Webpage content:
${textContent.slice(0, 30000)} // Limit to ~30k chars to stay within token limits
`;

    const result = await model.generateContent(prompt);
    const aiResponse = await result.response;
    const text = aiResponse.text();
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      jsonText = text.split('```')[1].split('```')[0].trim();
    }
    
    const faqs = JSON.parse(jsonText);

    return NextResponse.json({
      success: true,
      faqs,
      url,
      extractedText: textContent.slice(0, 1000) // Return first 1000 chars as preview
    });

  } catch (error) {
    console.error('Error analyzing URL:', error);
    return NextResponse.json(
      { error: 'Failed to analyze URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
