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
  let produk3 = '';
  let produk4 = '';
  
  try {
    const requestBody = await request.json();
    produk1 = requestBody.produk1;
    produk2 = requestBody.produk2;
    produk3 = requestBody.produk3 || '';
    produk4 = requestBody.produk4 || '';
    
    if (!produk1 || !produk2) {
      return NextResponse.json({ error: 'produk1 and produk2 are required' }, { status: 400 });
    }

    console.log("Checking product combination:", produk1, produk2, produk3, produk4);

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

    const produkList = [produk1, produk2, produk3, produk4].filter(p => p.trim() !== '');
    const produkListString = produkList.map((p, i) => `"${p}"`).join(', ');
    
    const prompt = `Sebagai ahli farmakologi dan interaksi obat, analisis keamanan kombinasi antara ${produkListString} dengan penelusuran medis yang komprehensif.

TENTUKAN URUTAN PEMAKAIAN YANG OPTIMAL berdasarkan:
- Waktu absorbsi obat (fasting/post-meal)
- Potensi interaksi makanan
- Stabilitas kandungan
- Efektivitas maksimal

LAKUKAN PENELUSURAN MEDIS BERIKUT:
${produkList.map((produk, i) => produkList.map((otherProduk, j) => i !== j ? `${i+1}. Cari: "drug interaction ${produk} ${otherProduk}"` : '').filter(s => s).join('\n')).join('\n')}
${produkList.map((produk, i) => produkList.map((otherProduk, j) => i !== j ? `${i+1}. Cari: "kontraindikasi ${produk} ${otherProduk}"` : '').filter(s => s).join('\n')).join('\n')}
${produkList.map((produk, i) => produkList.map((otherProduk, j) => i !== j ? `${i+1}. Cari: "side effects ${produk} ${otherProduk} together"` : '').filter(s => s).join('\n')).join('\n')}
${produkList.map((produk, i) => produkList.map((otherProduk, j) => i !== j ? `${i+1}. Cari: "can i take ${produk} with ${otherProduk}"` : '').filter(s => s).join('\n')).join('\n')}
${produkList.map((produk, i) => produkList.map((otherProduk, j) => i !== j ? `${i+1}. Cari: "food drug interaction ${produk} ${otherProduk}"` : '').filter(s => s).join('\n')).join('\n')}
${produkList.map((produk, i) => produkList.map((otherProduk, j) => i !== j ? `${i+1}. Cari: "herb drug interaction ${produk} ${otherProduk}"` : '').filter(s => s).join('\n')).join('\n')}
${produkList.map((produk, i) => produkList.map((otherProduk, j) => i !== j ? `${i+1}. Cari: "interaksi obat ${produk} ${otherProduk}"` : '').filter(s => s).join('\n')).join('\n')}

BERDASARKAN EVIDENCE MEDIS, berikan JSON response:
{
  "produk": [${produkList.map(p => `"${p}"`).join(', ')}],
  "urutanOptimal": [${produkList.map((_, i) => i + 1).join(', ')}],
  "status": "aman/berisiko/tidak_direkomendasikan",
  "deskripsi": "• Mekanisme interaksi: Jelaskan interaksi antar produk secara spesifik, contoh: '(point) Panadol Extra + Saridon Extra: Interaksi utama dan paling berbahaya adalah tumpang tindih kandungan Paracetamol dan Kafein. Mengonsumsi keduanya bersamaan atau berdekatan secara signifikan meningkatkan risiko overdosis Paracetamal...'\n• Dampak klinis: Jelaskan efek pada tubuh pasien secara detail\n• Tingkat keparahan: Seberapa serius interaksi ini\n• Waktu onset: Kapan interaksi mulai terasa\n• Jarak waktu: Jelaskan urutan pemakaian optimal, contoh: '(point) Produk B dulu, 3-4 jam kemudian Produk D, dst..'",
  "hasil": {
    "efekSamping": ["Efek samping spesifik yang mungkin terjadi", "Interaksi yang mengurangi efektivitas", "Efek toksisitas tambahan"],
    "anjuran": ["Waktu konsumsi yang disarankan", "Dosis yang perlu disesuaikan", "Pantauan parameter yang diperlukan", "Kapan harus konsultasi dokter"]
  },
  "sources": ["https://sumber1.com", "https://sumber2.com"]
}

PENTING:
- Status harus salah satu: "aman", "berisiko", atau "tidak_direkomendasikan"
- urutanOptimal adalah array index produk (0-based) dalam urutan pemakaian yang direkomendasikan
- Untuk Deskripsi, berikan penjelasan yang deskriptif dan detail untuk setiap bagian, bukan hanya label
- Pada bagian "Mekanisme interaksi", jelaskan interaksi spesifik antar produk yang relevan menggunakan format "(point)"
- Pada bagian "Jarak waktu", sertakan informasi urutan pemakaian optimal dengan contoh format yang jelas menggunakan "(point)"
- Gunakan hanya informasi dari sumber medis/health yang terpercaya
- Jika tidak ada informasi spesifik, berikan analisis berdasarkan prinsip farmakologi umum
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
        if (!combinationData.produk) {
          combinationData.produk = produkList;
        }
        
        if (!combinationData.urutanOptimal) {
          combinationData.urutanOptimal = Array.from({ length: produkList.length }, (_, i) => i);
        }

        // Ensure status is valid
        const validStatuses = ["aman", "berisiko", "tidak_direkomendasikan"];
        if (!validStatuses.includes(combinationData.status)) {
          combinationData.status = "berisiko"; // Default to risky if invalid
        }

        // Ensure sources field exists
        if (!combinationData.sources) {
          combinationData.sources = ["https://www.google.com/search?q=" + encodeURIComponent(produkList.join(' ')) + ' interaksi'];
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
