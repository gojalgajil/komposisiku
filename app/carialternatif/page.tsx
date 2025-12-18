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

  const exportToPNG = async () => {
    if (!searchResult) {
      console.error('No search result to export');
      return;
    }

    try {
      // Create canvas for programmatic text rendering
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Canvas dimensions
      const width = 800;
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
      ctx.fillText('Alternatif untuk', width / 2, y);
      y += 35;

      ctx.fillStyle = '#17a2b8';
      ctx.fillText(`"${searchResult.originalProduct}"`, width / 2, y);
      y += 30;

      // Line under header
      ctx.strokeStyle = '#17a2b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 40, y);
      ctx.lineTo(width / 2 + 40, y);
      ctx.stroke();
      y += 15;

      // Alternatives section
      // ctx.fillStyle = '#111827';
      // ctx.font = 'bold 18px Arial';
      // ctx.textAlign = 'left';
      // ctx.fillText('Alternatif Produk', padding, y);
      // y += 30;

      searchResult.alternatives.forEach((alt, index) => {
        // Fixed height for all product boxes (uniform grid)
        const borderPadding = 20;
        const fixedBoxHeight = 200;
        const startY = y;

        // Product border (black grid) - uniform height
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding - borderPadding, startY - borderPadding, contentWidth + borderPadding * 2, fixedBoxHeight);

        // Reset y for content positioning
        y = startY;

        // Brand (Merk)
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Merk: ${alt.merek}`, padding, y);
        y += 25;

        // Product name
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 17px Arial';
        ctx.fillText(alt.nama, padding, y);

        // Price badge
        let badgeColor = '#dcfce7';
        let badgeTextColor = '#166534';
        if (alt.harga === 'sedang') {
          badgeColor = '#fef3c7';
          badgeTextColor = '#92400e';
        } else if (alt.harga === 'mahal') {
          badgeColor = '#fee2e2';
          badgeTextColor = '#991b1b';
        }

        const badgeWidth = 75;
        const badgeX = contentWidth - badgeWidth + padding - 10;
        ctx.fillStyle = badgeColor;
        ctx.fillRect(badgeX, y - 10, badgeWidth, 22);
        ctx.fillStyle = badgeTextColor;
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        const priceText = alt.harga === 'murah' ? 'Lebih Murah' :
                         alt.harga === 'sedang' ? 'Harga Sama' :
                         'Lebih Mahal';
        ctx.fillText(priceText, badgeX + badgeWidth / 2, y + 1);
        ctx.textAlign = 'left';
        y += 35;

        // Pros and cons - fixed layout within box
        const sectionMargin = 10;
        const halfWidth = (contentWidth - sectionMargin) / 2;

        // Pros section
        ctx.fillStyle = '#166534';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Keunggulan:', padding + sectionMargin, y);

        ctx.font = '11px Arial';
        const prosLines = wrapText(ctx, alt.keunggulan, halfWidth - 15, 13);
        let prosY = y + 18;
        // Limit to 3 lines max to fit in box
        const displayProsLines = prosLines.slice(0, 3);
        displayProsLines.forEach(line => {
          ctx.fillText(line, padding + sectionMargin, prosY);
          prosY += 15;
        });

        // Cons section
        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 12px Arial';
        const consX = padding + halfWidth + sectionMargin;
        ctx.fillText('Keterbatasan:', consX, y);

        ctx.font = '11px Arial';
        const consLines = wrapText(ctx, alt.keterbatasan, halfWidth - 15, 13);
        let consY = y + 18;
        // Limit to 3 lines max to fit in box
        const displayConsLines = consLines.slice(0, 3);
        displayConsLines.forEach(line => {
          ctx.fillText(line, consX, consY);
          consY += 15;
        });

        // Move to next product with tighter spacing
        y = startY + fixedBoxHeight + 12;
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
          const file = new File([blob], `alternatif-${searchResult.originalProduct}-details.png`, { type: 'image/png' });

          await navigator.share({
            files: [file],
            title: `Alternatif Produk: ${searchResult.originalProduct}`,
            text: `Alternatif produk untuk: ${searchResult.originalProduct}`,
          });
          return;
        } catch (shareError) {
          console.log('Native sharing failed, falling back to download', shareError);
        }
      }

      const link = document.createElement('a');
      link.download = `alternatif-${searchResult.originalProduct}-details.png`;
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
      const html2pdf = (await import('html2pdf.js')).default;
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '10px';
      tempDiv.style.left = '10px';
      tempDiv.style.width = '800px';
      tempDiv.style.minHeight = '1200px';
      tempDiv.style.padding = '40px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.color = 'black';
      tempDiv.style.zIndex = '9999';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.boxSizing = 'border-box';
      tempDiv.style.borderRadius = '16px';
      tempDiv.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
      tempDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';

      // Create content with simple inline styles
      const contentDiv = document.createElement('div');
      contentDiv.style.width = '600px';
      contentDiv.style.padding = '32px';
      contentDiv.style.backgroundColor = 'white';
      contentDiv.style.color = 'black';
      contentDiv.style.fontFamily = 'Arial, sans-serif';
      contentDiv.style.lineHeight = '1.5';

      // Create all content elements
      const headerDiv = document.createElement('div');
      headerDiv.style.textAlign = 'center';
      headerDiv.style.marginBottom = '32px';

      const titleH3 = document.createElement('h3');
      titleH3.style.fontSize = '28px';
      titleH3.style.fontWeight = '700';
      titleH3.style.color = '#111827';
      titleH3.style.marginBottom = '8px';
      titleH3.textContent = 'Alternatif untuk';

      const subTitleH3 = document.createElement('h3');
      subTitleH3.style.fontSize = '28px';
      subTitleH3.style.fontWeight = '700';
      subTitleH3.style.color = '#17a2b8';
      subTitleH3.style.marginBottom = '16px';
      subTitleH3.textContent = `"${searchResult.originalProduct}"`;

      const lineDiv = document.createElement('div');
      lineDiv.style.width = '80px';
      lineDiv.style.height = '3px';
      lineDiv.style.backgroundColor = '#17a2b8';
      lineDiv.style.margin = '0 auto';
      lineDiv.style.borderRadius = '2px';

      headerDiv.appendChild(titleH3);
      headerDiv.appendChild(subTitleH3);
      headerDiv.appendChild(lineDiv);

      // Alternatives section
      const alternativesDiv = document.createElement('div');
      alternativesDiv.style.marginBottom = '32px';

      const altTitleDiv = document.createElement('div');
      altTitleDiv.style.display = 'flex';
      altTitleDiv.style.alignItems = 'center';
      altTitleDiv.style.marginBottom = '16px';

      // Title removed as requested

      searchResult.alternatives.forEach((alt, index) => {
        const altItemDiv = document.createElement('div');
        altItemDiv.style.backgroundColor = 'white';
        altItemDiv.style.border = '1px solid #d1d5db';
        altItemDiv.style.borderRadius = '12px';
        altItemDiv.style.padding = '20px';
        altItemDiv.style.marginBottom = '16px';

        const altHeader = document.createElement('div');
        altHeader.style.display = 'flex';
        altHeader.style.justifyContent = 'space-between';
        altHeader.style.alignItems = 'flex-start';
        altHeader.style.marginBottom = '16px';

        const altInfo = document.createElement('div');
        const altName = document.createElement('h5');
        altName.style.fontSize = '20px';
        altName.style.fontWeight = '600';
        altName.style.color = '#111827';
        altName.style.marginBottom = '4px';
        altName.textContent = alt.nama;

        const altBrand = document.createElement('p');
        altBrand.style.fontSize = '14px';
        altBrand.style.fontWeight = '600';
        altBrand.style.color = '#374151';
        altBrand.style.marginBottom = '4px';
        altBrand.textContent = `Merk : ${alt.merek}`;

        const altPrice = document.createElement('span');
        altPrice.style.padding = '4px 12px';
        altPrice.style.borderRadius = '20px';
        altPrice.style.fontSize = '12px';
        altPrice.style.fontWeight = '600';
        if (alt.harga === 'murah') {
          altPrice.style.backgroundColor = '#dcfce7';
          altPrice.style.color = '#166534';
        } else if (alt.harga === 'sedang') {
          altPrice.style.backgroundColor = '#fef3c7';
          altPrice.style.color = '#92400e';
        } else {
          altPrice.style.backgroundColor = '#fee2e2';
          altPrice.style.color = '#991b1b';
        }
        const priceLabel = alt.harga === 'murah' ? 'Lebih Murah' :
                          alt.harga === 'sedang' ? 'Harga Sama' :
                          'Lebih Mahal';
        altPrice.textContent = priceLabel;

        altInfo.appendChild(altBrand);
        altInfo.appendChild(altName);
        altHeader.appendChild(altInfo);
        altHeader.appendChild(altPrice);
        altItemDiv.appendChild(altHeader);

        // Pros and cons grid
        const gridDiv = document.createElement('div');
        gridDiv.style.display = 'grid';
        gridDiv.style.gridTemplateColumns = '1fr 1fr';
        gridDiv.style.gap = '16px';

        const prosDiv = document.createElement('div');
        prosDiv.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
        prosDiv.style.padding = '16px';
        prosDiv.style.borderRadius = '12px';
        prosDiv.style.border = '1px solid #bbf7d0';

        const prosTitle = document.createElement('h6');
        prosTitle.style.fontSize = '14px';
        prosTitle.style.fontWeight = '600';
        prosTitle.style.color = '#166534';
        prosTitle.style.marginBottom = '8px';
        prosTitle.textContent = 'Keunggulan';

        const prosText = document.createElement('p');
        prosText.style.fontSize = '13px';
        prosText.style.color = '#166534';
        prosText.textContent = alt.keunggulan;

        prosDiv.appendChild(prosTitle);
        prosDiv.appendChild(prosText);

        const consDiv = document.createElement('div');
        consDiv.style.background = 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
        consDiv.style.padding = '16px';
        consDiv.style.borderRadius = '12px';
        consDiv.style.border = '1px solid #fecaca';

        const consTitle = document.createElement('h6');
        consTitle.style.fontSize = '14px';
        consTitle.style.fontWeight = '600';
        consTitle.style.color = '#991b1b';
        consTitle.style.marginBottom = '8px';
        consTitle.textContent = 'Keterbatasan';

        const consText = document.createElement('p');
        consText.style.fontSize = '13px';
        consText.style.color = '#991b1b';
        consText.textContent = alt.keterbatasan;

        consDiv.appendChild(consTitle);
        consDiv.appendChild(consText);

        gridDiv.appendChild(prosDiv);
        gridDiv.appendChild(consDiv);
        altItemDiv.appendChild(gridDiv);

        alternativesDiv.appendChild(altItemDiv);
      });

      // Simple footer
      const footerDiv = document.createElement('div');
      footerDiv.style.marginTop = '32px';
      footerDiv.style.paddingTop = '24px';
      footerDiv.style.borderTop = '1px solid #e5e7eb';
      footerDiv.style.textAlign = 'center';
      footerDiv.style.color = '#9ca3af';
      footerDiv.style.fontSize = '10px';
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

      // Create conditional content
      let recDiv: HTMLDivElement | null = null;
      let sourcesDivElement: HTMLDivElement | null = null;

      // Recommendations section
      if (searchResult.saran && searchResult.saran.length > 0) {
        recDiv = document.createElement('div');
        recDiv.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
        recDiv.style.padding = '20px';
        recDiv.style.borderRadius = '12px';
        recDiv.style.border = '1px solid #bfdbfe';
        recDiv.style.marginBottom = '24px';

        const recTitle = document.createElement('h4');
        recTitle.style.fontSize = '16px';
        recTitle.style.fontWeight = '600';
        recTitle.style.color = '#1e40af';
        recTitle.style.marginBottom = '12px';
        recTitle.textContent = 'Saran Pemilihan';

        const recList = document.createElement('ul');
        recList.style.listStyle = 'none';
        recList.style.padding = '0';
        recList.style.margin = '0';

        searchResult.saran.forEach(item => {
          const li = document.createElement('li');
          li.style.display = 'flex';
          li.style.alignItems = 'flex-start';
          li.style.marginBottom = '6px';

          const bullet = document.createElement('span');
          bullet.style.width = '6px';
          bullet.style.height = '6px';
          bullet.style.backgroundColor = '#3b82f6';
          bullet.style.borderRadius = '50%';
          bullet.style.marginTop = '6px';
          bullet.style.marginRight = '12px';
          bullet.style.flexShrink = '0';

          const text = document.createElement('span');
          text.style.color = '#1e40af';
          text.style.fontSize = '13px';
          text.textContent = item;

          li.appendChild(bullet);
          li.appendChild(text);
          recList.appendChild(li);
        });

        recDiv.appendChild(recTitle);
        recDiv.appendChild(recList);
      }

      // Sources section
      if (searchResult.sources && searchResult.sources.length > 0) {
        sourcesDivElement = document.createElement('div');
        sourcesDivElement.style.marginTop = '24px';
        sourcesDivElement.style.paddingTop = '24px';
        sourcesDivElement.style.borderTop = '1px solid #e5e7eb';

        const sourcesTitle = document.createElement('h4');
        sourcesTitle.style.fontSize = '16px';
        sourcesTitle.style.fontWeight = '600';
        sourcesTitle.style.color = '#111827';
        sourcesTitle.style.marginBottom = '12px';
        sourcesTitle.textContent = 'Sumber Referensi';

        const sourcesList = document.createElement('div');
        sourcesList.style.display = 'grid';
        sourcesList.style.gap = '6px';

        searchResult.sources.forEach(source => {
          const sourceDiv = document.createElement('div');
          sourceDiv.style.display = 'flex';
          sourceDiv.style.alignItems = 'center';
          sourceDiv.style.padding = '8px';
          sourceDiv.style.background = 'linear-gradient(90deg, #f3f4f6 0%, #e0e7ff 100%)';
          sourceDiv.style.borderRadius = '6px';

          const sourceText = document.createElement('span');
          sourceText.style.color = '#4338ca';
          sourceText.style.fontSize = '11px';
          sourceText.style.wordBreak = 'break-all';
          sourceText.textContent = source;

          sourceDiv.appendChild(sourceText);
          sourcesList.appendChild(sourceDiv);
        });

        sourcesDivElement.appendChild(sourcesTitle);
        sourcesDivElement.appendChild(sourcesList);
      }

      // Append all content in correct order
      contentDiv.appendChild(headerDiv);
      contentDiv.appendChild(alternativesDiv);
      if (recDiv) contentDiv.appendChild(recDiv);
      if (sourcesDivElement) contentDiv.appendChild(sourcesDivElement);
      contentDiv.appendChild(footerDiv);

      tempDiv.appendChild(contentDiv);

      document.body.appendChild(tempDiv);

      try {
        tempDiv.style.visibility = 'visible';
        tempDiv.style.position = 'absolute';
        tempDiv.style.top = '0';
        tempDiv.style.left = '0';
        tempDiv.style.zIndex = '9999';

        console.log('PDF temp div content:', tempDiv.innerHTML);
        console.log('PDF temp div dimensions:', tempDiv.offsetWidth, tempDiv.offsetHeight);

        await new Promise(resolve => setTimeout(resolve, 300));

        const opt = {
          margin: 0.5,
          filename: `alternatif-${searchResult.originalProduct}-details.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            width: tempDiv.offsetWidth,
            height: tempDiv.offsetHeight
          },
          jsPDF: {
            unit: 'in',
            format: 'a4',
            orientation: 'portrait' as const,
            compress: true
          }
        };

        await html2pdf().set(opt).from(tempDiv).save();
        console.log('PDF generated successfully');

      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
      } finally {
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Maaf, terjadi kesalahan saat mengexport PDF. Silakan coba lagi atau gunakan screenshot manual.');
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
          <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div ref={resultRef} className="bg-[#def5fa] rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="p-8">
                {/* Product Header */}
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Alternatif untuk
                  </h3>
                  <h3 className="text-3xl font-bold text-[#17A2B8] dark:text-[#17A2B8] mb-4">
                    "{searchResult.originalProduct}"
                  </h3>
                  <div className="w-24 h-1 bg-gradient-to-r from-[#17A2B8] to-[#9370DB] mx-auto rounded-full"></div>
                </div>

                {/* Alternatives List */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-[#17A2B8] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Alternatif Produk</h4>
                  </div>
                  <div className="space-y-6">
                    {searchResult.alternatives.map((alt, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start items-center mb-4">
                          <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Merk : {alt.merek}
                            </p>
                            <h5 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {alt.nama}
                            </h5>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            alt.harga === 'murah' ? 'bg-green-100 text-green-800' :
                            alt.harga === 'sedang' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {alt.harga === 'murah' ? 'Lebih Murah' :
                             alt.harga === 'sedang' ? 'Harga Sama' :
                             'Lebih Mahal'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                            <div className="flex items-center mb-3">
                              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <h6 className="font-semibold text-green-800 dark:text-green-300">Keunggulan</h6>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300">{alt.keunggulan}</p>
                          </div>
                          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                            <div className="flex items-center mb-3">
                              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <h6 className="font-semibold text-orange-800 dark:text-orange-300">Keterbatasan</h6>
                            </div>
                            <p className="text-sm text-orange-700 dark:text-orange-300">{alt.keterbatasan}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {searchResult.saran && searchResult.saran.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
                    <div className="flex items-center mb-4">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-xl font-semibold text-blue-800 dark:text-blue-300">Saran Pemilihan</h4>
                    </div>
                    <ul className="space-y-2">
                      {searchResult.saran.map((saran, index) => (
                        <li key={index} className="flex items-start text-blue-700 dark:text-blue-300 text-sm">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {saran}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources Section */}
                {searchResult.sources && searchResult.sources.length > 0 && (
                  <div className="bg-[#faf9f0] dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
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
                <div className="flex justify-end">
                  <div className="flex gap-3">
                    <button
                      onClick={exportToPNG}
                      className="flex items-center w-fit px-4 py-2 bg-[#17A2B8] hover:bg-[#45D2E8] text-white text-sm rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                      title="Export sebagai PNG"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export Image
                    </button>

                    <button
                      onClick={exportToPDF}
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
