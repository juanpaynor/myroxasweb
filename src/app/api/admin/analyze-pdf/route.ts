import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
// @ts-ignore - pdf-parse doesn't have type definitions
import pdf from 'pdf-parse/lib/pdf-parse.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if file is PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF
    const data = await pdf(buffer);
    const extractedText = data.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF' },
        { status: 400 }
      );
    }

    // Analyze with Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Analyze the following document and generate comprehensive FAQ entries. 
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

Generate 5-10 high-quality FAQ entries based on the most important information in the document.

Document content:
${extractedText.slice(0, 30000)} // Limit to ~30k chars to stay within token limits
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
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
      extractedText: extractedText.slice(0, 1000) // Return first 1000 chars as preview
    });

  } catch (error) {
    console.error('Error analyzing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to analyze PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
