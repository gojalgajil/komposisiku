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
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Max size is 10MB' }, { status: 400 });
    }

    // Check file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an image' }, { status: 400 });
    }

    console.log("Analyzing image:", image.name, "Size:", image.size, "Type:", image.type);

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');

    // Use Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    });

    const prompt = `Analisis gambar produk ini dan identifikasi nama produknya.

LAKUKAN ANALISIS GAMBAR:
1. Perhatikan kemasan, label, dan tulisan pada produk
2. Identifikasi nama merek dan nama produk yang tertera
3. Perhatikan bentuk kemasan (botol, sachet, tube, dll)
4. Baca teks yang terlihat jelas pada kemasan

BERDASARKAN ANALISIS GAMBAR, berikan JSON response dengan format yang SAMA dengan product-details API:
{
  "namaProduk": "Nama produk yang teridentifikasi dari gambar",
  "komposisi": [
    {"nama": "Nama Bahan 1", "fungsi": "Fungsi Bahan 1"},
    {"nama": "Nama Bahan 2", "fungsi": "Fungsi Bahan 2"}
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
- Pastikan semua URL bisa diakses langsung

PENTING:
- Jika produk tidak dapat diidentifikasi, gunakan "Produk tidak dapat diidentifikasi" sebagai namaProduk
- Isi semua field sesuai format product-details API
- Jangan membuat nama produk rekayasa`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: image.type
          }
        }
      ]);

      const responseText = result.response.text();
      console.log("Gemini Vision response:", responseText);

      if (!responseText) {
        return NextResponse.json({ message: 'No response from Gemini' }, { status: 500 });
      }

      try {
        // Clean up the response text - extract JSON if it's wrapped in code blocks
        let cleanedText = responseText;
        
        if (responseText.includes('```')) {
          const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            cleanedText = jsonMatch[1];
          }
        }

        console.log("Cleaned Gemini response:", cleanedText);
        
        const analysisResult = JSON.parse(cleanedText);
        console.log("Parsed analysis result:", analysisResult);
        
        // Validate required fields
        if (!analysisResult.namaProduk) {
          analysisResult.namaProduk = "Produk tidak dapat diidentifikasi";
        }
        
        // Ensure sources field exists
        if (!analysisResult.sources) {
          analysisResult.sources = ["Sumber referensi produk tidak tersedia"];
        }
        
        return NextResponse.json(analysisResult);

      } catch (parseError) {
        console.error("Failed to parse Gemini response:", parseError);
        console.error("Raw response:", responseText);
        return NextResponse.json({ 
          message: 'Failed to parse response',
          rawResponse: responseText 
        }, { status: 500 });
      }

    } catch (error: any) {
      console.error("Gemini API Error:", error);

      if (error?.status === 429 || error?.code === 429) {
        return NextResponse.json(
          { message: "Gemini sedang penuh, coba lagi dalam beberapa saat" },
          { status: 429 }
        );
      }

      if (error?.status === 503 || error?.code === 503) {
        return NextResponse.json(
          { message: "Gemini sedang penuh, coba lagi dalam beberapa saat" },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { message: "Terjadi kesalahan server" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Image analysis error:", error);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
