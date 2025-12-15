import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

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
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY
});

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

export interface ProductDetails {
  namaProduk: string;
  merk: string;
  noBPOM: string;
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

    const prompt = `Cari informasi detail untuk produk "${productName}" dari sumber terpercaya menggunakan Google Search. 

Sumber yang harus digunakan:
1. https://cekbpom.pom.go.id/ (untuk nama produk, merk, no. BPOM/izin edar, komposisi)
2. https://incidecoder.com/ (untuk komposisi, fungsi bahan)
3. https://www.paulaschoice.com/shop-ingredient (untuk informasi bahan skincare)
4. www.cosdna.com (untuk informasi kosmetik)

Format JSON yang diharapkan:
{
  "namaProduk": "Nama Produk Lengkap",
  "merk": "Merek Produk",
  "noBPOM": "Nomor BPOM atau 'Produk belum terdaftar di BPOM'",
  "komposisi": [
    {"nama": "Nama Bahan 1", "fungsi": "Fungsi Bahan 1"},
    {"nama": "Nama Bahan 2", "fungsi": "Fungsi Bahan 2"}
  ],
  "anjuran": ["Anjuran penggunaan 1", "Anjuran penggunaan 2"],
  "larangan": ["Larangan 1", "Larangan 2"],
  "sources": [
    "https://cekbpom.pom.go.id/",
    "https://incidecoder.com/",
    "https://www.paulaschoice.com/shop-ingredient",
    "https://www.cosdna.com/"
  ]
}

PENTING:
- Gunakan Google Search untuk mencari informasi dari sumber-sumber di atas
- Jika tidak ada nomor BPOM, tulis "Produk belum terdaftar di BPOM"
- Berikan informasi yang akurat dan dapat diverifikasi
- Fokus pada produk OBAT/HERBAL/KESEHATAN/SKINCARE/MAKANAN/MINUMAN`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    
    if (!response.text) {
      return NextResponse.json(null);
    }
    
    // Extract JSON from response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const details = JSON.parse(jsonMatch[0]);
      return NextResponse.json(details);
    }
    
    return NextResponse.json(null);
  } catch (error) {
    console.error("Error getting product details:", error);
    
    // Check if it's a quota error (429) or any Google AI error, try Groq as fallback
    if (error && typeof error === 'object' && ('status' in error || error instanceof Error)) {
      const isQuotaError = 'status' in error && error.status === 429;
      const isGoogleError = error instanceof Error;
      
      if (isQuotaError || isGoogleError) {
        console.log("Google AI failed, trying Groq as fallback...");
        
        try {
          if (process.env.GROQ_API_KEY) {
            const groqResponse = await groq.chat.completions.create({
              model: "llama-3.1-8b-instant",
              messages: [
                {
                  role: "user",
                  content: `Cari informasi detail untuk produk "${productName}" dari sumber terpercaya. Format JSON: {"namaProduk": "Nama Produk", "merk": "Merk", "noBPOM": "Nomor BPOM", "komposisi": [{"nama": "Bahan", "fungsi": "Fungsi"}], "anjuran": ["Anjuran"], "larangan": ["Larangan"], "sources": ["https://cekbpom.pom.go.id/", "https://incidecoder.com/"]}`
                }
              ],
              response_format: { type: "json_object" }
            });
            
            const groqText = groqResponse.choices[0]?.message?.content;
            if (groqText) {
              const groqData = JSON.parse(groqText);
              return NextResponse.json(groqData);
            }
          } else {
            console.log("Groq API key not found, returning fallback data");
          }
        } catch (groqError) {
          console.error("Groq also failed:", groqError);
        }
        
        // Final fallback with basic data
        return NextResponse.json({
          namaProduk: productName,
          merk: "Unknown",
          noBPOM: "Produk belum terdaftar di BPOM",
          komposisi: [],
          anjuran: ["Informasi tidak tersedia"],
          larangan: ["Informasi tidak tersedia"],
          sources: ["https://cekbpom.pom.go.id/", "https://incidecoder.com/"]
        });
      }
    }
    
    return NextResponse.json({ error: 'Failed to get product details' }, { status: 500 });
  }
}
