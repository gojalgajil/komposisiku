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
          throw new Error(`Sebentar ya: ${response.status} ${response.statusText}`);
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
          <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div ref={resultRef} className="bg-[#def5fa] rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="p-8">
                {/* Product Header */}
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Kombinasi Produk
                  </h3>
                  <h3 className="text-3xl font-bold text-[#17A2B8] dark:text-[#17A2B8] mb-4">
                    "{checkResult.produk1}" & "{checkResult.produk2}"
                  </h3>
                  <div className="w-24 h-1 bg-gradient-to-r from-[#17A2B8] to-[#9370DB] mx-auto rounded-full"></div>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center mb-8">
                  <div className={`inline-block px-6 py-3 rounded-xl text-white font-bold text-lg ${
                    checkResult.status === 'aman' ? 'bg-green-500 shadow-green-200 shadow-lg' :
                    checkResult.status === 'berisiko' ? 'bg-yellow-500 shadow-yellow-200 shadow-lg' :
                    'bg-red-500 shadow-red-200 shadow-lg'
                  }`}>
                    {checkResult.status === 'aman' ? 'AMAN DIPADUKAN' :
                     checkResult.status === 'berisiko' ? 'BERISIKO' : 'TIDAK DIREKOMENDASIKAN'}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-6 mb-6">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-[#17A2B8] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Deskripsi Kombinasi</h4>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    {checkResult.deskripsi.split('\n').map((point, index) => (
                      <div key={index} className="mb-2">
                        {point.replace(/^•\s*/, '').replace(/\*\*/g, '')}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center mb-4">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-xl font-semibold text-green-800 dark:text-green-300">Anjuran</h4>
                    </div>
                    <ul className="space-y-3">
                      {checkResult.hasil.anjuran.map((item, index) => (
                        <li key={index} className="flex items-start text-green-700 dark:text-green-300 text-sm">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center mb-4">
                      <svg className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <h4 className="text-xl font-semibold text-orange-800 dark:text-orange-300">Efek Samping</h4>
                    </div>
                    <ul className="space-y-3">
                      {checkResult.hasil.efekSamping.map((item, index) => (
                        <li key={index} className="flex items-start text-orange-700 dark:text-orange-300 text-sm">
                          <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sources Section */}
                {checkResult.sources && checkResult.sources.length > 0 && (
                  <div className="bg-[#faf9f0] dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center mb-4">
                      <svg className="w-6 h-6 text-[#9370DB] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Sumber Referensi</h4>
                    </div>
                    <div className="grid gap-2">
                      {checkResult.sources.map((source, index) => (
                        <a
                          key={index}
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start sm:items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 border border-blue-200 dark:border-blue-800"
                        >
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="text-blue-700 dark:text-blue-300 text-sm break-all sm:break-words">{source}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Buttons - Bottom Right */}
                <div className="flex justify-end mt-6">
                  <div className="flex gap-3">
                    <button
                      onClick={() => alert('Export PDF akan segera hadir!')}
                      className="flex items-center w-fit px-4 py-2 bg-[#DC2626] hover:bg-[#EF4444] text-white text-sm rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                      title="Export sebagai PDF"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
