"use client";

import { useState, useRef, useEffect } from "react";
import Header from "../components/Header";

export interface ProductCombination {
  produk1: string;
  produk2: string;
  status: "aman" | "berisiko" | "tidak_direkomendasikan";
  deskripsi: string;
  hasil: {
    efekSamping: string[];
    anjuran: string[];
  };
  sources: string[];
}

export default function PadukanProduk() {
  const [productInputs, setProductInputs] = useState<string[]>(["", ""]);
  const [checkResult, setCheckResult] = useState<ProductCombination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const addProductInput = () => {
    if (productInputs.length < 4) {
      setProductInputs([...productInputs, ""]);
    }
  };

  const handleProductInputChange = (index: number, value: string) => {
    const newProductInputs = [...productInputs];
    newProductInputs[index] = value;
    setProductInputs(newProductInputs);
  };

  // Auto-scroll to result when combination analysis appears
  useEffect(() => {
    if (checkResult && resultRef.current) {
      resultRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [checkResult]);

  const handleCheck = async () => {
    const filledInputs = productInputs.filter(input => input.trim() !== "");
    
    if (filledInputs.length >= 2) {
      const produk1 = filledInputs[0].trim();
      const produk2 = filledInputs[1].trim();
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/product-combination', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ produk1, produk2 }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Token Gemini Habis');
          }
          throw new Error(`Failed to analyze combination: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        setCheckResult(result);
      } catch (error) {
        console.error("Error analyzing product combination:", error);
        setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
        setCheckResult(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-[#17A2B8] dark:text-white mb-2 text-center">
          Padukan Produk
        </h1>
        <h2 className="font-bold text-[#9370DB] dark:text-white mb-8 text-center">
            Kami akan bantu kamu ngecek apakah beberapa produk bisa dipakai bareng tanpa masalah. Tinggal masukin produknya, nanti sistem cek apakah ada kandungan yang bentrok atau justru saling melengkapi.
        </h2>
        
        <div className="dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {productInputs.map((product, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Produk ${index + 1}`}
                  value={product}
                  onChange={(e) => handleProductInputChange(index, e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                {index < productInputs.length - 1 && (
                  <span className="text-xl font-bold text-gray-600 dark:text-gray-400">+</span>
                )}
              </div>
            ))}
            
            {productInputs.length < 4 && (
              <button
                onClick={addProductInput}
                className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#1CC8E3] transition-colors"
              >
                Tambah produk lagi?
              </button>
            )}
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleCheck}
              className="px-4 py-2 bg-[#1CC8E3] text-white rounded-lg hover:bg-[#8B5CF6] transition-colors font-semibold"
            >
              Cek
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{backgroundColor: 'rgba(245, 240, 240, 0.64)'}}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3 shadow-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-900 dark:text-white">Menganalisis kombinasi produk...</span>
            </div>
          </div>
        )}

        {/* Result Display Section */}
        {checkResult && (
          <div ref={resultRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
            <div className="mb-6">
              <div className={`inline-block px-4 py-2 rounded-lg text-white font-semibold ${
                checkResult.status === 'aman' ? 'bg-green-500' : 
                checkResult.status === 'berisiko' ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                {checkResult.status === 'aman' ? 'AMAN' : 
                 checkResult.status === 'berisiko' ? 'BERISIKO' : 'TIDAK DIREKOMENDASIKAN'}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Deskripsi</h3>
              <div className="text-gray-600 dark:text-gray-300">
                {checkResult.deskripsi.split('\n').map((point, index) => (
                  <div key={index} className="mb-2">
                    {point.replace(/^•\s*/, '').replace(/\*\*/g, '')}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-3">Anjuran</h3>
                <ul className="list-disc list-inside space-y-2">
                  {checkResult.hasil.anjuran.map((item, index) => (
                    <li key={index} className="text-gray-600 dark:text-gray-300 text-sm">{item}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-3">Efek Samping</h3>
                <ul className="list-disc list-inside space-y-2">
                  {checkResult.hasil.efekSamping.map((item, index) => (
                    <li key={index} className="text-gray-600 dark:text-gray-300 text-sm">{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {checkResult.sources && checkResult.sources.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Sumber:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {checkResult.sources.map((source, index) => (
                    <li key={index} className="text-gray-600 dark:text-gray-400 text-sm">
                      <a 
                        href={source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
