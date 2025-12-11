export interface Product {
  namaProduk: string;
  merk: string;
  noBPOM: string;
  komposisi: {
    nama: string;
    fungsi: string;
  }[];
  anjuran: string[];
  larangan: string[];
}

export const dummyProducts: Product[] = [
  {
    namaProduk: "PANADOL EXTRA",
    merk: "PANADOL EXTRA",
    noBPOM: "DBL9424502004A1",
    komposisi: [
      {
        nama: "PARACETAMOL",
        fungsi: "Mengurangi rasa sakit, menurunkan demam"
      },
      {
        nama: "CAFFEINE", 
        fungsi: "Membantu paracetamol bekerja lebih kuat dan cepat, membuat lebih 'melek' saat sakit kepala"
      }
    ],
    anjuran: [
      "Boleh diminum saat sakit kepala atau nyeri ringan-sedang",
      "Boleh diminum setelah makan kalau mudah mual"
    ],
    larangan: [
      "Jangan diminum bersama kopi, teh kuat, atau minuman berenergi (karena ada kafein)",
      "Jangan diminum lebih dari dosis harian",
      "Jangan dikombinasikan dengan obat lain yang mengandung paracetamol",
      "Jangan dipakai kalau punya masalah hati serius",
      "Jangan digunakan jangka panjang tanpa anjuran dokter",
      "Hindari diminum dekat waktu tidur (bisa bikin susah tidur)",
      "Tidak dianjurkan untuk anak kecil"
    ]
  },
  {
    namaProduk: "TOLAK ANGIN",
    merk: "Tolak Angin (Obat Herbal Terstandar)",
    noBPOM: "HT122600301E",
    komposisi: [
      {
        nama: "Amomi Compacti Fructus",
        fungsi: "buah kapulaga untuk membantu hangatkan tubuh"
      },
      {
        nama: "Caryophylli Folium", 
        fungsi: "daun cengkih sebagai penghangat"
      },
      {
        nama: "Centellae Asiaticae Herba", 
        fungsi: "pegagan untuk membantu daya tahan"
      },
      {
        nama: "Cinnamomi Burmanii Cortex", 
        fungsi: "kayu manis untuk rasa hangat), Foeniculi Vulgare Fructus (adas untuk meredakan kembung"
      },
      {
        nama: "Isorae Fructus", 
        fungsi: "bisbul untuk pencernaan"
      },
      {
        nama: "Menthae Arvensidis Herba", 
        fungsi: "daun mint untuk rasa segar"
      },
      {
        nama: "Myristicae Fragrantis Semen", 
        fungsi: "pala untuk mengurangi mual"
      },
      {
        nama: "Oryzae Sativae Semen", 
        fungsi: "beras untuk menetralkan"
      },
      {
        nama: "Parkiae Semen", 
        fungsi: "biji kedawung untuk lambung"
      },
      {
        nama: "Usneae Thallus", 
        fungsi: "lumut usnea sebagai antibakteri alami"
      },
      {
        nama: "Zingiberis Officinalis Rhizoma", 
        fungsi: "jahe untuk menghangatkan dan meredakan masuk angin"
      },
    ],
    anjuran: [
      "Boleh diminum saat masuk angin, mual ringan, perut kembung, begadang, atau merasa mau sakit",
      "Bisa diminum setelah makan, atau dicampur air hangat kalau mau lebih nyaman",
      "Cocok dipakai sebagai pertolongan awal gejala masuk angin"
    ],
    larangan: [
      "Jangan diminum berlebihan dalam sehari",
      "Jangan dipakai sebagai pengganti obat dokter kalau gejala berat atau tidak membaik",
      "Jangan diminum saat perut benar-benar kosong kalau kamu sensitif terhadap jahe atau bahan yang menghangatkan",
      "Kalau lagi hamil atau punya alergi herbal tertentu, sebaiknya hindari dulu kecuali sudah tanya tenaga medis"
    ]
  }
];
