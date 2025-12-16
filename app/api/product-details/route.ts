import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

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
    const results: Array<{name: string, nomorBPOM: string, merk: string}> = [];
    
    $('.product-item').each((i, element) => {
      const name = $(element).find('.product-name').text().trim();
      const nomorBPOM = $(element).find('.bpom-number').text().trim();
      const merk = $(element).find('.brand').text().trim();
      
      if (name) {
        results.push({ name, nomorBPOM, merk });
      }
    });
    
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

    console.log("Scraping real data for:", productName);
    
    // Web scraping for BPOM data
    const bpomData = await scrapeBPOM(productName);
    console.log("BPOM data found:", bpomData);
    
    // Web scraping for ingredient data
    const ingredientData = await scrapeIngredients(productName);
    console.log("Ingredient data found:", ingredientData);
    
    // Use Groq to process real scraped data
    const groqResponse = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `Berdasarkan data REAL dari web scraping berikut, buat informasi detail produk "${productName}":

Data BPOM: ${JSON.stringify(bpomData, null, 2)}
Data Ingredient: ${JSON.stringify(ingredientData, null, 2)}

Format JSON:
{
  "namaProduk": "${productName}",
  "merk": "Extract the brand/merk from the product name. For 'COSRX BHA Blackhead Power Liquid', merk should be 'COSRX'. For 'Tolak Angin Batuk', merk should be 'Tolak Angin'.",
  "noBPOM": "Nomor BPOM dari data scraping atau 'Produk belum terdaftar di BPOM'",
  "komposisi": [
    {"nama": "Nama Bahan 1", "fungsi": "Fungsi Bahan 1"},
    {"nama": "Nama Bahan 2", "fungsi": "Fungsi Bahan 2"}
  ],
  "anjuran": ["Anjuran penggunaan 1", "Anjuran penggunaan 2"],
  "larangan": ["Larangan 1", "Larangan 2"],
  "sumber": [
    "https://cekbpom.pom.go.id/",
    "https://incidecoder.com/",
    "https://www.paulaschoice.com/shop-ingredient"
  ]
}

PENTING:
1. Extract merk secara cerdas dari nama produk. Untuk "COSRX BHA Blackhead Power Liquid", merk adalah "COSRX"
2. Gunakan data BPOM yang benar dari web scraping
3. Jika tidak ada data BPOM, tulis 'Produk belum terdaftar di BPOM'
4. Gunakan SEMUA ingredients yang ditemukan dari web scraping
5. JANGAN gunakan nama sumber seperti "Paula's Choice" sebagai merk
6. Jangan membuat data palsu!`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const groqText = groqResponse.choices[0]?.message?.content;
    console.log("Groq response:", groqText);
    
    if (!groqText) {
      return NextResponse.json({ error: 'No response from Groq' }, { status: 500 });
    }
    
    try {
      const groqData = JSON.parse(groqText);
      console.log("Parsed Groq data:", groqData);
      return NextResponse.json(groqData);
    } catch (parseError) {
      console.error("Failed to parse Groq response:", parseError);
      console.error("Raw response:", groqText);
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 });
    }
    
  } catch (error) {
    console.error("API Error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Failed to get product details' }, { status: 500 });
  }
}
