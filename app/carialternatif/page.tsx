"use client";

import { useState, useRef, useEffect } from "react";
import Header from "../components/Header";

export interface ProductAlternative {
  originalProduct: string;
  alternatives: {
    nama: string;
    merek: string;
    kategori: string;
    keunggulan: string;
    keterbatasan: string;
    harga: "murah" | "sedang" | "mahal";
  }[];
  saran: string[];
  sources: string[];
}

export default function CariAlternatif() {
  const [productName, setProductName] = useState("");
  const [searchResult, setSearchResult] = useState<ProductAlternative | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    if (!productName.trim()) {
      setError("Masukkan nama produk yang ingin dicari alternatifnya");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/product-alternatives', {
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
        throw new Error(`Failed to search alternatives: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setSearchResult(result);
    } catch (error) {
      console.error("Error searching alternatives:", error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to result when search appears
  useEffect(() => {
    if (searchResult && resultRef.current) {
      resultRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [searchResult]);

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-[#17A2B8] dark:text-white mb-2 text-center">
          Cari Alternatif Produk
        </h1>
        <h2 className="font-bold text-[#9370DB] dark:text-white mb-8 text-center">
            Cari produk alternatif dengan fungsi serupa tapi mungkin dengan harga lebih terjangkau atau kandungan berbeda. Kami akan bantu temukan opsi terbaik untukmu.
        </h2>
        
        <div className="dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col items-center gap-4">
            <input
              type="text"
              placeholder="Masukkan nama produk..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-[#1CC8E3] text-white rounded-lg hover:bg-[#8B5CF6] transition-colors font-semibold"
            >
              Cari Alternatif
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
              <span className="text-gray-900 dark:text-white">Mencari alternatif produk...</span>
            </div>
          </div>
        )}

        {/* Result Display Section */}
        {searchResult && (
          <div ref={resultRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Alternatif untuk "{searchResult.originalProduct}"
              </h3>
            </div>

            {/* Alternatives List */}
            <div className="space-y-6 mb-6">
              {searchResult.alternatives.map((alt, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {alt.nama}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Merek: {alt.merek} | Kategori: {alt.kategori}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      alt.harga === 'murah' ? 'bg-green-100 text-green-800' :
                      alt.harga === 'sedang' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Harga {alt.harga}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold text-green-600 dark:text-green-400 mb-2">Keunggulan:</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{alt.keunggulan}</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">Keterbatasan:</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{alt.keterbatasan}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {searchResult.saran && searchResult.saran.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">Saran Pemilihan:</h4>
                <ul className="list-disc list-inside space-y-2">
                  {searchResult.saran.map((saran, index) => (
                    <li key={index} className="text-sm text-blue-700 dark:text-blue-300">{saran}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sources */}
            {searchResult.sources && searchResult.sources.length > 0 && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Sumber:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {searchResult.sources.map((source, index) => (
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
