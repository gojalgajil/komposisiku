import Header from "../components/Header";

export default function PadukanProduk() {
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
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Halaman untuk memadukan produk akan segera tersedia.
          </p>
        </div>
      </main>
    </div>
  );
}
