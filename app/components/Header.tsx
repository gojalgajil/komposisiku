"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const isPadukanPage = pathname === "/padukanproduk";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo di kiri */}
          <div className="flex-shrink-0">
            <div className="flex items-center">
              <span className="text-3xl font-black text-[#17A2B8]">KOMPOSISI</span>
              <span className="text-3xl font-black text-[#9370DB]">KU</span>
            </div>
          </div>

          {/* Hamburger menu untuk mobile */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Navigation buttons di kanan - desktop */}
          <nav className="hidden lg:flex space-x-4">
            <Link
              href={isPadukanPage ? "/" : "/padukanproduk"}
              className="px-4 py-2 text-sm font-medium text-[#6D28D9] dark:text-gray-300 bg-[#45D2E8] dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {isPadukanPage ? "Cek Komposisi" : "Padukan Produk"}
            </Link>
            <Link
              href="/konsultasi"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Konsultasi
            </Link>
          </nav>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 space-y-2">
            <Link
              href={isPadukanPage ? "/" : "/padukanproduk"}
              className="block px-4 py-2 text-sm font-medium text-[#6D28D9] dark:text-gray-300 bg-[#00BCD4] dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {isPadukanPage ? "Cek Komposisi" : "Padukan Produk"}
            </Link>
            <Link
              href="/konsultasi"
              className="block px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Konsultasi
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
