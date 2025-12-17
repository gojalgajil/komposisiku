import { BPOMScraper, BPOMProduct } from './bpomScraper';
import { IngredientAggregator, IngredientInfo } from './ingredientScrapers';
import { Product } from '../types/product';

export interface AnalyzedProduct extends Product {
  bpomInfo: BPOMProduct;
  ingredientDetails: IngredientInfo[];
  sources: string[];
}

export class ProductAnalyzer {
  private bpomScraper = new BPOMScraper();
  private ingredientAggregator = new IngredientAggregator();

  async analyzeProduct(input: string): Promise<AnalyzedProduct | null> {
    try {
      // Extract BPOM number from input
      const bpomNumber = this.bpomScraper.extractRegistrationNumber(input);
      
      let bpomInfo: BPOMProduct;
      
      if (bpomNumber) {
        // Search by BPOM number
        bpomInfo = await this.bpomScraper.checkProduct(bpomNumber);
      } else {
        // Search by product name
        bpomInfo = await this.bpomScraper.searchByProductName(input);
      }
      
      if (bpomInfo.status === 'belum_terdaftar') {
        return {
          id: input,
          namaProduk: 'Produk Belum Terdaftar',
          noBPOM: bpomNumber || '',
          komposisi: [],
          anjuran: ['Produk ini belum terdaftar di BPOM'],
          larangan: ['Tidak dapat digunakan karena tidak terdaftar'],
          bpomInfo,
          ingredientDetails: [],
          sources: ['https://cekbpom.pom.go.id/']
        };
      }

      // Get ingredient details for each composition item
      const ingredientDetails: IngredientInfo[] = [];
      const sources: string[] = ['https://cekbpom.pom.go.id/'];

      // Process ingredients in batches to avoid overwhelming the servers
      const batchSize = 3;
      for (let i = 0; i < bpomInfo.komposisi.length; i += batchSize) {
        const batch = bpomInfo.komposisi.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (ingredient) => {
          const details = await this.ingredientAggregator.getCompleteIngredientInfo(ingredient);
          sources.push(...details.sumber);
          return details;
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            ingredientDetails.push(result.value);
          }
        });

        // Add delay between batches to be respectful to the servers
        if (i + batchSize < bpomInfo.komposisi.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Generate recommendations and warnings based on ingredients
      const { anjuran, larangan } = this.generateRecommendations(ingredientDetails, bpomInfo);

      // Remove duplicate sources
      const uniqueSources = [...new Set(sources)];

      return {
        id: bpomInfo.noBPOM || input,
        namaProduk: bpomInfo.namaProduk,
        noBPOM: bpomInfo.noBPOM,
        komposisi: ingredientDetails.map(ing => ({
          nama: ing.nama,
          fungsi: ing.fungsi.join(', ') || 'Tidak ada informasi fungsi'
        })),
        anjuran,
        larangan,
        bpomInfo,
        ingredientDetails,
        sources: uniqueSources
      };

    } catch (error) {
      console.error('Error analyzing product:', error);
      return null;
    }
  }

  private generateRecommendations(ingredients: IngredientInfo[], bpomInfo: BPOMProduct): { anjuran: string[], larangan: string[] } {
    const anjuran: string[] = [];
    const larangan: string[] = [];

    // General recommendations
    anjuran.push('Produk ini terdaftar di BPOM dan aman digunakan sesuai aturan');
    
    if (bpomInfo.produkImport) {
      anjuran.push('Produk import - perhatikan tanggal kedaluwarsa');
      anjuran.push('Pastikan produk memiliki label dalam bahasa Indonesia');
    }

    // Analyze ingredients for specific recommendations
    const hasAlcohol = ingredients.some(ing => 
      ing.nama.toLowerCase().includes('alcohol') || 
      ing.nama.toLowerCase().includes('ethanol')
    );
    
    if (hasAlcohol) {
      anjuran.push('Mengandung alkohol - gunakan sesuai kebutuhan');
      larangan.push('Hati-hati untuk kulit sensitif terhadap alkohol');
    }

    const hasFragrance = ingredients.some(ing => 
      ing.nama.toLowerCase().includes('fragrance') || 
      ing.nama.toLowerCase().includes('parfum')
    );
    
    if (hasFragrance) {
      larangan.push('Mengandung pewangi - tidak disarankan untuk kulit sensitif');
    }

    const hasRetinoids = ingredients.some(ing => 
      ing.nama.toLowerCase().includes('retinol') || 
      ing.nama.toLowerCase().includes('retinoid') ||
      ing.nama.toLowerCase().includes('tretinoin')
    );
    
    if (hasRetinoids) {
      anjuran.push('Gunakan sunscreen saat siang hari');
      anjuran.push('Gunakan secara bertahap untuk menghindari iritasi');
      larangan.push('Tidak untuk ibu hamil/menyusui tanpa konsultasi dokter');
    }

    const hasAHABHA = ingredients.some(ing => 
      ing.nama.toLowerCase().includes('acid') && 
      (ing.nama.toLowerCase().includes('glycolic') || 
       ing.nama.toLowerCase().includes('lactic') ||
       ing.nama.toLowerCase().includes('salicylic'))
    );
    
    if (hasAHABHA) {
      anjuran.push('Gunakan sunscreen saat siang hari');
      larangan.push('Tidak digunakan bersamaan dengan produk aktif lainnya');
    }

    // Add specific ingredient warnings
    ingredients.forEach(ingredient => {
      if (ingredient.keamanan.toLowerCase().includes('irritasi')) {
        larangan.push(`${ingredient.nama} dapat menyebabkan iritasi pada kulit sensitif`);
      }
      
      if (ingredient.keamanan.toLowerCase().includes('alergi')) {
        larangan.push(`${ingredient.nama} dapat menyebabkan alergi`);
      }
    });

    // Default recommendations if no specific ones found
    if (anjuran.length === 1) {
      anjuran.push('Gunakan sesuai petunjuk pemakaian');
      anjuran.push('Lakukan patch test sebelum penggunaan pertama');
    }

    if (larangan.length === 0) {
      larangan.push('Hentikan penggunaan jika terjadi iritasi');
      larangan.push('Jauhkan dari jangkauan anak-anak');
    }

    return { anjuran, larangan };
  }

  async quickCheck(registrationNumber: string): Promise<{
    terdaftar: boolean;
    namaProduk: string;
    message: string;
  }> {
    try {
      const bpomInfo = await this.bpomScraper.checkProduct(registrationNumber);
      
      if (bpomInfo.status === 'belum_terdaftar') {
        return {
          terdaftar: false,
          namaProduk: '',
          message: 'Produk belum terdaftar di BPOM'
        };
      }

      return {
        terdaftar: true,
        namaProduk: bpomInfo.namaProduk,
        message: 'Produk terdaftar dan aman digunakan'
      };

    } catch (error) {
      return {
        terdaftar: false,
        namaProduk: '',
        message: 'Terjadi kesalahan saat memeriksa produk'
      };
    }
  }
}
