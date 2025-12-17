import axios from 'axios';
import * as cheerio from 'cheerio';

export interface IngredientInfo {
  nama: string;
  fungsi: string[];
  keamanan: string;
  deskripsi: string;
  sumber: string[];
}

export class INCIDecoderScraper {
  private baseUrl = 'https://incidecoder.com';

  async getIngredientInfo(ingredientName: string): Promise<IngredientInfo | null> {
    try {
      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(ingredientName)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Check if ingredient found
      const ingredientLink = $(`a[href*="/ingredients/"]`).first();
      if (!ingredientLink.length) {
        return null;
      }

      const ingredientUrl = `${this.baseUrl}${ingredientLink.attr('href')}`;
      return await this.parseIngredientPage(ingredientUrl);
      
    } catch (error) {
      console.error(`Error getting ingredient info from INCIDecoder for ${ingredientName}:`, error);
      return null;
    }
  }

  private async parseIngredientPage(url: string): Promise<IngredientInfo | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      const nama = $('h1').first().text().trim();
      const fungsi: string[] = [];
      const deskripsi = $('.ingredient-description').text().trim();
      
      // Extract functions
      $('.functions-list li').each((index, element) => {
        fungsi.push($(element).text().trim());
      });

      // Extract safety info
      const keamanan = $('.safety-info').text().trim() || 'Tidak ada informasi keamanan';

      return {
        nama,
        fungsi,
        keamanan,
        deskripsi,
        sumber: [url]
      };
      
    } catch (error) {
      console.error('Error parsing ingredient page:', error);
      return null;
    }
  }
}

export class PaulaChoiceScraper {
  private baseUrl = 'https://www.paulaschoice.com';

  async getIngredientInfo(ingredientName: string): Promise<IngredientInfo | null> {
    try {
      const searchUrl = `${this.baseUrl}/shop-ingredient-dictionary?search=${encodeURIComponent(ingredientName)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Check if ingredient found
      const ingredientLink = $(`a[href*="/ingredient/"]`).first();
      if (!ingredientLink.length) {
        return null;
      }

      const ingredientUrl = `${this.baseUrl}${ingredientLink.attr('href')}`;
      return await this.parseIngredientPage(ingredientUrl);
      
    } catch (error) {
      console.error(`Error getting ingredient info from Paula's Choice for ${ingredientName}:`, error);
      return null;
    }
  }

  private async parseIngredientPage(url: string): Promise<IngredientInfo | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      const nama = $('.ingredient-name').first().text().trim();
      const fungsi: string[] = [];
      const deskripsi = $('.ingredient-description').text().trim();
      
      // Extract functions
      $('.ingredient-functions li').each((index, element) => {
        fungsi.push($(element).text().trim());
      });

      // Extract safety info
      const keamanan = $('.safety-rating').text().trim() || 'Tidak ada informasi keamanan';

      return {
        nama,
        fungsi,
        keamanan,
        deskripsi,
        sumber: [url]
      };
      
    } catch (error) {
      console.error('Error parsing Paula\'s Choice ingredient page:', error);
      return null;
    }
  }
}

export class CosDNAScraper {
  private baseUrl = 'https://www.cosdna.com';

  async getIngredientInfo(ingredientName: string): Promise<IngredientInfo | null> {
    try {
      const searchUrl = `${this.baseUrl}/search.php?q=${encodeURIComponent(ingredientName)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Check if ingredient found
      const ingredientLink = $(`a[href*="/ingredients/"]`).first();
      if (!ingredientLink.length) {
        return null;
      }

      const ingredientUrl = `${this.baseUrl}${ingredientLink.attr('href')}`;
      return await this.parseIngredientPage(ingredientUrl);
      
    } catch (error) {
      console.error(`Error getting ingredient info from CosDNA for ${ingredientName}:`, error);
      return null;
    }
  }

  private async parseIngredientPage(url: string): Promise<IngredientInfo | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      const nama = $('.ingredient-title').first().text().trim();
      const fungsi: string[] = [];
      const deskripsi = $('.ingredient-description').text().trim();
      
      // Extract functions
      $('.function-list li').each((index, element) => {
        fungsi.push($(element).text().trim());
      });

      // Extract safety info
      const keamanan = $('.safety-info').text().trim() || 'Tidak ada informasi keamanan';

      return {
        nama,
        fungsi,
        keamanan,
        deskripsi,
        sumber: [url]
      };
      
    } catch (error) {
      console.error('Error parsing CosDNA ingredient page:', error);
      return null;
    }
  }
}

export class IngredientAggregator {
  private inciDecoder = new INCIDecoderScraper();
  private paulaChoice = new PaulaChoiceScraper();
  private cosDNA = new CosDNAScraper();

  async getCompleteIngredientInfo(ingredientName: string): Promise<IngredientInfo> {
    const promises = [
      this.inciDecoder.getIngredientInfo(ingredientName),
      this.paulaChoice.getIngredientInfo(ingredientName),
      this.cosDNA.getIngredientInfo(ingredientName)
    ];

    const results = await Promise.allSettled(promises);
    
    // Combine results from all sources
    const combinedInfo: IngredientInfo = {
      nama: ingredientName,
      fungsi: [],
      keamanan: '',
      deskripsi: '',
      sumber: []
    };

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const info = result.value;
        
        // Combine functions
        if (info.fungsi.length > 0) {
          info.fungsi.forEach(func => {
            if (!combinedInfo.fungsi.includes(func)) {
              combinedInfo.fungsi.push(func);
            }
          });
        }

        // Use the most detailed description
        if (info.deskripsi.length > combinedInfo.deskripsi.length) {
          combinedInfo.deskripsi = info.deskripsi;
        }

        // Combine safety info
        if (info.keamanan && !combinedInfo.keamanan.includes(info.keamanan)) {
          combinedInfo.keamanan += (combinedInfo.keamanan ? ' | ' : '') + info.keamanan;
        }

        // Combine sources
        combinedInfo.sumber.push(...info.sumber);
      }
    });

    // If no information found, provide default
    if (combinedInfo.fungsi.length === 0 && combinedInfo.deskripsi === '') {
      combinedInfo.fungsi = ['Informasi tidak tersedia'];
      combinedInfo.deskripsi = 'Tidak ada informasi detail tentang bahan ini.';
      combinedInfo.keamanan = 'Informasi keamanan tidak tersedia';
    }

    return combinedInfo;
  }
}
