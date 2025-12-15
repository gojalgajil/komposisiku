import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

// Debug log environment variables
console.log('Environment variables:', {
  hasGoogleApiKey: !!process.env.GOOGLE_AI_API_KEY,
  hasGroqApiKey: !!process.env.GROQ_API_KEY,
  googleKeyLength: process.env.GOOGLE_AI_API_KEY?.length,
  groqKeyLength: process.env.GROQ_API_KEY?.length,
  nodeEnv: process.env.NODE_ENV,
  allEnvKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE') || key.includes('GROQ') || key.includes('NEXT_'))
});

// Check if API key is present (don't throw during initialization)
if (!process.env.GOOGLE_AI_API_KEY) {
  console.warn('GOOGLE_AI_API_KEY is not set in environment variables');
}

// Initialize the Google AI client only if API key is present
let ai: GoogleGenAI | null = null;
if (process.env.GOOGLE_AI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_AI_API_KEY
  });
}

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Test the API key by creating a simple model instance
try {
  console.log('Initializing Google AI client...');
  console.log('API Key present:', !!process.env.GOOGLE_AI_API_KEY);
  
  // Just verify the client was created successfully
  console.log('Google AI client initialized successfully');
} catch (error: any) {
  console.error('Failed to initialize Google AI client:', error);
  console.error('Error details:', error?.message || 'Unknown error');
  // Don't throw here, let the POST function handle initialization errors
}

export interface ProductRecommendation {
  name: string;
}

export async function POST(request: Request) {
  let searchTerm = '';
  
  try {
    const requestBody = await request.json();
    searchTerm = requestBody.searchTerm;
    
    if (!searchTerm) {
      return NextResponse.json({ error: 'searchTerm is required' }, { status: 400 });
    }

    // Simple test: Only use Groq, no Google AI
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    console.log("Using Groq API...");
    
    const groqResponse = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `Return ONLY a JSON array with 5 Indonesian product recommendations for "${searchTerm}". 

Example:
[{"name": "Madu TJ"}, {"name": "Madu Nusantara"}, {"name": "Madu Kurma"}, {"name": "Madu Super"}, {"name": "Madu Kelapa"}]

IMPORTANT: 
- Return ONLY the JSON array, no other text
- Products must exist in Indonesian market
- Use exact format: [{"name": "product name"}]`
        }
      ],
      response_format: { type: "text" }
    });
    
    const groqText = groqResponse.choices[0]?.message?.content;
    console.log("Groq response:", groqText);
    
    if (!groqText) {
      return NextResponse.json({ error: 'No response from Groq' }, { status: 500 });
    }
    
    try {
      const groqData = JSON.parse(groqText);
      console.log("Parsed Groq data:", groqData);
      
      // Handle different response formats
      let recommendations = [];
      if (Array.isArray(groqData)) {
        recommendations = groqData;
      } else if (groqData.recommendations && Array.isArray(groqData.recommendations)) {
        recommendations = groqData.recommendations;
      } else if (groqData.products && Array.isArray(groqData.products)) {
        recommendations = groqData.products;
      } else if (groqData.items && Array.isArray(groqData.items)) {
        recommendations = groqData.items;
      } else {
        // Try to find any array in the response
        for (const key in groqData) {
          if (Array.isArray(groqData[key])) {
            recommendations = groqData[key];
            break;
          }
        }
      }
      
      if (recommendations.length > 0) {
        console.log("Groq successful, returning:", recommendations);
        return NextResponse.json(recommendations);
      } else {
        console.log("No recommendations found in response. Available keys:", Object.keys(groqData));
        console.log("Full response structure:", JSON.stringify(groqData, null, 2));
        return NextResponse.json({ error: 'No recommendations found' }, { status: 500 });
      }
    } catch (parseError) {
      console.error("Failed to parse Groq response:", parseError);
      console.error("Raw response:", groqText);
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 });
    }
    
  } catch (error) {
    console.error("API Error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 });
  }
}
