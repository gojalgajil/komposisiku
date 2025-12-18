"use client";

import { useState, useRef, useEffect } from "react";
import Header from "../components/Header";
import html2canvas from "html2canvas";

export interface ProductCombination {
  produk: string[];
  urutanOptimal: number[];
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

  const removeProductInput = (index: number) => {
    if (productInputs.length > 2) {
      const newInputs = productInputs.filter((_, i) => i !== index);
      setProductInputs(newInputs);
    }
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
      const payload: any = {
        produk1: filledInputs[0].trim(),
        produk2: filledInputs[1].trim()
      };
      
      if (filledInputs[2]) payload.produk3 = filledInputs[2].trim();
      if (filledInputs[3]) payload.produk4 = filledInputs[3].trim();
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/product-combination', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
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

  // Auto-scroll to result when check appears
  useEffect(() => {
    if (checkResult && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [checkResult]);

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
    if (!checkResult) {
      console.error('No check result to export');
      return;
    }

    try {
      // Create canvas for programmatic text rendering
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Canvas dimensions
      const width = 900;
      const padding = 40;
      const contentWidth = width - (padding * 2);
      canvas.width = width;
      canvas.height = 3000; // Start with larger height for safety

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, canvas.height);

      // Font settings
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';

      let y = padding + 50;

      // Header
      ctx.font = 'bold 26px Arial';
      ctx.fillText('Kombinasi Produk', width / 2, y);
      y += 35;

      // Product names
      ctx.fillStyle = '#17a2b8';
      ctx.font = 'bold 20px Arial';
      
      // Split product names to avoid truncation
      const productNames = checkResult.produk;
      productNames.forEach((product, index) => {
        const productText = `"${product}"`;
        ctx.fillText(productText, width / 2, y);
        if (index < productNames.length - 1) {
          y += 25;
          ctx.fillText('+', width / 2, y);
          y += 25;
        }
      });
      y += 30;

      // Status badge
      let statusColor = '#10b981';
      let statusText = 'AMAN DIPADUKAN';
      if (checkResult.status === 'berisiko') {
        statusColor = '#f59e0b';
        statusText = 'BERISIKO';
      } else if (checkResult.status === 'tidak_direkomendasikan') {
        statusColor = '#ef4444';
        statusText = 'TIDAK DIREKOMENDASIKAN';
      }

      // Calculate status badge width based on text
      ctx.font = 'bold 16px Arial';
      const statusTextWidth = ctx.measureText(statusText).width;
      const statusBadgeWidth = Math.max(statusTextWidth + 60, 200); // Add padding and minimum width
      
      ctx.fillStyle = statusColor;
      ctx.fillRect((width - statusBadgeWidth) / 2, y - 15, statusBadgeWidth, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(statusText, width / 2, y + 5);
      y += 40;

      // Description section
      ctx.textAlign = 'left';
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Deskripsi Kombinasi', padding, y);
      y += 30;

      ctx.font = '12px Arial';
      ctx.fillStyle = '#374151';
      
      // Process description with proper spacing between sub-fields
      const descriptionLines = checkResult.deskripsi.split('\n');
      descriptionLines.forEach((line, index) => {
        if (line.trim() === '') {
          y += 10; // Add spacing for empty lines
        } else if (line.includes(':')) {
          // This is a sub-field header like "Mekanisme interaksi:"
          if (index > 0) {
            y += 15; // Add extra spacing before sub-field headers
          }
          const headerLines = wrapText(ctx, line, contentWidth, 14);
          headerLines.forEach(headerLine => {
            ctx.fillText(headerLine, padding + 10, y);
            y += 18;
          });
          y += 8; // Add spacing after sub-field headers
        } else {
          // Regular content line
          const contentLines = wrapText(ctx, line, contentWidth, 14);
          contentLines.forEach(contentLine => {
            ctx.fillText(contentLine, padding + 10, y);
            y += 18;
          });
        }
      });

      // Add extra spacing after description section
      y += 20;

      // Recommendations section
      if (checkResult.hasil.anjuran && checkResult.hasil.anjuran.length > 0) {
        y += 25;
        ctx.fillStyle = '#16a34a';
        ctx.font = 'bold 15px Arial';
        ctx.fillText('Anjuran', padding, y);
        y += 20;

        ctx.font = '12px Arial';
        ctx.fillStyle = '#16a34a';
        checkResult.hasil.anjuran.forEach(item => {
          const itemLines = wrapText(ctx, '• ' + item.replace(/\*/g, ''), contentWidth, 14);
          itemLines.forEach(line => {
            ctx.fillText(line, padding + 10, y);
            y += 18;
          });
        });
        
        // Add extra spacing after Anjuran section
        y += 20;
      }

      // Side effects section
      if (checkResult.hasil.efekSamping && checkResult.hasil.efekSamping.length > 0) {
        y += 25;
        ctx.fillStyle = '#ea4335';
        ctx.font = 'bold 15px Arial';
        ctx.fillText('Efek Samping', padding, y);
        y += 20;

        ctx.font = '12px Arial';
        ctx.fillStyle = '#ea4335';
        checkResult.hasil.efekSamping.forEach(item => {
          const itemLines = wrapText(ctx, '• ' + item.replace(/\*/g, ''), contentWidth, 14);
          itemLines.forEach(line => {
            ctx.fillText(line, padding + 10, y);
            y += 18;
          });
        });
        
        // Add extra spacing after Efek Samping section
        y += 20;
      }

      // Sources section
      if (checkResult.sources && checkResult.sources.length > 0) {
        y += 25;
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 15px Arial';
        ctx.fillText('Sumber Referensi', padding, y);
        y += 20;

        ctx.fillStyle = '#4338ca';
        ctx.font = '11px Arial';
        checkResult.sources.forEach(source => {
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
          const file = new File([blob], `kombinasi-${checkResult.produk.join('-')}-details.png`, { type: 'image/png' });

          await navigator.share({
            files: [file],
            title: `Kombinasi Produk: ${checkResult.produk.join(' + ')}`,
            text: `Analisis kombinasi produk: ${checkResult.produk.join(' + ')}`,
          });
          return;
        } catch (shareError) {
          console.log('Native sharing failed, falling back to download', shareError);
        }
      }

      const link = document.createElement('a');
      link.download = `kombinasi-${checkResult.produk.join('-')}-details.png`;
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
    if (!checkResult) {
      console.error('No check result to export');
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
        filename: `kombinasi-produk-${new Date().toISOString().split('T')[0]}.pdf`,
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
          Padukan Produk
        </h1>
        <h2 className="font-bold text-[#9370DB] dark:text-white mb-8 text-center">
            Kami akan bantu kamu ngecek apakah beberapa produk bisa dipakai bareng tanpa masalah. Tinggal masukin produknya, nanti sistem cek apakah ada kandungan yang bentrok atau justru saling melengkapi.
        </h2>
        
        <div className="dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
            {productInputs.map((product, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Produk ${index + 1}`}
                  value={product}
                  onChange={(e) => handleProductInputChange(index, e.target.value)}
                  className="px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                />
                {index < productInputs.length - 1 && (
                  <span className="text-lg sm:text-xl font-bold text-gray-600 dark:text-gray-400">+</span>
                )}
              </div>
            ))}
            
            {productInputs.length < 4 && (
              <button
                onClick={addProductInput}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#1CC8E3] transition-colors text-sm sm:text-base"
              >
                Tambah produk lagi?
              </button>
            )}
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleCheck}
              className="px-4 py-2 sm:px-6 sm:py-2 bg-[#1CC8E3] text-white rounded-lg hover:bg-[#8B5CF6] transition-colors font-semibold text-sm sm:text-base"
            >
              Cek Kombinasi
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
            <div ref={resultRef} data-result-container="true" className="bg-[#def5fa] rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="p-4 sm:p-6 lg:p-8">
                {/* Product Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Kombinasi Produk
                  </h3>
                  <div className="text-base sm:text-lg font-semibold text-[#17A2B8] dark:text-[#17A2B8] mb-4">
                    {checkResult.produk.map((produk, index) => (
                      <span key={index}>
                        "{produk}"
                        {index < checkResult.produk.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                  <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-[#17A2B8] to-[#9370DB] mx-auto rounded-full"></div>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center mb-6 sm:mb-8">
                  <div className={`inline-block px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-white font-bold text-base sm:text-lg ${
                    checkResult.status === 'aman' ? 'bg-green-500 shadow-green-200 shadow-lg' :
                    checkResult.status === 'berisiko' ? 'bg-yellow-500 shadow-yellow-200 shadow-lg' :
                    'bg-red-500 shadow-red-200 shadow-lg'
                  }`}>
                    {checkResult.status === 'aman' ? 'AMAN DIPADUKAN' :
                     checkResult.status === 'berisiko' ? 'BERISIKO' : 'TIDAK DIREKOMENDASIKAN'}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#17A2B8] mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Deskripsi Kombinasi</h4>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 space-y-3 sm:space-y-4">
                    {checkResult.deskripsi.split('\n').map((point, index) => {
                      let cleanPoint = point.replace(/^•\s*/, '').replace(/\*\*/g, '').replace(/\(point\)\s*/gi, '• ');
                      // Replace * with • for bullet points and remove all remaining * and **
                      cleanPoint = cleanPoint.replace(/^\*\s*/, '• ').replace(/\*/g, '');
                      
                      if (cleanPoint.trim()) {
                        const hasHeader = cleanPoint.includes(':') && !cleanPoint.startsWith('•');
                        const isMainHeader = ['Mekanisme interaksi', 'Dampak klinis', 'Tingkat keparahan', 'Waktu mulai efek', 'Jarak waktu'].some(header => 
                          cleanPoint.startsWith(header + ':')
                        );
                        
                        return (
                          <div key={index} className="text-xs sm:text-sm leading-relaxed">
                            {hasHeader ? (
                              <>
                                {isMainHeader && <div className="border-b border-gray-300 dark:border-gray-600 mb-2"></div>}
                                <span className={`font-semibold text-gray-800 dark:text-gray-200 ${isMainHeader ? 'text-sm sm:text-base' : ''}`}>
                                  {cleanPoint.split(':')[0]}:
                                </span>
                                <div className="text-gray-600 dark:text-gray-300">
                                  {cleanPoint.split(':').slice(1).join(':').trim()}
                                </div>
                              </>
                            ) : (
                              <div className={cleanPoint.startsWith('•') ? 'ml-4' : ''}>
                                {cleanPoint}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 sm:p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-lg sm:text-xl font-semibold text-green-800 dark:text-green-300">Anjuran</h4>
                    </div>
                    <ul className="space-y-2 sm:space-y-3">
                      {checkResult.hasil.anjuran.map((item, index) => (
                        <li key={index} className="flex items-start text-green-700 dark:text-green-300 text-xs sm:text-sm">
                          <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
                          <span className="break-words">{item.replace(/\*/g, '').replace(/\*\*/g, '')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 sm:p-6 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <h4 className="text-lg sm:text-xl font-semibold text-orange-800 dark:text-orange-300">Efek Samping</h4>
                    </div>
                    <ul className="space-y-2 sm:space-y-3">
                      {checkResult.hasil.efekSamping.map((item, index) => (
                        <li key={index} className="flex items-start text-orange-700 dark:text-orange-300 text-xs sm:text-sm">
                          <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
                          <span className="break-words">{item.replace(/\*/g, '').replace(/\*\*/g, '')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sources Section */}
                {checkResult.sources && checkResult.sources.length > 0 && (
                  <div className="bg-[#faf9f0] dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#9370DB] mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Sumber Referensi</h4>
                    </div>
                    <div className="grid gap-2">
                      {checkResult.sources.map((source, index) => (
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
                    className="flex items-center justify-center w-full sm:w-fit px-3 sm:px-4 py-2 bg-[#8B5CF6] hover:bg-[#1CC8E3] text-white text-xs sm:text-sm rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                    title="Export sebagai Image"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Export Image
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center justify-center w-full sm:w-fit px-3 sm:px-4 py-2 bg-[#1CC8E3] hover:bg-[#8B5CF6] text-white text-xs sm:text-sm rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                    title="Export sebagai PDF"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
