"use client";

import Image from "next/image";
import Header from "./components/Header";
import { useState } from "react";
import { Product } from "./types/product";
import { getProductDetails, analyzeProductImage } from "./lib/gemini";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setSearchResult(null);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getProductDetails(searchTerm);
      setSearchResult(result);
    } catch (error) {
      console.error("Error getting product details:", error);
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
        <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 uppercase">
                {searchResult.namaProduk}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{backgroundColor: 'rgba(245, 240, 240, 0.64)'}}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3 shadow-lg">
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
