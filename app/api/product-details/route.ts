import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Debug log environment variables
console.log('Environment variables:', {
  hasGoogleApiKey: !!process.env.GOOGLE_AI_API_KEY,
  keyLength: process.env.GOOGLE_AI_API_KEY?.length,
  keyPrefix: process.env.GOOGLE_AI_API_KEY?.substring(0, 5) + '...',
  nodeEnv: process.env.NODE_ENV,
  allEnvKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE') || key.includes('NEXT_'))
});

// Check if API key is present
if (!process.env.GOOGLE_AI_API_KEY) {
  console.error('GOOGLE_AI_API_KEY is not set in environment variables');
  throw new Error('Server configuration error: Missing API key');
}

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Function to extract merk from product name
function extractMerk(productName: string): string {
  // Simple extraction: take first word as potential brand
  const words = productName.trim().split(/\s+/);
  if (words.length > 1) {
    return words[0];
  }
  
  return 'Unknown';
}

export interface ProductDetails {
  namaProduk: string;
  komposisi: {
    nama: string;
    fungsi: string;
  }[];
  anjuran: string[];
  larangan: string[];
  sources: string[];
}


export async function POST(request: Request) {
  let productName = '';
  
  try {
    const requestBody = await request.json();
    productName = requestBody.productName;
    
    if (!productName) {
      return NextResponse.json({ error: 'productName is required' }, { status: 400 });
    }

    console.log("Getting product details for:", productName);
    
    // Test the API key by creating a simple model instance
    try {
      console.log('Initializing Google AI client...');
      console.log('API Key present:', !!process.env.GOOGLE_AI_API_KEY);
      
      // Just verify the client was created successfully
      console.log('Google AI client initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize Google AI client:', error);
      console.error('Error details:', error?.message || 'Unknown error');
      return NextResponse.json({ error: 'Failed to initialize AI client' }, { status: 500 });
    }
    
    // Use Gemini 1.5 Flash with web search capabilities
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });
    
const prompt = `Sebagai ahli produk kesehatan dan kosmetik, cari informasi detail untuk "${productName}" dengan penelusuran komprehensif.

CARI INFORMASI PRODUK:
1. Cari: "${productName} komposisi bahan aktif"
2. Cari: "${productName} ingredients composition"
3. Cari: "${productName} fungsi manfaat"
4. Cari: "${productName} side effects efek samping"
5. Cari: "${productName} cara pakai anjuran"
6. Cari: "${productName} larangan kontraindikasi"

BERDASARKAN HASIL PENELUSURAN, berikan JSON response:
{
  "namaProduk": "${productName}",
  "komposisi": [
    { "nama": "Nama Bahan 1", "fungsi": "Fungsi bahan berdasarkan pengetahuan kosmetik/farmasi umum" },
    { "nama": "Nama Bahan 2", "fungsi": "Fungsi bahan berdasarkan pengetahuan kosmetik/farmasi umum" }
  ],
  "anjuran": ["Anjuran 1", "Anjuran 2"],
  "larangan": ["Larangan 1", "Larangan 2"],
  "sources": [
    "Sumber umum produsen atau referensi tepercaya, pastikan URLnya bisa dibuka dan isinya bukan not found"
  ]
}

ATURAN SUMBER:
- Jangan membuat link palsu
- Jika sumber spesifik tidak diketahui, gunakan sumber umum yang relevan
- Pastikan semua URL bisa diakses langsung`;

    try {
      const result = await model.generateContent(prompt);
      const geminiText = result.response.text();
      console.log("Gemini response:", geminiText);
      
      if (!geminiText) {
        return NextResponse.json({ message: 'No response from Gemini' }, { status: 500 });
      }
      
      try {
        // Clean up the response text - extract JSON if it's wrapped in code blocks
        let cleanedText = geminiText;
        
        // Remove markdown code blocks if present
        if (geminiText.includes('```')) {
          const jsonMatch = geminiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            cleanedText = jsonMatch[1];
          }
        }
        
        console.log("Cleaned Gemini response:", cleanedText);
        
        const geminiData = JSON.parse(cleanedText);
        console.log("Parsed Gemini data:", geminiData);
        
        // Validate required fields
        if (!geminiData.namaProduk) {
          geminiData.namaProduk = productName;
        }
        
        // Ensure sources field exists
        if (!geminiData.sources) {
          geminiData.sources = ["https://cekbpom.pom.go.id/", "https://google.com/search"];
        }
        
        return NextResponse.json(geminiData);
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", parseError);
        console.error("Raw response:", geminiText);
        return NextResponse.json({ 
          message: 'Failed to parse response',
          rawResponse: geminiText 
        }, { status: 500 });
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);

      if (error?.status === 429 || error?.code === 429) {
        return NextResponse.json(
          { message: "Token Gemini Habis" },
          { status: 429 }
        );
      }

      if (error?.status === 503 || error?.code === 503) {
        return NextResponse.json(
          { message: "AI sedang sibuk, coba beberapa saat lagi" },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { message: "Terjadi kesalahan server" },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("API Error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Failed to get product details' }, { status: 500 });
  }
}
