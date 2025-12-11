import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo di kiri */}
          <div className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={40}
              className="h-16 w-auto"
              priority
            />
          </div>

          {/* Navigation buttons di kanan */}
          <nav className="flex space-x-4">
            <Link
              href="/cek-komposisi"
              className="px-4 py-2 text-sm font-medium text-[#6D28D9] dark:text-gray-300 bg-[#00BCD4] dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Padukan Produk
            </Link>
            <Link
              href="/konsultasi"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Konsultasi
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
