"use client";

import { useState } from "react";
import Header from "../components/Header";
import { dummyCombinations, ProductCombination } from "../data/dummyProducts";

export default function PadukanProduk() {
  const [productInputs, setProductInputs] = useState<string[]>(["", ""]);
  const [checkResult, setCheckResult] = useState<ProductCombination | null>(null);

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

  const handleCheck = () => {
    const filledInputs = productInputs.filter(input => input.trim() !== "");
    
    if (filledInputs.length >= 2) {
      const produk1 = filledInputs[0].trim();
      const produk2 = filledInputs[1].trim();
      
      // Check if this combination exists in dummy data
      const combination = dummyCombinations.find(
        combo => 
          (combo.produk1.toLowerCase() === produk1.toLowerCase() && combo.produk2.toLowerCase() === produk2.toLowerCase()) ||
          (combo.produk1.toLowerCase() === produk2.toLowerCase() && combo.produk2.toLowerCase() === produk1.toLowerCase())
      );
      
      setCheckResult(combination || null);
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

        {/* Result Display Section */}
        {checkResult && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
            <div className="mb-6">
              <div className={`inline-block px-4 py-2 rounded-lg text-white font-semibold ${
                checkResult.hasil.status === 'aman' ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {checkResult.hasil.status === 'aman' ? 'AMAN' : 'BERISIKO'}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Kesimpulan</h3>
              <p className="text-gray-600 dark:text-gray-300">{checkResult.hasil.kesimpulan}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Detail Analisis</h3>
              <ul className="list-disc list-inside space-y-2">
                {checkResult.hasil.detailAnalisis.map((item, index) => (
                  <li key={index} className="text-gray-600 dark:text-gray-300">{item}</li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-3">Anjuran Pemakaian</h3>
                <ul className="list-disc list-inside space-y-2">
                  {checkResult.hasil.anjuranPemakaian.map((item, index) => (
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
          </div>
        )}
      </main>
    </div>
  );
}
