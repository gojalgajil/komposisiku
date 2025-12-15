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

// Product Recommendations using Gemini AI with Google Search
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
      const errorText = await response.text();
      console.error('API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to get recommendations: ${response.status} ${response.statusText}`);
    }

    return await response.json();
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
      const errorText = await response.text();
      console.error('Product Details API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to get product details: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting product details:", error);
    return null;
  }
}
