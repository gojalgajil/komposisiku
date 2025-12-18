import { getProductDetails } from './gemini';

export interface ProductAnalysisResult {
  namaProduk: string;
  komposisi: {
    nama: string;
    fungsi: string;
  }[];
  anjuran: string[];
  larangan: string[];
  sources: string[];
  registrationNumber?: string;
  isValid?: boolean;
}

export class ProductAnalyzer {
  /**
   * Analyze a product by name or BPOM registration number
   */
  async analyzeProduct(input: string): Promise<ProductAnalysisResult | null> {
    try {
      // Check if input looks like a BPOM registration number
      const isRegistrationNumber = /^[A-Z]{2}\d{10,12}$/i.test(input.trim());
      
      let productName = input;
      
      // If it's a registration number, we might need to extract product name
      // For now, we'll treat it as a product name search
      if (isRegistrationNumber) {
        // In a real implementation, you might have a database to look up registration numbers
        // For now, we'll try to get details using the registration number as search term
        productName = input;
      }

      const details = await getProductDetails(productName);
      
      if (!details) {
        return null;
      }

      return {
        ...details,
        registrationNumber: isRegistrationNumber ? input.toUpperCase() : undefined,
        isValid: true
      };
    } catch (error) {
      console.error('Error analyzing product:', error);
      return null;
    }
  }

  /**
   * Quick check for BPOM registration number validity
   */
  async quickCheck(registrationNumber: string): Promise<{
    isValid: boolean;
    registrationNumber: string;
    message?: string;
  }> {
    try {
      const trimmedNumber = registrationNumber.trim().toUpperCase();
      
      // Basic format validation for BPOM registration numbers
      // Format: 2 letters + 10-12 digits
      const isValidFormat = /^[A-Z]{2}\d{10,12}$/.test(trimmedNumber);
      
      if (!isValidFormat) {
        return {
          isValid: false,
          registrationNumber: trimmedNumber,
          message: 'Invalid BPOM registration number format. Expected format: 2 letters followed by 10-12 digits.'
        };
      }

      // In a real implementation, you would check against a database
      // For now, we'll do a basic format check
      return {
        isValid: true,
        registrationNumber: trimmedNumber,
        message: 'Registration number format is valid. Database verification required for complete validation.'
      };
    } catch (error) {
      console.error('Error in quick check:', error);
      return {
        isValid: false,
        registrationNumber: registrationNumber.trim(),
        message: 'Error validating registration number'
      };
    }
  }
}
