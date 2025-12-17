export interface Product {
  id?: string;
  namaProduk: string;
  noBPOM: string;
  produkImage?: string;
  komposisi: {
    nama: string;
    fungsi: string;
  }[];
  anjuran: string[];
  larangan: string[];
  sources?: string[];
}
