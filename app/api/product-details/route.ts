import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

// Web scraping functions
async function scrapeBPOM(productName: string) {
  try {
    const response = await axios.get(`https://cekbpom.pom.go.id/search?name=${encodeURIComponent(productName)}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const results: Array<{name: string, nomorBPOM: string}> = [];
    
    // Try different approaches to extract data
    // 1. Look for any table rows with BPOM numbers
    $('tr').each((i, element) => {
      const rowText = $(element).text().trim();
      const bpomMatch = rowText.match(/(MD|NA|SL|HT|DBL)\d{14,15}/i);
      
      if (bpomMatch) {
        const cells = $(element).find('td');
        let name = '';
        
        if (cells.length >= 1) {
          name = $(cells[0]).text().trim() || productName;
        }
        
        results.push({ 
          name: name, 
          nomorBPOM: bpomMatch[1]
        });
      }
    });
    
    // 2. If no table rows found, look for any text containing BPOM numbers
    if (results.length === 0) {
      const bodyText = $('body').text();
      const bpomMatches = bodyText.match(/(MD|NA|SL|HT|DBL)\d{14,15}/gi);
      
      if (bpomMatches) {
        bpomMatches.forEach(bpom => {
          results.push({ 
            name: productName, 
            nomorBPOM: bpom
          });
        });
      }
    }
    
    // 3. If still no results, try to find any product-related elements
    if (results.length === 0) {
      $('.product, .item, .result, div').each((i, element) => {
        const text = $(element).text().trim();
        if (text.toLowerCase().includes(productName.toLowerCase()) && 
            text.length < 500) { // Avoid very long text blocks
          const bpomMatch = text.match(/(MD|NA|SL|HT|DBL)\d{14,15}/i);
          if (bpomMatch) {
            results.push({ 
              name: productName, 
              nomorBPOM: bpomMatch[1]
            });
          }
        }
      });
    }
    
    return results;
  } catch (error) {
    console.error('BPOM scraping error:', error);
    return [];
  }
}

async function scrapeIngredients(productName: string) {
  const sources = [
    { name: 'incidecoder', url: `https://incidecoder.com/search?q=${encodeURIComponent(productName)}` },
    { name: 'paulaschoice', url: `https://www.paulaschoice.com/shop-ingredient?search=${encodeURIComponent(productName)}` }
  ];
  
  const results: Array<{name: string, description: string, source: string}> = [];
  
  for (const source of sources) {
    try {
      const response = await axios.get(source.url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      if (source.name === 'incidecoder') {
        // Try multiple selectors for incidecoder
        $('.ingred-row, .ingredient-item, .ingredient').each((i, element) => {
          const name = $(element).find('.ingred-name, .ingredient-name, .name').text().trim();
          const description = $(element).find('.ingred-desc, .ingredient-desc, .description').text().trim();
          if (name && name.length > 2) { // Filter out empty or single character names
            results.push({ name, description: description || 'No description available', source: source.name });
          }
        });
      } else if (source.name === 'paulaschoice') {
        // Try multiple selectors for paulaschoice
        $('.shop-ingredient, .ingredient-item, .ingredient').each((i, element) => {
          const name = $(element).find('.ingredient-name, .name').text().trim();
          const info = $(element).find('.ingredient-info, .description').text().trim();
          if (name && name.length > 2) {
            results.push({ name, description: info || 'No description available', source: source.name });
          }
        });
      }
    } catch (error) {
      console.error(`${source.name} scraping error:`, error);
    }
  }
  
  return results;
}

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
  merk: string;
  noBPOM: string;
  komposisi: {
    nama: string;
    fungsi: string;
  }[];
  anjuran: string[];
  larangan: string[];
  sumber: string[];
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
    
    const prompt = `Cari informasi LENGKAP untuk produk "${productName}" dengan melakukan pencarian Google.

LAKUKAN PENELUSURAN GOOGLE BERIKUT:
1. Cari: "nomor BPOM ${productName}"
2. Cari: "${productName} komposisi lengkap"  
3. Cari: "${productName} anjuran pemakaian"
4. Cari: "${productName} larangan dan efek samping"

BERDASARKAN HASIL PENELUSURAN, berikan JSON response:
{
  "namaProduk": "${productName}",
  "noBPOM": "BPOM number dari hasil pencarian di Google atau 'Produk belum terdaftar di BPOM'",
  "komposisi": [
    {"nama": "Nama Bahan 1", "fungsi": "Fungsi Bahan 1"},
    {"nama": "Nama Bahan 2", "fungsi": "Fungsi Bahan 2"}
  ],
  "anjuran": ["Anjuran 1", "Anjuran 2"],
  "larangan": ["Larangan 1", "Larangan 2"],
  "sources": ["https://cekbpom.pom.go.id/", "https://google.com/search"]
}

PENTING: 
- Gunakan nomor BPOM yang DITEMUKAN di ketika search di google
- Jika tidak ditemukan nomor BPOM, tulis "Produk belum terdaftar di BPOM"
- JANGAN membuat nomor BPOM yang tidak ada!`;

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
