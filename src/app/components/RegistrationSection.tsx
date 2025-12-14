"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { PaymentResponse, MidtransResult } from "@/types/midtrans";
import { saveToGoogleSheets } from "../actions/saveToSheet";
import { generateQrDataUrl } from "../utils/generateQrDataUrl";

type VipCategory = "diamond" | "platinum" | "gold" | "";

interface FormData {
  name: string;
  email?: string;
  phone?: string;
  type: "regular" | "vip";
  company?: string;
}

export type TicketType = "regular" | "vip";
interface RegistrationSectionProps {
  onRegisterSuccess: (data: {
    id: string;
    name: string;
    email: string;
    phone: string;
    ticketType: "regular" | "vip";
  }) => void;
}

interface ModalFormProps {
  formData: FormData;
  error: string;
  isLoading: boolean;
  onClose: () => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const VIP_CATEGORY_OPTIONS = [
  { value: "", label: "Pilih kategori" },
  { value: "diamond", label: "Diamond" },
  { value: "platinum", label: "Platinum" },
  { value: "gold", label: "Gold" },
];

const VIP_COMPANIES: Record<VipCategory, string[]> = {
  "": [],
  diamond: [
    "PT Laju Brata",
    "PT Acme Indonesia",
    "PT Golden Pratama Gemilang",
    "PT Intidaya Dinamika Sejati",
    "PT Samsung Electronics Indonesia",
    "PT Bank Negara Indonesia (Persero) Tbk",
    "PT Kebon Agung",
    "PT Aludra Solusi Indonesia",
  ],
  platinum: [
    "PT Cipta Teknik Abadi",
    "PT Energi Lidah Api",
    "PT Megah Inti Lestari - Dart Rich",
    "PT Indo Buana Mas",
    "PT Indo Acidatama, Tbk.",
    "PT Eonchemicals putra",
    "PT Agros Global Indonesia",
    "PT Altrak 1978",
    "PT. Triatra Sinergia Pratama",
    "PT Molindo Raya Indusrtrial, Tbk",
  ],
  gold: [
    "CV Guna Indah",
    "PT Surya Agrimas Nusantara",
    "PT Agro Prima Sentosa",
    "PT Candra Wijaya Sakti",
    "CV Tritunggal Sejahtera Lestari",
    "PT Jalutama Wisesa",
    "PT Asuransi Jasa Tania Tbk.",
    "PT Petrokimia Gresik",
    "PT Peter Cremer Indonesia",
    "CV Mitra Tani",
    "CV Indica Multi Karya",
    "PT PG Rajawali I",
    "PT Arrow Energi",
  ],
};

export default function RegistrationSection({
  onRegisterSuccess,
  type,
}: RegistrationSectionProps & { type: TicketType }) {
  const [ticketType, setTicketType] = useState<TicketType>("regular");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [vipCategory, setVipCategory] = useState<VipCategory>("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    type: "regular" as const,
  });

  const MAX_REGULAR = 50;

  const [regularCount, setRegularCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/regular-count");
        const json = await res.json();
        if (json.success) setRegularCount(json.count);
      } catch (e) {
        // console.error(e);
      }
    };

    fetchCount();
  }, []);

  // const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  // };
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Process payment dengan Midtrans Snap
  const processPayment = async (
    type: TicketType,
    amount: number
  ): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      if (regularCount >= MAX_REGULAR) {
        setError("Mohon maaf, kuota reguler sudah penuh.");
        setIsLoading(false);
        return;
      }
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketType: type,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          amount: amount,
        }),
      });

      const data: PaymentResponse = await response.json();

      if (data.success && data.token) {
        // Log redirect URL untuk referensi
        // console.info("=================================");
        // console.info(data);
        // console.info("ORDER ID:", data.orderId);
        // console.info("PAYMENT LINK:", data.redirectUrl);
        // console.info("=================================");

        // Tampilkan Midtrans Snap Popup
        window.snap.pay(data.token, {
          onSuccess: async (result) => {
            // console.info("✅ Payment Success:", result);

            // 2) Simpan peserta reguler ke Sheets via API register-regular
            const res = await fetch("/api/register-reguler", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
            });

            const json = await res.json();
            if (!json.success) {
              setError("Gagal menyimpan data. Silakan hubungi admin.");
              return;
            }

            const registered = json.data; // { id: 'REG1', name, email, ... }
            // console.info("CALL onRegisterSuccess with", registered);
            onRegisterSuccess(registered); // sama pattern-nya dengan VIP

            setShowModal(false);
            setFormData({
              name: "",
              email: "",
              phone: "",
              type: "regular",
            });
          },
          onPending: (result: MidtransResult) => {
            // console.info("⏳ Payment Pending:", result);
            // console.info("=================================");
            // console.info("📎 LINK PEMBAYARAN (simpan untuk nanti):");
            // console.info(data.redirectUrl);
            // console.info("=================================");

            // Tampilkan alert dengan link
            setError("Pembayaran pending! Silakan ulangi pembelian.");
          },
          onError: (result: MidtransResult) => {
            // console.info("❌ Payment Error:", result);
            setError("Pembayaran gagal. Silakan coba lagi.");
          },
          onClose: () => {
            // console.info("🚪 Snap popup closed");
            // console.info("=================================");
            // console.info("📎 LINK PEMBAYARAN (jika belum selesai):");
            // console.info(data.redirectUrl);
            // console.info("=================================");

            // Optional: Tampilkan modal dengan link pembayaran
            setError("Pembayaran belum selesai. Silakan coba lagi.");

            setIsLoading(false);
          },
        });
      } else {
        setError(data.error || "Gagal memproses pembayaran");
      }
    } catch (err) {
      // console.error("Error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    // nama: hanya huruf dan spasi (minimal 2 karakter)
    const nameRegex = /^[A-Za-z\s]{2,}$/;
    if (!formData.name || !nameRegex.test(formData.name.trim())) {
      setError("Nama hanya boleh berisi huruf dan spasi.");
      return false;
    }

    // email: wajib dan harus email Google
    const email = formData.email?.trim() || "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || !email.endsWith("@gmail.com")) {
      setError("Email harus email Google yang valid (contoh: nama@gmail.com).");
      return false;
    }

    // nomor WA Indonesia: mulai 08 atau +628, hanya angka setelah prefix
    const phone = formData.phone?.trim() || "";
    const waRegex = /^(?:\+628|08)\d{8,12}$/;
    if (!phone || !waRegex.test(phone)) {
      setError(
        "Nomor WhatsApp harus nomor Indonesia yang valid (contoh: 081234567890 atau +6281234567890)."
      );
      return false;
    }

    setError("");
    return true;
  };

  const handleRegularCheckout = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!validateForm()) return;
    processPayment("regular", 300000);
  };

  const handleVipCheckout = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const inputNameRaw = formData.name;
      const inputNoHp = formData.phone;

      const normalize = (s: string) =>
        s
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ""); // hanya huruf a-z dan angka 0-9

      // validasi dasar nomor HP Indonesia: +62 / 62 / 0, panjang 10–13 digit
      const isValidIndoPhone = (phone: string) => {
        const cleaned = phone.replace(/[^0-9+]/g, "");
        const regex = /^(?:\+62|62|0)[2-9][0-9]{7,11}$/; // awalan +62/62/0, min 10 digit, max 13
        return regex.test(cleaned);
      };

      if (!isValidIndoPhone(String(inputNoHp))) {
        setError(
          "Nomor HP tidak valid. Gunakan format Indonesia, misalnya 0812xxxxxxx atau +62812xxxxxxx."
        );
        setIsLoading(false);
        return;
      }

      // 1) fetch list sponsor dari API / Google Sheets
      const sponsorRes = await fetch("/api/sponsors");
      const sponsorJson = await sponsorRes.json();

      if (!sponsorJson.success) {
        setError("Gagal mengambil data sponsor. Coba lagi.");
        setIsLoading(false);
        return;
      }

      const sponsors: string[] = sponsorJson.sponsors;

      // 2) cek validitas dengan nama yang dinormalisasi
      const normalizedInput = normalize(inputNameRaw);

      const isValidSponsor = sponsors.some(
        (s) => normalize(s) === normalizedInput
      );

      if (!isValidSponsor) {
        alert("Nama sponsor tidak valid. Silakan cek kembali.");
        setIsLoading(false);
        return;
      }

      // 3) baru lanjut register VIP
      const res = await fetch("/api/register-vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inputNameRaw,
          email: "",
          phone: inputNoHp,
        }),
      });

      const json = await res.json();

      // validasi hasil dari API
      if (!json.success) {
        // kalau server kirim pesan spesifik (misal duplikat nama VIP / sponsor tidak valid), tampilkan
        if (json.error) {
          setError(json.error);
        } else {
          setError("Gagal menyimpan data. Silakan coba lagi.");
        }
        setIsLoading(false);
        return;
      }

      setFormData({
        name: "",
        email: "",
        phone: "",
        type: "vip",
      });

      onRegisterSuccess(json.data);
    } catch (err) {
      // console.error(err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      id: `REG${Date.now()}`,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      ticketType: formData.get("ticketType") as TicketType,
    };

    try {
      // Action 1: Simpan ke Google Sheets
      const result = await saveToGoogleSheets(data);

      if (!result.success) {
        setError("Gagal menyimpan data. Silakan coba lagi.");
        setIsLoading(false);
        return;
      }

      // Action 2: Generate QR Code & tampilkan
      setRegistrationData(data);
      setIsSubmitted(true);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      // console.error("Error:", error);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section id="register" className="py-20 px-4 bg-slate-900">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Daftar Sekarang
            </h2>
            <p className="text-slate-400">
              Pilih jenis tiket dan lengkapi pendaftaran
            </p>
          </div>

          {/* Toggle Switch */}
          {/* <div className="flex justify-center mb-8">
            <div className="bg-slate-800/50 p-1 rounded-full inline-flex">
              <button
                type="button"
                onClick={() => setTicketType("regular")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  ticketType === "regular"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Reguler
              </button>
              <button
                type="button"
                onClick={() => setTicketType("vip")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  ticketType === "vip"
                    ? "bg-amber-500 text-slate-900 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                VIP
              </button>
            </div>
          </div> */}

          {/* Content */}
          {type === "regular" ? (
            <TicketCard
              onBuyClick={() => setShowModal(true)}
              regularCount={regularCount}
              maxRegular={MAX_REGULAR}
            />
          ) : (
            <VipForm
              formData={formData}
              error={error}
              isLoading={isLoading}
              vipCategory={vipCategory}
              onCategoryChange={(value) => {
                setVipCategory(value);
                setFormData((prev) => ({ ...prev, name: "" })); // reset perusahaan ketika kategori ganti
              }}
              onInputChange={handleInputChange}
              onSubmit={handleVipCheckout}
            />
          )}
        </div>
      </section>

      {/* Modal Popup */}
      {showModal && (
        <ModalForm
          formData={formData}
          error={error}
          isLoading={isLoading}
          onClose={() => {
            setError("");
            setFormData({ name: "", email: "", phone: "", type: "regular" });
            setShowModal(false);
          }}
          onInputChange={handleInputChange}
          onSubmit={handleRegularCheckout}
        />
      )}
    </>
  );
}

// Ticket Card Component
interface TicketCardProps {
  onBuyClick: () => void;
  regularCount: number;
  maxRegular: number;
}

function TicketCard({ onBuyClick, regularCount, maxRegular }: TicketCardProps) {
  const benefits = [
    "Akses ke seluruh sesi konferensi",
    "Sertifikat eksklusif National Sugar Summit 2025",
    "Coffee break dan lunch break",
    "Akses ke exhibition & booth expo",
  ];
  const isFull = 50 >= maxRegular;
  const remaining = Math.max(maxRegular - regularCount, 0);

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-2xl border-4 border-white">
      <div className="bg-slate-900 p-6 text-center">
        <p className="text-amber-400 text-xs font-semibold tracking-widest mb-2">
          NATIONAL SUGAR SUMMIT 2025
        </p>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
          Tiket Reguler
        </h3>
        <p className="text-slate-400 text-sm">
          Akses penuh ke rangkaian sesi konferensi & expo
        </p>
      </div>

      <div className="relative h-4 bg-slate-100">
        <div className="absolute -top-3 left-0 w-6 h-6 bg-slate-900 rounded-full" />
        <div className="absolute -top-3 right-0 w-6 h-6 bg-slate-900 rounded-full" />
        <div className="absolute top-1/2 left-8 right-8 border-t-2 border-dashed border-slate-300 -translate-y-1/2" />
      </div>

      <div className="p-6 md:p-8">
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase mb-1">Tanggal</p>
            <p className="text-slate-900 font-semibold">
              Rabu, 17 Desember 2025
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase mb-1">Waktu</p>
            <p className="text-slate-900 font-semibold">08.00 - 17.00 WIB</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-500 text-xs uppercase mb-1">Lokasi</p>
            <p className="text-slate-900 font-semibold">
              Grand City Convention and Exhibition, Ballroom Lt. 4, Surabaya
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5 mb-6 space-y-2.5">
          {benefits.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <svg
                className="w-4 h-4 text-amber-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 -mx-6 md:-mx-8 px-6 md:px-8 py-5 -mb-6 md:-mb-8 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 uppercase">Harga Tiket</p>
              <p className="text-3xl font-bold text-slate-900">Rp 300.000</p>
            </div>
            {/* <div className="text-right">
              <p className="text-xs text-slate-500">Kuota tersisa</p>
              <p className="text-lg font-bold text-amber-600">
                {remaining} / {maxRegular}
              </p>
            </div> */}
          </div>
          <button
            type="button"
            onClick={onBuyClick}
            disabled={isFull}
            className={`w-full font-semibold py-3.5 rounded-lg transition ${
              isFull
                ? "bg-slate-400 cursor-not-allowed opacity-60"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
          >
            {"Pendaftaran di Tutup"}
          </button>
        </div>
      </div>
    </div>
  );
}

// VIP Form Component
interface VipFormProps {
  formData: FormData;
  error: string;
  isLoading: boolean;
  vipCategory: VipCategory;
  onCategoryChange: (value: VipCategory) => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

function VipForm({
  formData,
  error,
  isLoading,
  vipCategory,
  onCategoryChange,
  onInputChange,
  onSubmit,
}: VipFormProps) {
  const companyOptions = VIP_COMPANIES[vipCategory] || [];

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-amber-400 p-6 text-center">
        <p className="text-amber-900 text-xs font-semibold tracking-widest mb-1">
          SPONSOR ACCESS
        </p>
        <h3 className="text-2xl font-bold text-slate-900">Form Pendaftaran</h3>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          {error && <ErrorMessage message={error} />}

          {/* Kategori sponsor (tidak masuk formData) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Kategori Sponsor <span className="text-red-500">*</span>
            </label>
            <select
              value={vipCategory}
              onChange={(e) => onCategoryChange(e.target.value as VipCategory)}
              className="select-arrow text-black w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-900 focus:ring-2 focus:ring-slate-100 focus:outline-none transition"
              required
            >
              <option value="">Pilih kategori</option>
              <option value="diamond">Diamond</option>
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
            </select>
          </div>

          {/* Nama perusahaan (masuk ke formData.name) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Perusahaan <span className="text-red-500">*</span>
            </label>
            <select
              name="name"
              value={formData.name}
              onChange={onInputChange}
              disabled={!vipCategory}
              className="select-arrow text-black w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-900 focus:ring-2 focus:ring-slate-100 focus:outline-none transition disabled:bg-slate-100"
              required
            >
              <option value="">
                {vipCategory
                  ? "Pilih perusahaan"
                  : "Pilih kategori terlebih dahulu"}
              </option>
              {companyOptions.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>

          {/* Nomor HP (masuk ke formData.phone) */}
          <InputField
            label="Nomor HP"
            name="phone"
            type="tel"
            value={formData.phone || ""}
            onChange={onInputChange}
            placeholder="Masukkan nomor HP penanggung jawab"
            disabled={!formData.name} // wajib pilih perusahaan dulu
          />

          <SubmitButton
            isLoading={isLoading}
            text="Daftar Sponsor"
            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
          />
        </form>
      </div>
    </div>
  );
}

// // Modal Form Component
// interface ModalFormProps extends FormProps {
//   onClose: () => void;
// }

function ModalForm({
  formData,
  error,
  isLoading,
  onClose,
  onInputChange,
  onSubmit,
}: ModalFormProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-5 text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <p className="text-amber-400 text-xs font-semibold tracking-widest mb-1">
            TIKET REGULER
          </p>
          <h3 className="text-xl font-bold text-white">Form Pembelian</h3>
        </div>

        <div className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <InputField
              label="Nama Lengkap"
              name="name"
              type="text"
              value={formData.name}
              onChange={onInputChange}
              placeholder="Masukkan nama lengkap"
            />
            <InputField
              label="Nama Perusahaan / Instansi"
              name="company"
              type="text"
              value={formData.company || ""}
              onChange={onInputChange}
              placeholder="Masukkan nama company"
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={onInputChange}
              placeholder="nama@email.com"
            />
            <InputField
              label="Nomor WhatsApp"
              name="phone"
              type="tel"
              value={formData.phone || ""}
              onChange={onInputChange}
              placeholder="08xxxxxxxxxx"
            />

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-900 font-semibold">
                  Total Bayar
                </span>
                <span className="text-xl font-bold text-slate-900">
                  Rp 300.000
                </span>
              </div>
            </div>

            <SubmitButton
              isLoading={isLoading}
              text="Lanjut ke Pembayaran"
              className="bg-slate-900 hover:bg-slate-800 text-white"
            />
            <p className="text-xs text-center text-slate-500">
              🔒 Pembayaran aman dengan Midtrans
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
interface InputFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled?: boolean;
}

function InputField({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  disabled,
}: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required
        disabled={disabled}
        className="text-black w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-slate-900 focus:ring-2 focus:ring-slate-100 focus:outline-none transition disabled:bg-slate-100 disabled:cursor-not-allowed"
        placeholder={placeholder}
      />
    </div>
  );
}

interface SubmitButtonProps {
  isLoading: boolean;
  text: string;
  className: string;
}

function SubmitButton({ isLoading, text, className }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={`w-full font-semibold py-3.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Memproses...
        </span>
      ) : (
        text
      )}
    </button>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
      <p className="text-red-700 text-sm">{message}</p>
    </div>
  );
}
