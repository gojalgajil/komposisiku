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

export interface ProductCombination {
  produk1: string;
  produk2: string;
  hasil: {
    status: "aman" | "berisiko";
    kesimpulan: string;
    detailAnalisis: string[];
    anjuranPemakaian: string[];
    efekSamping: string[];
  };
}

export const dummyCombinations: ProductCombination[] = [
  {
    produk1: "Skintific Retinol Renewal Serum",
    produk2: "Some By Mi AHA BHA PHA 30 Days Toner",
    hasil: {
      status: "berisiko",
      kesimpulan: "Kombinasi ini berisiko tinggi dan tidak disarankan digunakan bersamaan, terutama untuk pemula atau kulit sensitif.",
      detailAnalisis: [
        "Retinol (Skintific) dan AHA/BHA/PHA (Some By Mi) adalah bahan aktif kuat yang sama-sama bekerja eksfoliasi",
        "Menggunakan keduanya bersamaan dapat menyebabkan iritasi berlebih, kering, dan sensitif",
        "Retinol meningkatkan sensitivitas kulit terhadap sinar matahari, AHA/BHA juga membuat kulit lebih rentan",
        "Kombinasi ini bisa menyebabkan 'retinoid dermatitis' atau iritasi berat"
      ],
      anjuranPemakaian: [
        "Pisahkan pemakaian: pagi gunakan AHA/BHA/PHA, malam gunakan retinol",
        "Atau gunakan pada hari yang berbeda (selang-seling hari)",
        "Gunakan sunscreen SPF 30+ minimal dan gunakan moisturizer yang baik",
        "Mulai dengan konsentrasi rendah dan frekuensi jarang"
      ],
      efekSamping: [
        "Iritasi, kemerahan, dan rasa perih",
        "Kulit kering dan mengelupas berlebihan",
        "Sensitif terhadap produk lain",
        "Peningkatan risiko sunburn",
        "Breakout atau purging parah"
      ]
    }
  }
];

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
