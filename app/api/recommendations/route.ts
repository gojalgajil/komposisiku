import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Web scraping function for real product recommendations
async function scrapeRealProducts(searchTerm: string) {
  try {
    console.log("Attempting to scrape incidecoder.com for:", searchTerm);
    const response = await axios.get(`https://incidecoder.com/search?q=${encodeURIComponent(searchTerm)}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const results: Array<{name: string}> = [];
    
    // Try multiple selectors for product names
    $('.search-result-item .product-name, .product-item .name, .search-item .title').each((i, element) => {
      const productName = $(element).text().trim();
      if (productName && results.length < 5) {
        results.push({ name: productName });
      }
    });
    
    console.log("Found products from incidecoder:", results);
    return results;
  } catch (error) {
    console.error('Incidecoder scraping error:', error);
    
    // Try BPOM as fallback
    try {
      console.log("Attempting to scrape BPOM as fallback for:", searchTerm);
      const bpomResponse = await axios.get(`https://cekbpom.pom.go.id/search?name=${encodeURIComponent(searchTerm)}`, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $bpom = cheerio.load(bpomResponse.data);
      const results: Array<{name: string}> = [];
      
      $bpom('.product-item .product-name, .result-item .name').each((i, element) => {
        const productName = $bpom(element).text().trim();
        if (productName && results.length < 5) {
          results.push({ name: productName });
        }
      });
      
      console.log("Found products from BPOM:", results);
      return results;
    } catch (bpomError) {
      console.error('BPOM scraping error:', bpomError);
      return [];
    }
  }
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

    console.log("Scraping real products for:", searchTerm);
    
    // Scrape real products from incidecoder.com and BPOM
    const realProducts = await scrapeRealProducts(searchTerm);
    
    if (realProducts.length > 0) {
      console.log("Found real products:", realProducts);
      return NextResponse.json(realProducts);
    }
    
    // If no real products found, use Groq for fallback but with strict real product constraint
    console.log("No real products found, using Groq fallback...");
    
    try {
      const groqResponse = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: `Return ONLY a JSON array with 5 REAL Indonesian products that actually exist for "${searchTerm}". 

CRITICAL: Only products that are actually sold in Indonesia. NO fake products.
Examples for "Tolak Angin": ["Tolak Angin", "Tolak Angin Flu", "Tolak Angin Batuk", "Tolak Angin Madu", "Tolak Angin Sirih"]
Examples for "Madu": ["Madu TJ", "Madu Nusantara", "Madu Kurma", "Madu Super", "Madu Kelapa"]

Format: [{"name": "Real Product Name 1"}, {"name": "Real Product Name 2"}, {"name": "Real Product Name 3"}, {"name": "Real Product Name 4"}, {"name": "Real Product Name 5"}]

IMPORTANT: Only existing Indonesian products, no variations that don't exist! Return ONLY the JSON array, no other text.`
          }
        ],
        response_format: { type: "text" }
      });
      
      const groqText = groqResponse.choices[0]?.message?.content;
      console.log("Groq response:", groqText);
      
      if (!groqText) {
        console.log("No response from Groq, returning empty array");
        return NextResponse.json([]);
      }
      
      try {
        const groqData = JSON.parse(groqText);
        console.log("Parsed Groq data:", groqData);
        
        if (Array.isArray(groqData) && groqData.length > 0) {
          return NextResponse.json(groqData);
        } else {
          console.log("Invalid Groq response format, returning empty array");
          return NextResponse.json([]);
        }
      } catch (parseError) {
        console.error("Failed to parse Groq response:", parseError);
        console.error("Raw response:", groqText);
        return NextResponse.json([]);
      }
    } catch (groqError) {
      console.error("Groq API error:", groqError);
      return NextResponse.json([]);
    }
    
  } catch (error) {
    console.error("API Error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 });
  }
}
