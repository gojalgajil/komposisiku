"use client";

import Image from "next/image";
import Header from "./components/Header";
import { useState, useEffect } from "react";
import { dummyProducts, Product } from "./data/dummyProducts";
import { getProductRecommendations, getProductDetails, ProductRecommendation } from "./lib/gemini";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<Product | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Debounce function to prevent multiple rapid API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() === "") {
        setRecommendations([]);
        setShowRecommendations(false);
        setSearchResult(null);
        return;
      }

      // Get recommendations for autocomplete (debounced)
      if (searchTerm.length >= 2) {
        fetchRecommendations(searchTerm);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchRecommendations = async (value: string) => {
    setIsLoading(true);
    try {
      const recs = await getProductRecommendations(value);
      setRecommendations(recs);
      setShowRecommendations(true);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleProductSelect = async (productName: string) => {
    setSearchTerm(productName);
    setShowRecommendations(false);
    
    setIsLoading(true);
    try {
      const productDetails = await getProductDetails(productName);
      if (productDetails) {
        setSearchResult(productDetails);
      }
    } catch (error) {
      console.error("Error getting product details:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Video Section */}
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-auto max-h-[400px] object-cover rounded-2xl sm:rounded-3xl"
          >
            <source src="/Welcomevideo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      {/* Search Section */}
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        <h2 className="text-2xl font-semibold text-[#17A2B8] dark:text-white mb-4 text-center">
          Produk apa yang mau dijelasin?
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="cari produk"
            value={searchTerm}
            onChange={handleSearch}
            onFocus={() => searchTerm.length >= 2 && setShowRecommendations(true)}
            className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          
          {/* Recommendations Dropdown */}
          {showRecommendations && recommendations.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  Mencari produk...
                </div>
              ) : (
                recommendations.map((rec, index) => (
                  <button
                    key={index}
                    onClick={() => handleProductSelect(rec.name)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {rec.name}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* Product Result Section */}
      {searchResult && (
        <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {searchResult.namaProduk}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Merk:</span>
                  <p className="text-gray-600 dark:text-gray-400">{searchResult.merk}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">No. BPOM/Izin Edar:</span>
                  <p className="text-gray-600 dark:text-gray-400">{searchResult.noBPOM}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Komposisi:</h4>
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-gray-700 dark:text-gray-300">Nama</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-gray-700 dark:text-gray-300">Fungsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResult.komposisi.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-600 dark:text-gray-400">
                          {item.nama}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-600 dark:text-gray-400">
                          {item.fungsi}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Anjuran:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {searchResult.anjuran.map((item, index) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400 text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Larangan:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {searchResult.larangan.map((item, index) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400 text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Sources Section */}
              {searchResult.sources && searchResult.sources.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Sumber:</h4>
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
          </div>
        </section>
      )}
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 dark:text-white">Memuat data produk...</span>
          </div>
        </div>
      )}

      {/* <div className="flex min-h-[calc(100vh-4rem-400px)] items-center justify-center font-sans">
        <main className="flex w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div> */}
      {/* </main> */}
      {/* </div> */}
    </div>
  );
}
