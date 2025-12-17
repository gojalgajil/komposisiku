export interface ProductCombination {
  produk1: string;
  produk2: string;
  status: "aman" | "berisiko" | "tidak_direkomendasikan";
  deskripsi: string;
  efekSamping?: string[];
  anjuran?: string[];
}

export const dummyCombinations: ProductCombination[] = [
  {
    produk1: "Madu TJ",
    produk2: "Tolak Angin",
    status: "aman",
    deskripsi: "Kombinasi madu dan herbal aman dikonsumsi bersamaan. Madu dapat membantu menenangkan tenggorokan sementara Tolak Angin membantu meredakan gejala masuk angin.",
    anjuran: [
      "Konsumsi Tolak Angin sesuai kebutuhan",
      "Madu dapat diminum 1-2 sendok makan per hari",
      "Berikan jeda 30 menit antara konsumsi jika perlu"
    ]
  },
  {
    produk1: "Vitamin C",
    produk2: "Jeruk Nipis",
    status: "aman",
    deskripsi: "Kombinasi vitamin C dan jeruk nipis aman dan saling melengkapi. Keduanya kaya akan vitamin C dan antioksidan.",
    anjuran: [
      "Konsumsi vitamin C sesuai dosis anjuran",
      "Jeruk nipis dapat dicampur dengan air hangat",
      "Hindari konsumsi berlebihan untuk mencegah asam lambung naik"
    ]
  },
  {
    produk1: "Paracetamol",
    produk2: "Kopi",
    status: "berisiko",
    deskripsi: "Kombinasi paracetamol dan kopi dapat meningkatkan risiko kerusakan hati. Keduanya dimetabolisme oleh hati.",
    efekSamping: [
      "Meningkatkan risiko kerusakan hati",
      "Dapat menyebabkan gelisah",
      "Meningkatkan denyut jantung"
    ],
    anjuran: [
      "Hindari konsumsi kopi 2 jam sebelum dan sesudah paracetamol",
      "Pertimbangkan alternatif penghilang nyeri non-kafein",
      "Konsultasikan dengan dokter jika perlu konsumsi bersamaan"
    ]
  },
  {
    produk1: "Antibiotik",
    produk2: "Yogurt",
    status: "tidak_direkomendasikan",
    deskripsi: "Yogurt dapat mengurangi efektivitas beberapa antibiotik karena kandungan probiotik dan kalsiumnya.",
    efekSamping: [
      "Mengurangi absorpsi antibiotik",
      "Dapat menyebabkan diare",
      "Mengganggu keseimbangan bakteri usus"
    ],
    anjuran: [
      "Hindari konsumsi yogurt 2 jam sebelum dan sesudah antibiotik",
      "Tunggu minimal 2-3 jam setelah konsumsi antibiotik",
      "Pilih probiotik terpisah jika diperlukan"
    ]
  },
  {
    produk1: "Teh Hijau",
    produk2: "Iron Supplement",
    status: "tidak_direkomendasikan",
    deskripsi: "Teh hijau mengandung tanin yang dapat menghambat absorpsi zat besi.",
    efekSamping: [
      "Mengurangi absorpsi zat besi hingga 60%",
      "Dapat menyebabkan anemia jika dikonsumsi jangka panjang",
      "Mengurangi efektivitas suplemen zat besi"
    ],
    anjuran: [
      "Hindari konsumsi teh 1 jam sebelum dan sesudah suplemen zat besi",
      "Pilih teh tanpa tanin seperti teh herbal",
      "Konsumsi vitamin C bersama zat besi untuk meningkatkan absorpsi"
    ]
  },
  {
    produk1: "Ginseng",
    produk2: "Warfarin",
    status: "berisiko",
    deskripsi: "Ginseng dapat mengurangi efektivitas warfarin dan meningkatkan risiko pembekuan darah.",
    efekSamping: [
      "Meningkatkan risiko trombosis",
      "Dapat menyebabkan stroke",
      "Mengurangi efek pengencer darah"
    ],
    anjuran: [
      "Hindari konsumsi ginseng saat menggunakan warfarin",
      "Informasikan dokter tentang konsumsi herbal",
      "Pantau INR secara rutin jika harus konsumsi bersamaan"
    ]
  },
  {
    produk1: "Jahe",
    produk2: "Aspirin",
    status: "aman",
    deskripsi: "Jahe dan aspirin memiliki efek antiinflamasi yang saling melengkapi dengan risiko minimal.",
    anjuran: [
      "Konsumsi jahe dalam jumlah moderat",
      "Monitor efek samping gastrointestinal",
      "Hindari dosis jahe berlebihan"
    ]
  },
  {
    produk1: "Kunyit",
    produk2: "Antiinflamasi NSAID",
    status: "berisiko",
    deskripsi: "Kunyit dapat meningkatkan risiko perdarahan gastrointestinal saat dikombinasikan dengan NSAID.",
    efekSamping: [
      "Meningkatkan risiko perdarahan lambung",
      "Dapat menyebabkan iritasi gastrointestinal",
      "Meningkatkan efek samping NSAID"
    ],
    anjuran: [
      "Hindari konsumsi kunyit dosis tinggi dengan NSAID",
      "Monitor tanda-tanda perdarahan",
      "Pertimbangkanassin alternatif penghilang nyeri"
    ]
  }
];
