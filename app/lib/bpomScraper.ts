import axios from 'axios';
import * as cheerio from 'cheerio';

export interface BPOMProduct {
  namaProduk: string;
  noBPOM: string;
  komposisi: string[];
  status: 'terdaftar' | 'belum_terdaftar';
  produkImport: boolean;
}

export class BPOMScraper {
  private baseUrl = 'https://cekbpom.pom.go.id';

  async searchByProductName(productName: string): Promise<BPOMProduct> {
    try {
      console.log(`Searching for product: ${productName}`);
      
      // Try multiple search approaches
      const searchMethods = [
        // Method 1: GET with search parameter
        () => this.searchWithGet(productName),
        // Method 2: POST with search form
        () => this.searchWithPost(productName),
        // Method 3: Direct search endpoint
        () => this.searchDirectEndpoint(productName)
      ];

      for (const searchMethod of searchMethods) {
        try {
          const result = await searchMethod();
          if (result && result.status === 'terdaftar') {
            console.log(`Found product using search method`);
            return result;
          }
        } catch (error) {
          console.log(`Search method failed, trying next...`);
        }
      }

      // If all methods fail, return not registered
      console.log(`No product found for: ${productName}`);
      return {
        namaProduk: productName,
        noBPOM: '',
        komposisi: [],
        status: 'belum_terdaftar',
        produkImport: false
      };

    } catch (error) {
      console.error('Error searching by product name:', error);
      return {
        namaProduk: productName,
        noBPOM: '',
        komposisi: [],
        status: 'belum_terdaftar',
        produkImport: false
      };
    }
  }

  private async searchWithGet(productName: string): Promise<BPOMProduct> {
    const response = await axios.get(`${this.baseUrl}/`, {
      params: {
        search: productName,
        q: productName,
        name: productName
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    return this.extractFromSearchPage($, productName);
  }

  private async searchWithPost(productName: string): Promise<BPOMProduct> {
    const response = await axios.post(`${this.baseUrl}/search`, {
      search: productName,
      nama_produk: productName,
      query: productName
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    return this.extractFromSearchPage($, productName);
  }

  private async searchDirectEndpoint(productName: string): Promise<BPOMProduct> {
    const endpoints = [
      `${this.baseUrl}/search`,
      `${this.baseUrl}/api/search`,
      `${this.baseUrl}/find`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, {
          params: { q: productName },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const $ = cheerio.load(response.data);
        const result = this.extractFromSearchPage($, productName);
        if (result.status === 'terdaftar') {
          return result;
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error('All endpoints failed');
  }

  private async extractFromDetailPage(url: string, productName: string): Promise<BPOMProduct> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const productInfo = this.extractProductInfo($);
      
      return {
        ...productInfo,
        status: 'terdaftar'
      };
    } catch (error) {
      console.error('Error extracting from detail page:', error);
      return {
        namaProduk: productName,
        noBPOM: '',
        komposisi: [],
        status: 'belum_terdaftar',
        produkImport: false
      };
    }
  }

  private extractFromSearchPage($: cheerio.CheerioAPI, productName: string): BPOMProduct {
    let namaProduk = '';
    let noBPOM = '';
    let komposisi: string[] = [];

    console.log('Extracting from search page...');

    // Look for BPOM numbers in the entire page
    const bodyText = $('body').text();
    console.log('Page body text length:', bodyText.length);
    
    // Try multiple BPOM patterns
    const bpomPatterns = [
      /(MD|NA|SL|HT|DBL|TR)\d{14,15}/gi,
      /(MD|NA|SL|HT|DBL|TR)\d{13,14}/gi,
      /\b[A-Z]{2}\d{12,15}\b/g
    ];
    
    for (const pattern of bpomPatterns) {
      const matches = bodyText.match(pattern);
      if (matches && matches.length > 0) {
        console.log('Found BPOM numbers:', matches);
        noBPOM = matches[0];
        break;
      }
    }

    // If we found a BPOM number, extract more details
    if (noBPOM) {
      console.log('Extracting product details for BPOM:', noBPOM);
      
      // Extract product name
      namaProduk = productName;
      
      // Try to find the actual product name near the BPOM number
      const bpomIndex = bodyText.indexOf(noBPOM);
      if (bpomIndex > 0) {
        const surroundingText = bodyText.substring(
          Math.max(0, bpomIndex - 200),
          Math.min(bodyText.length, bpomIndex + 200)
        );
        
        // Look for product names in surrounding text
        const lines = surroundingText.split('\n');
        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.toLowerCase().includes(productName.toLowerCase()) && 
              cleanLine.length < 100 && 
              cleanLine.length > 5) {
            namaProduk = cleanLine;
            break;
          }
        }
      }
      
      // Try to extract composition
      const komposisiPatterns = [
        /komposisi[:\s]*([^\n]+)/i,
        /komposisi[:\s]*([^.;]+)/i,
        /bahan[:\s]*([^\n]+)/i,
        /ingredients[:\s]*([^\n]+)/i
      ];
      
      for (const pattern of komposisiPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          console.log('Found composition text:', match[1]);
          komposisi = this.parseComposition(match[1]);
          break;
        }
      }
      
      // Also try to find composition in tables or lists
      if (komposisi.length === 0) {
        $('table, ul, ol, .komposisi, .composition').each((i, element) => {
          const elementText = $(element).text();
          if (elementText.toLowerCase().includes('komposisi') || 
              elementText.toLowerCase().includes('bahan')) {
            const items = $(element).find('li, td, .item');
            if (items.length > 0) {
              items.each((j, item) => {
                const text = $(item).text().trim();
                if (text && text.length > 2 && text.length < 100) {
                  komposisi.push(text);
                }
              });
            }
          }
        });
      }
      
      console.log('Final composition count:', komposisi.length);
      
      return {
        namaProduk,
        noBPOM,
        komposisi,
        status: 'terdaftar',
        produkImport: false
      };
    }

    console.log('No BPOM number found in search page');
    return {
      namaProduk: productName,
      noBPOM: '',
      komposisi: [],
      status: 'belum_terdaftar',
      produkImport: false
    };
  }

  async checkProduct(registrationNumber: string): Promise<BPOMProduct> {
    try {
      // Clean the registration number
      const cleanNumber = registrationNumber.trim().toUpperCase();
      
      // Make request to BPOM website
      const response = await axios.post(`${this.baseUrl}/search`, {
        nomor_registrasi: cleanNumber
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Check if product exists - look for any table or product info
      const productInfo = this.extractProductInfo($);
      
      if (!productInfo.namaProduk) {
        return {
          namaProduk: '',
          noBPOM: registrationNumber,
          komposisi: [],
          status: 'belum_terdaftar',
          produkImport: false
        };
      }
      
      return {
        ...productInfo,
        noBPOM: registrationNumber,
        status: 'terdaftar'
      };

    } catch (error) {
      console.error('Error checking BPOM product:', error);
      return {
        namaProduk: '',
        noBPOM: registrationNumber,
        komposisi: [],
        status: 'belum_terdaftar',
        produkImport: false
      };
    }
  }

  private extractProductInfo($: cheerio.CheerioAPI) {
    let namaProduk = '';
    let komposisi: string[] = [];
    let produkImport = false;
    let noBPOM = '';

    // Extract product name from page title or headers
    const pageTitle = $('title').text() || $('h1').first().text() || $('.product-title').text();
    if (pageTitle) {
      namaProduk = pageTitle.trim();
    }

    // Extract BPOM number from various locations
    const bodyText = $('body').text();
    const bpomMatch = bodyText.match(/(MD|NA|SL|HT|DBL|TR)\d{14,15}/i);
    if (bpomMatch) {
      noBPOM = bpomMatch[1];
    }

    // Look for BPOM number in specific elements
    $('.bpom-number, .registration-number, .no-registrasi, [data-bpom]').each((i, element) => {
      const text = $(element).text().trim();
      const match = text.match(/(MD|NA|SL|HT|DBL|TR)\d{14,15}/i);
      if (match) {
        noBPOM = match[1];
        return false;
      }
    });

    // Extract composition from the page
    // Look for composition section
    const komposisiSection = $('.komposisi, .composition, .ingredients, #komposisi, #composition, #ingredients');
    
    if (komposisiSection.length > 0) {
      // Extract from composition section
      komposisiSection.each((i, element) => {
        const sectionText = $(element).text();
        
        // Try different patterns for composition extraction
        const patterns = [
          /komposisi[:\s]*([^.\n]+)/i,
          /bahan aktif[:\s]*([^.\n]+)/i,
          /ingredients[:\s]*([^.\n]+)/i
        ];
        
        for (const pattern of patterns) {
          const match = sectionText.match(pattern);
          if (match) {
            komposisi = this.parseComposition(match[1]);
            break;
          }
        }
        
        // If no pattern match, try to extract list items
        if (komposisi.length === 0) {
          $(element).find('li, .item, .ingredient-item').each((j, item) => {
            const ingredient = $(item).text().trim();
            if (ingredient && ingredient.length > 2 && ingredient.length < 100) {
              komposisi.push(ingredient);
            }
          });
        }
      });
    }

    // Fallback: Look for composition in the entire page
    if (komposisi.length === 0) {
      const komposisiMatch = bodyText.match(/komposisi[:\s]*([^\n]+)/i);
      if (komposisiMatch) {
        komposisi = this.parseComposition(komposisiMatch[1]);
      }
    }

    // Check if it's an imported product
    produkImport = bodyText.toLowerCase().includes('import') || 
                   bodyText.toLowerCase().includes('luar negeri') ||
                   bodyText.toLowerCase().includes('imported') ||
                   bodyText.toLowerCase().includes('produk impor');

    return {
      namaProduk: namaProduk || '',
      komposisi,
      produkImport,
      noBPOM
    };
  }

  private parseComposition(compositionText: string): string[] {
    // Split composition by common separators
    const separators = [',', ';', '\n', '•', '·'];
    let ingredients = [compositionText];

    separators.forEach(sep => {
      ingredients = ingredients.flatMap(ing => ing.split(sep));
    });

    return ingredients
      .map(ing => ing.trim())
      .filter(ing => ing.length > 0 && !ing.match(/^(dan|atau|serta|dengan)$/i));
  }

  validateRegistrationNumber(number: string): boolean {
    // BPOM registration patterns:
    // MDXXXXXXXXXXXXXX (Domestic)
    // NAXXXXXXXXXXXXXX (Import)
    const bpomPattern = /^(MD|NA)\d{14,15}$/;
    return bpomPattern.test(number.replace(/\s/g, ''));
  }

  extractRegistrationNumber(input: string): string | null {
    // Extract BPOM number from text
    const patterns = [
      /(MD\s?\d{14,15})/i,
      /(NA\s?\d{14,15})/i,
      /(MD\d{14,15})/i,
      /(NAd{14,15})/i
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1].replace(/\s/g, '');
      }
    }

    return null;
  }
}
