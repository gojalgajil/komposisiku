export interface ProductRecommendation {
  name: string;
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
  sources: string[];
}

// Product Recommendations using Groq AI with Google Search
export async function getProductRecommendations(searchTerm: string): Promise<ProductRecommendation[]> {
  try {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ searchTerm }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get recommendations: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle the new response format: {products: [{namaProduk, merk, ...}]}
    if (data && data.products && Array.isArray(data.products)) {
      return data.products.map((product: any) => ({
        name: product.namaProduk || product.name || ''
      }));
    }
    
    // Handle old format or simple array
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        name: item.namaProduk || item.name || ''
      }));
    }
    
    // Fallback: return empty array
    console.log("Unexpected response format:", data);
    return [];
  } catch (error) {
    console.error("Error getting product recommendations:", error);
    return [];
  }
}

// Product Details using Gemini AI with web sources
export async function getProductDetails(productName: string): Promise<ProductDetails | null> {
  try {
    const response = await fetch('/api/product-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productName }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Token Gemini Habis');
      }
      throw new Error(`Failed to get product details: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting product details:", error);
    return null;
  }
}
