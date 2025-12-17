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
  let produk1 = '';
  let produk2 = '';
  
  try {
    const requestBody = await request.json();
    produk1 = requestBody.produk1;
    produk2 = requestBody.produk2;
    
    if (!produk1 || !produk2) {
      return NextResponse.json({ error: 'Both produk1 and produk2 are required' }, { status: 400 });
    }

    console.log("Checking product combination:", produk1, "and", produk2);

    try {
      console.log('Initializing Google AI client...');
      console.log('API Key present:', !!process.env.GOOGLE_AI_API_KEY);
      console.log('Google AI client initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize Google AI client:', error);
      console.error('Error details:', error?.message || 'Unknown error');
      return NextResponse.json({ error: 'Failed to initialize AI client' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });

    const prompt = `Sebagai ahli farmakologi dan interaksi obat, analisis keamanan kombinasi antara "${produk1}" dan "${produk2}" dengan penelusuran medis yang komprehensif.

LAKUKAN PENELUSURAN MEDIS BERIKUT:
1. Cari: "drug interaction ${produk1} ${produk2}"
2. Cari: "kontraindikasi ${produk1} ${produk2}"
3. Cari: "side effects ${produk1} ${produk2} together"
4. Cari: "can i take ${produk1} with ${produk2}"
5. Cari: "food drug interaction ${produk1} ${produk2}"
6. Cari: "herb drug interaction ${produk1} ${produk2}"
7. Cari: "interaksi obat ${produk1} ${produk2}"

BERDASARKAN EVIDENCE MEDIS, berikan JSON response:
{
  "produk1": "${produk1}",
  "produk2": "${produk2}",
  "status": "aman/berisiko/tidak_direkomendasikan",
  "deskripsi": "• Mekanisme interaksi: penjelasan cara kerja interaksi\n• Dampak klinis: efek pada tubuh pasien\n• Tingkat keparahan: seberapa serius interaksi ini\n• Waktu onset: kapan interaksi mulai terasa\n• Jarak waktu: berapa lama efek interaksi bertahan",
  "hasil": {
    "efekSamping": ["Efek samping spesifik yang mungkin terjadi", "Interaksi yang mengurangi efektivitas", "Efek toksisitas tambahan"],
    "anjuran": ["Waktu konsumsi yang disarankan", "Dosis yang perlu disesuaikan", "Pantauan parameter yang diperlukan", "Kapan harus konsultasi dokter"]
  },
  "sources": ["https://sumber1.com", "https://sumber2.com"]
}

PENTING:
- Status harus salah satu: "aman", "berisiko", atau "tidak_direkomendasikan"
- Gunakan hanya informasi dari sumber medis/health yang terpercaya
- Jika tidak ada informasi spesifik, berikan analisis berdasarkan prinsip farmakologi umum
- Untuk Deskripsi, pastikan penulisannya tersusun rapih
- Pastikan semua URL sources valid dan dapat diakses
- JANGAN membuat informasi yang tidak berdasarkan fakta medis`;

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
        
        const combinationData = JSON.parse(cleanedText);
        console.log("Parsed combination data:", combinationData);
        
        // Validate required fields
        if (!combinationData.produk1) {
          combinationData.produk1 = produk1;
        }
        
        if (!combinationData.produk2) {
          combinationData.produk2 = produk2;
        }

        // Ensure status is valid
        const validStatuses = ["aman", "berisiko", "tidak_direkomendasikan"];
        if (!validStatuses.includes(combinationData.status)) {
          combinationData.status = "berisiko"; // Default to risky if invalid
        }

        // Ensure sources field exists
        if (!combinationData.sources) {
          combinationData.sources = ["https://www.google.com/search?q=" + encodeURIComponent(`${produk1} ${produk2} interaksi`)];
        }

        // Ensure hasil object exists
        if (!combinationData.hasil) {
          combinationData.hasil = {
            efekSamping: [],
            anjuran: []
          };
        }

        // Ensure efekSamping and anjuran arrays exist
        if (!combinationData.hasil.efekSamping) {
          combinationData.hasil.efekSamping = [];
        }
        
        if (!combinationData.hasil.anjuran) {
          combinationData.hasil.anjuran = [];
        }
        
        return NextResponse.json(combinationData);
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
    return NextResponse.json({ error: 'Failed to analyze product combination' }, { status: 500 });
  }
}
