"use client";

import Image from "next/image";
import Header from "./components/Header";
import { useState, useRef, useEffect } from "react";
import { getProductDetails, analyzeProductImage } from "./lib/gemini";
import { Product } from "./types/product";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const productDetailsRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      setSearchResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getProductDetails(searchTerm);
      setSearchResult(result);
    } catch (error) {
      console.error("Error searching product:", error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      // Check if camera is available
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Create video element to show camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Create modal for camera capture
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-4 max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold mb-4">Ambil Foto Produk</h3>
          <video id="camera-feed" class="w-full rounded-lg mb-4" autoplay></video>
          <div class="flex justify-end space-x-2">
            <button id="cancel-camera" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Batal</button>
            <button id="capture-photo" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Ambil Foto</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Get the video element in modal
      const modalVideo = modal.querySelector('#camera-feed') as HTMLVideoElement;
      modalVideo.srcObject = stream;
      
      // Handle cancel
      const cancelBtn = modal.querySelector('#cancel-camera');
      cancelBtn?.addEventListener('click', () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      });
      
      // Handle capture
      const captureBtn = modal.querySelector('#capture-photo');
      captureBtn?.addEventListener('click', () => {
        // Create canvas to capture image
        const canvas = document.createElement('canvas');
        canvas.width = modalVideo.videoWidth;
        canvas.height = modalVideo.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(modalVideo, 0, 0);
        
        // Convert to blob and create file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'product-photo.jpg', { type: 'image/jpeg' });
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(blob));
          }
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
        }, 'image/jpeg');
      });
      
    } catch (error) {
      console.error('Camera access denied:', error);
      // Fallback to file upload if camera is not available
      document.getElementById('image-upload')?.click();
    }
  };

  const handleImageAnalysis = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    try {
      const result = await analyzeProductImage(selectedImage);
      setSearchResult(result);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Auto-scroll to product details when result appears
  useEffect(() => {
    if (searchResult && productDetailsRef.current) {
      productDetailsRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [searchResult]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear product details when user starts typing again
    if (value.trim() === "") {
      setSearchResult(null);
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
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ketik nama produk atau upload foto produk (contoh: Tolak Angin Batuk, Wardah, Madu TJ)
          </p>
        </div>
        
        {/* Text Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Ketik nama produk..."
              value={searchTerm}
              onChange={handleInputChange}
              className="w-full px-4 py-3 pl-12 text-lg border rounded-full focus:outline-none focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white border-gray-300 focus:ring-blue-500"
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
          </div>
        </form>

        {/* Image Upload */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Atau foto produk untuk identifikasi otomatis
          </p>
          
          {!imagePreview ? (
            <div className="flex justify-center space-x-4">
              {/* Camera Capture Button */}
              <button
                onClick={handleCameraCapture}
                className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ambil Foto
                </p>
              </button>
              
              {/* File Upload Button */}
              <div
                className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <svg
                  className="w-12 h-12 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload Foto
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Max size: 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="max-w-xs max-h-48 rounded-lg object-cover"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleImageAnalysis}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
                >
                  Analisis Produk
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Product Result Section */}
      {searchResult && (
        <section ref={productDetailsRef} className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-8">
              {/* Product Header */}
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {searchResult.namaProduk}
                </h3>
                <div className="w-24 h-1 bg-gradient-to-r from-[#17A2B8] to-[#9370DB] mx-auto rounded-full"></div>
              </div>



              {/* Composition Section */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-[#17A2B8] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Komposisi</h4>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-[#17A2B8] to-[#45D2E8]">
                        <tr>
                          <th className="px-6 py-4 text-left text-white font-semibold">Bahan</th>
                          <th className="px-6 py-4 text-left text-white font-semibold">Fungsi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {searchResult.komposisi.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                              {item.nama}
                            </td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                              {item.fungsi}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Recommendations and Warnings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-xl font-semibold text-green-800 dark:text-green-300">Anjuran</h4>
                  </div>
                  <ul className="space-y-2">
                    {searchResult.anjuran.map((item, index) => (
                      <li key={index} className="flex items-start text-green-700 dark:text-green-300 text-sm">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h4 className="text-xl font-semibold text-red-800 dark:text-red-300">Larangan</h4>
                  </div>
                  <ul className="space-y-2">
                    {searchResult.larangan.map((item, index) => (
                      <li key={index} className="flex items-start text-red-700 dark:text-red-300 text-sm">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sources Section */}
              {searchResult.sources && searchResult.sources.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-[#9370DB] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Sumber Referensi</h4>
                  </div>
                  <div className="grid gap-2">
                    {searchResult.sources.map((source, index) => (
                      <a
                        key={index}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 border border-blue-200 dark:border-blue-800"
                      >
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="text-blue-700 dark:text-blue-300 text-sm truncate">{source}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{backgroundColor: 'rgba(245, 240, 240, 0.64)'}}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3 shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 dark:text-white">Memuat data produk...</span>
          </div>
        </div>
      )}

    </div>
  );
}
