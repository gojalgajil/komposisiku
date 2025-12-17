import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Check if API key is present
if (!process.env.GOOGLE_AI_API_KEY) {
  console.error('GOOGLE_AI_API_KEY is not set in environment variables');
  throw new Error('Server configuration error: Missing API key');
}

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export async function POST(request: Request) {
  let productName = '';
  
  try {
    const requestBody = await request.json();
    productName = requestBody.productName;
    
    if (!productName) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    console.log("Searching alternatives for:", productName);

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });

    const prompt = `Sebagai ahli farmasi dan produk kesehatan, cari alternatif produk untuk "${productName}" dengan penelusuran pasar yang komprehensif.

LAKUKAN PENELUSURAN BERIKUT:
1. Cari: "alternatif ${productName}"
2. Cari: "pengganti ${productName} yang murah"
3. Cari: "produk serupa dengan ${productName}"
4. Cari: "kompetitor ${productName}"
5. Cari: "generik ${productName}"
6. Cari: "substitusi ${productName}"

BERDASARKAN HASIL PENELUSURAN, berikan JSON response:
{
  "originalProduct": "${productName}",
  "alternatives": [
    {
      "nama": "Nama alternatif 1",
      "merek": "Merek produk",
      "kategori": "Kategori produk",
      "keunggulan": "Keunggulan utama dibandingkan original",
      "keterbatasan": "Keterbatasan atau kekurangan",
      "harga": "murah/sedang/mahal"
    }
  ],
  "saran": [
    "Saran 1 untuk pemilihan alternatif",
    "Saran 2 untuk pertimbangan harga",
    "Saran 3 untuk efektivitas"
  ],
  "sources": ["https://sumber1.com", "https://sumber2.com"]
}

KRITERIA ALTERNATIF:
- Fungsi serupa dengan produk original
- Tersedia di pasaran Indonesia
- Harga bervariasi (murah/sedang/mahal)
- Kandungan aktif yang sejenis
- Legal dan terdaftar di BPOM

PENTING:
- Cari minimal 3-5 alternatif yang berbeda
- Berikan informasi harga relatif yang akurat
- Sertakan merek yang populer dan mudah ditemukan
- Prioritaskan produk dengan nilai terbaik
- Pastikan semua sources valid dan dapat diakses
- JANGAN membuat produk yang tidak ada di pasaran`;

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
        
        if (geminiText.includes('```')) {
          const jsonMatch = geminiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            cleanedText = jsonMatch[1];
          }
        }

        console.log("Cleaned Gemini response:", cleanedText);
        
        const alternativesData = JSON.parse(cleanedText);
        console.log("Parsed alternatives data:", alternativesData);
        
        // Validate required fields
        if (!alternativesData.originalProduct) {
          alternativesData.originalProduct = productName;
        }

        // Ensure alternatives array exists
        if (!alternativesData.alternatives) {
          alternativesData.alternatives = [];
        }

        // Ensure saran array exists
        if (!alternativesData.saran) {
          alternativesData.saran = [];
        }

        // Ensure sources field exists
        if (!alternativesData.sources) {
          alternativesData.sources = ["https://www.google.com/search?q=" + encodeURIComponent(`alternatif ${productName}`)];
        }
        
        return NextResponse.json(alternativesData);
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
    return NextResponse.json({ error: 'Failed to search alternatives' }, { status: 500 });
  }
}
