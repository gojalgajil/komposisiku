"use client";

import { useState, useRef, useEffect } from "react";
import Header from "../components/Header";
import html2canvas from "html2canvas";

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

  // Helper function to format product name to proper capitalization
  const formatProductName = (name: string): string => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => {
        // Handle special cases like apostrophes
        if (word.includes("'")) {
          const parts = word.split("'");
          return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join("'");
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

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

  // Function to extract domain from URL
  const extractDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol + '//' + urlObj.hostname;
    } catch {
      return url;
    }
  };

  const exportToPNG = async () => {
    if (!searchResult) {
      console.error('No search result to export');
      return;
    }

    try {
      // Create canvas for programmatic text rendering
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Canvas dimensions - clean structure
      const width = 800;
      const padding = 40; // Standard padding
      const contentWidth = width - (padding * 2);
      const lineSpacing = 16; // Reduced from 20
      const sectionSpacing = 20; // Reduced from 30
      
      canvas.width = width;
      canvas.height = 3000; // Start with larger height for safety

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, canvas.height);

      // Font settings
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';

      let y = padding + 20; // Reset to normal top spacing

      // === HEADER SECTION ===
      ctx.font = 'bold 26px Arial';
      ctx.fillText('Alternatif untuk', width / 2, y);
      y += 30; // INCREASED spacing between "Alternatif untuk" and product name

      ctx.fillStyle = '#17a2b8';
      ctx.fillText(`"${formatProductName(searchResult.originalProduct)}"`, width / 2, y);
      y += lineSpacing + 20; // INCREASED spacing between product name and first product

      // === PRODUCTS SECTION ===
      ctx.textAlign = 'left';
      
      searchResult.alternatives.forEach((alt, index) => {
        // Product box dimensions
        const boxPadding = 15;
        const boxHeight = 160; // Reduced from 180
        const boxStartY = y;
        
        // Draw product box
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding - boxPadding, boxStartY - boxPadding, contentWidth + boxPadding * 2, boxHeight);
        
        // Reset Y for content
        y = boxStartY;
        
        // === BRAND ===
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Merk: ${alt.merek}`, padding, y);
        y += lineSpacing;
        
        // === PRODUCT NAME ===
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 17px Arial';
        
        // Smart text wrapping for product name
        const maxNameWidth = contentWidth - 120; // Leave space for price badge
        const nameLines = wrapText(ctx, alt.nama, maxNameWidth, 17);
        
        nameLines.forEach((line, lineIndex) => {
          ctx.fillText(line, padding, y + (lineIndex * lineSpacing));
        });
        
        y += (nameLines.length * lineSpacing) + 5;
        
        // === PRICE BADGE ===
        const badgeWidth = 80;
        const badgeHeight = 22;
        const badgeX = width - padding - badgeWidth;
        const badgeY = boxStartY + 10;
        
        // Badge colors
        let badgeColor = '#dcfce7';
        let badgeTextColor = '#166534';
        if (alt.harga === 'sedang') {
          badgeColor = '#fef3c7';
          badgeTextColor = '#92400e';
        } else if (alt.harga === 'mahal') {
          badgeColor = '#fee2e2';
          badgeTextColor = '#991b1b';
        }
        
        // Draw badge
        ctx.fillStyle = badgeColor;
        ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
        ctx.fillStyle = badgeTextColor;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        const priceText = alt.harga === 'murah' ? 'Lebih Murah' :
                         alt.harga === 'sedang' ? 'Harga Sama' :
                         'Lebih Mahal';
        ctx.fillText(priceText, badgeX + badgeWidth / 2, badgeY + 14);
        ctx.textAlign = 'left';
        
        // === PROS & CONS ===
        const columnWidth = (contentWidth - 20) / 2;
        const prosX = padding;
        const consX = padding + columnWidth + 20;
        
        // Pros
        ctx.fillStyle = '#166534';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Keunggulan:', prosX, y);
        y += lineSpacing;
        
        ctx.fillStyle = '#374151';
        ctx.font = '11px Arial';
        const prosLines = wrapText(ctx, alt.keunggulan, columnWidth - 10, 11);
        prosLines.slice(0, 3).forEach((line, lineIndex) => {
          ctx.fillText(line, prosX, y + (lineIndex * 14)); // Reduced from 15
        });
        
        // Cons - use same Y as pros
        const consStartY = y - lineSpacing; // Start from same position as pros header
        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Keterbatasan:', consX, consStartY);
        
        ctx.fillStyle = '#374151';
        ctx.font = '11px Arial';
        const consLines = wrapText(ctx, alt.keterbatasan, columnWidth - 10, 11);
        consLines.slice(0, 3).forEach((line, lineIndex) => {
          ctx.fillText(line, consX, consStartY + lineSpacing + (lineIndex * 14)); // Reduced from 15
        });
        
        // Move to next product
        y = boxStartY + boxHeight + 5; // Reduced from 10
      });

      // Recommendations section
      if (searchResult.saran && searchResult.saran.length > 0) {
        y += 25;
        ctx.fillStyle = '#1e40af';
        ctx.font = 'bold 15px Arial';
        ctx.fillText('Saran Pemilihan', padding, y);
        y += 20;

        ctx.fillStyle = '#1e40af';
        ctx.font = '12px Arial';
        searchResult.saran.forEach(item => {
          const itemLines = wrapText(ctx, '• ' + item, contentWidth - 20, 14);
          itemLines.forEach(line => {
            ctx.fillText(line, padding + 10, y);
            y += 16;
          });
        });
      }

      // Sources section
      if (searchResult.sources && searchResult.sources.length > 0) {
        y += 25;
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 15px Arial';
        ctx.fillText('Sumber Referensi', padding, y);
        y += 20;

        ctx.fillStyle = '#4338ca';
        ctx.font = '11px Arial';
        searchResult.sources.forEach(source => {
          const sourceLines = wrapText(ctx, source, contentWidth - 30, 13);
          sourceLines.forEach(line => {
            ctx.fillText(line, padding + 10, y);
            y += 15;
          });
          y += 5;
        });
      }

      // Footer
      y += 30;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      const footerText = `Dibuat pada ${new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      ctx.fillText(footerText, width / 2, y);
      y += 12;
      ctx.fillText('by KOMPOSISIKU', width / 2, y);

      // Crop canvas to actual content height
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d')!;
      finalCanvas.width = width;
      finalCanvas.height = y + padding;

      finalCtx.drawImage(canvas, 0, 0, width, y + padding, 0, 0, width, y + padding);

      const dataUrl = finalCanvas.toDataURL('image/png', 1.0);

      if (navigator.share) {
        try {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const file = new File([blob], `alternatif-${formatProductName(searchResult.originalProduct)}-details.png`, { type: 'image/png' });

          await navigator.share({
            files: [file],
            title: `Alternatif Produk: ${formatProductName(searchResult.originalProduct)}`,
            text: `Alternatif produk untuk: ${formatProductName(searchResult.originalProduct)}`,
          });
          return;
        } catch (shareError) {
          console.log('Native sharing failed, falling back to download', shareError);
        }
      }

      const link = document.createElement('a');
      link.download = `alternatif-${formatProductName(searchResult.originalProduct)}-details.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    }
  };

  // Helper function to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const exportToPDF = async () => {
    if (!searchResult) {
      console.error('No search result to export');
      return;
    }

    try {
      // Import html2pdf and html2canvas
      const html2pdf = (await import('html2pdf.js')).default;
      const html2canvas = (await import('html2canvas')).default;

      // Find the result container element
      const resultElement = document.querySelector('[data-result-container="true"]') as HTMLElement;
      if (!resultElement) {
        alert('Hasil tidak ditemukan. Silakan coba lagi.');
        return;
      }

      // Take screenshot of the result container using html-to-image
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(resultElement, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        style: {
          // Override problematic styles
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        filter: (node) => {
          // Check if node is a DOM element before using DOM methods
          if (!node || typeof node !== 'object') return false;
          
          // Check if node has getAttribute method (DOM element)
          if (typeof node.getAttribute !== 'function') {
            // If it's not a DOM element, include it by default
            return true;
          }
          
          // It's a DOM element, check for problematic content
          const className = (node as Element).className?.toString() || '';
          const style = (node as Element).getAttribute('style') || '';
          
          // Skip nodes with lab() color functions
          if (style.includes('lab') || className.includes('lab')) {
            return false;
          }
          
          return true;
        },
        cacheBust: true
      });

      // Create a container for the PDF
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '650px'; // Reduced for perfect centering
      tempDiv.style.padding = '25px'; // Reduced padding
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      tempDiv.style.margin = '0 auto'; // Center the container

      // Add the screenshot as an image
      const img = document.createElement('img');
      img.src = dataUrl; // Use dataUrl from html-to-image
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '8px';
      img.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      img.style.display = 'block'; // Ensure block display for proper centering

      tempDiv.appendChild(img);

      // Add footer
      const footerDiv = document.createElement('div');
      footerDiv.style.marginTop = '20px';
      footerDiv.style.textAlign = 'center';
      footerDiv.style.color = '#6b7280';
      footerDiv.style.fontSize = '12px';
      footerDiv.innerHTML = `
        <div>Dibuat pada ${new Date().toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</div>
        <div style="margin-top: 4px;">by KOMPOSISIKU</div>
      `;
      tempDiv.appendChild(footerDiv);

      // PDF generation options - perfect centering
      const opt = {
        margin: [25, 25, 25, 25] as [number, number, number, number], // Balanced margins
        filename: `alternatif-${formatProductName(searchResult.originalProduct).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(tempDiv).save();

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF. Silakan coba lagi atau gunakan fitur export gambar.');
    }
  };

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
        
        <div className="dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex flex-col items-center gap-4">
            <input
              type="text"
              placeholder="Masukkan nama produk..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-[#1CC8E3] text-white rounded-lg hover:bg-[#8B5CF6] transition-colors font-semibold text-sm sm:text-base"
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
          <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div ref={resultRef} data-result-container="true" className="bg-[#def5fa] rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="p-4 sm:p-6 lg:p-8">
                {/* Product Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Alternatif untuk
                  </h3>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#17A2B8] dark:text-[#17A2B8] mb-4">
                    "{formatProductName(searchResult.originalProduct)}"
                  </h3>
                  <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-[#17A2B8] to-[#9370DB] mx-auto rounded-full"></div>
                </div>

                {/* Alternatives List */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#17A2B8] mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h4 className="text-lg sm:text-xl font-semibold text impo-gray-900 dark:text-white">Alternatif Produk</h4>
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    {searchResult.alternatives.map((alt, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start items-center mb-4">
                          <div className="flex-1 text-center sm:text-left">
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Merk : {alt.merek}
                            </p>
                            <h5 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                              {alt.nama}
                            </h5>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold mt-2 sm:mt-0 ${
                            alt.harga === 'murah' ? 'bg-green-100 text-green-800' :
                            alt.harga === 'sedang' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {alt.harga === 'murah' ? 'Lebih Murah' :
                             alt.harga === 'sedang' ? 'Harga Sama' :
                             'Lebih Mahal'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 sm:p-4 border border-green-200 dark:border-green-800">
                            <div className="flex items-center mb-2 sm:mb-3">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <h6 className="font-semibold text-green-800 dark:text-green-300 text-sm sm:text-base">Keunggulan</h6>
                            </div>
                            <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">{alt.keunggulan}</p>
                          </div>
                          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-3 sm:p-4 border border-orange-200 dark:border-orange-800">
                            <div className="flex items-center mb-2 sm:mb-3">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <h6 className="font-semibold text-orange-800 dark:text-orange-300 text-sm sm:text-base">Keterbatasan</h6>
                            </div>
                            <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300">{alt.keterbatasan}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {searchResult.saran && searchResult.saran.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800 mb-4 sm:mb-6">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-lg sm:text-xl font-semibold text-blue-800 dark:text-blue-300">Saran Pemilihan</h4>
                    </div>
                    <ul className="space-y-2">
                      {searchResult.saran.map((saran, index) => (
                        <li key={index} className="flex items-start text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                          <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
                          <span className="break-words">{saran}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources Section */}
                {searchResult.sources && searchResult.sources.length > 0 && (
                  <div className="bg-[#faf9f0] dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#9370DB] mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Sumber Referensi</h4>
                    </div>
                    <div className="grid gap-2">
                      {searchResult.sources.map((source, index) => (
                        <a
                          key={index}
                          href={extractDomain(source)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start sm:items-center p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 border border-blue-200 dark:border-blue-800"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm break-all sm:break-words">{extractDomain(source)}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Buttons - Responsive */}
                <div className="flex flex-col sm:flex-row justify-end mt-4 sm:mt-6 gap-2 sm:gap-3">
                  <button
                    onClick={exportToPNG}
                    className="flex items-center justify-center w-full sm:w-fit px-3 sm:px-4 py-2 bg-[#17A2B8] hover:bg-[#45D2E8] text-white text-xs sm:text-sm rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                    title="Export sebagai PNG"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Image
                  </button>

                  <button
                    onClick={exportToPDF}
                    className="flex items-center justify-center w-full sm:w-fit px-3 sm:px-4 py-2 bg-[#DC2626] hover:bg-[#EF4444] text-white text-xs sm:text-sm rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                    title="Export sebagai PDF"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
