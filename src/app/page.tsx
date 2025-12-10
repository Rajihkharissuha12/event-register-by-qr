"use client";
import { useState, useEffect } from "react";
import { Cuer } from "cuer";
import RegistrationSection, {
  TicketType,
} from "./components/RegistrationSection";
import { generateQrDataUrl } from "./utils/generateQrDataUrl";
import { saveToGoogleSheets } from "./actions/saveToSheet";
import * as htmlToImage from "html-to-image";
import { usePathname, useSearchParams } from "next/navigation";

export default function EventLanding() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "regular"; // "vip" / "regguler"

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [error, setError] = useState("");
  const [ticketType, setTicketType] = useState("regular"); // 'regular' or 'vip'
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  const handleRegisterSuccess = (data: any) => {
    console.log("HANDLE REGISTER SUCCESS", data); // debug
    setRegistrationData(data);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const autoUploadQr = async () => {
      if (!isSubmitted || !registrationData) return;
      if (isUploadingQr) return; // cegah double
      if (registrationData.qrImageUrl) return;

      try {
        setIsUploadingQr(true);

        // 1) generate QR dari Cuer (DOM sudah render karena isSubmitted true)
        const qrDataUrl = await generateQrDataUrl();
        if (!qrDataUrl) {
          setError("Gagal generate QR dari Cuer.");
          return;
        }

        // 2) upload ke Cloudinary
        const uploadRes = await fetch("/api/upload-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: qrDataUrl,
            publicId: registrationData.id,
          }),
        });

        const uploadJson = await uploadRes.json();
        if (!uploadJson.success) {
          setError("Gagal upload QR ke Cloudinary.");
          return;
        }

        const qrImageUrl = uploadJson.url;

        function encodeTicketPayload(data: any) {
          const json = JSON.stringify(data);
          // browser-safe base64 (URL-safe)
          const b64 = btoa(json)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/g, "");
          return b64;
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

        const payload = {
          id: registrationData.id,
          name: registrationData.name,
          email: registrationData.email,
          phone: registrationData.phone,
          ticketType: registrationData.ticketType,
        };

        const encoded = encodeTicketPayload(payload);

        const ticketUrl = `${baseUrl}/ticket?d=${encoded}`;

        // === tambahkan blok ini ===
        let kuota: number | undefined;
        let sponsorPackage: string | undefined;

        if (registrationData.ticketType === "vip") {
          const sponsorRes = await fetch("/api/sponsor-package", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: registrationData.name }),
          });

          const sponsorJson = await sponsorRes.json();

          if (!sponsorJson.success) {
            setError("Sponsor VIP tidak valid atau paket tidak ditemukan.");
            return;
          }

          sponsorPackage = sponsorJson.package;
          kuota = sponsorJson.kuota ?? undefined;
        }

        // 3) simpan ke Google Sheets (dengan field qrImageUrl)
        await saveToGoogleSheets({
          ...registrationData,
          qrImageUrl: ticketUrl,
          kuota,
          sponsorPackage,
        });

        // optional: update state lokal
        setRegistrationData((prev: any) => ({
          ...prev,
          qrImageUrl: ticketUrl,
        }));
      } catch (e) {
        console.error(e);
        setError("Terjadi kesalahan saat upload QR.");
      } finally {
        setIsUploadingQr(false);
      }
    };

    // tunda sedikit supaya Cuer benar-benar sudah render SVG
    const timer = setTimeout(() => {
      autoUploadQr();
    }, 300); // 300ms

    return () => clearTimeout(timer);
  }, [registrationData]);

  // Countdown Timer
  useEffect(() => {
    const eventDate = new Date("2025-12-17T09:00:00").getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = eventDate - now;

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const downloadQRCode = () => {
    const node = document.getElementById("qr-code");
    if (!node) {
      console.error("QR wrapper tidak ditemukan");
      return;
    }

    htmlToImage.toPng(node).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = `QR-${registrationData.id}.png`;
      link.href = dataUrl;
      link.click();
    });
  };

  // QR Code View
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full bg-white shadow-lg p-8 md:p-12">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-slate-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Pendaftaran Berhasil
            </h2>
            <p className="text-slate-600 text-lg">
              Simpan QR Code ini untuk masuk ke event
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-white p-6 border-4 border-slate-900 inline-block">
              <div
                id="qr-code"
                className="inline-block p-4 bg-white"
                style={{
                  border: "8px solid #111827", // warna frame (tailwind slate-900)
                  borderRadius: "8px", // kalau mau sedikit rounded
                }}
              >
                <Cuer
                  value={JSON.stringify(registrationData)}
                  size={260}
                  color="black"
                  arena={
                    <div
                      style={{
                        transform: "scale(4)", // scale 4x supaya saat export tidak mengecil
                        transformOrigin: "center", // supaya tetap di tengah
                      }}
                      className="flex items-center justify-center"
                    >
                      <span className="bg-white text-black text-[1px] font-bold px-[1px] rounded">
                        {registrationData.id}
                      </span>
                    </div>
                  }
                />
              </div>
            </div>
          </div>

          <div className="border-l-4 border-amber-500 bg-slate-50 p-6 mb-8">
            <p className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-wide">
              Detail Pendaftaran
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-sm font-semibold text-slate-600">
                  ID Peserta:
                </span>
                <span className="text-sm text-slate-900 font-mono">
                  {registrationData?.id}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-sm font-semibold text-slate-600">
                  Nama:
                </span>
                <span className="text-sm text-slate-900">
                  {registrationData?.name}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-sm font-semibold text-slate-600">
                  Email:
                </span>
                <span className="text-sm text-slate-900">
                  {registrationData?.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600">
                  WhatsApp:
                </span>
                <span className="text-sm text-slate-900">
                  {registrationData?.phone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={downloadQRCode}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-6 transition duration-200 flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download QR Code
            </button>

            <button
              onClick={() => setIsSubmitted(false)}
              className="sm:w-auto bg-white border-2 border-slate-900 hover:bg-slate-50 text-slate-900 font-semibold py-4 px-6 transition duration-200 uppercase tracking-wide text-sm"
            >
              Kembali
            </button>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-center">
            <p className="text-sm text-slate-700 leading-relaxed">
              QR Code telah dikirim ke email dan WhatsApp Anda.
              <br />
              <span className="font-semibold">
                Tunjukkan QR code ini saat masuk event.
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/dvuza2lpc/image/upload/v1764853831/Logo_NSS_SGN_2025_1__11zon_1_p20xss.png"
                alt="TIF 2025"
                className="h-10 md:h-12 w-auto object-contain"
              />
              <div className="hidden sm:block">
                <div className="text-white font-bold text-lg">NSS 2025</div>
                <div className="text-amber-400 text-xs uppercase tracking-wider">
                  National Sugar Summit 2025
                </div>
              </div>
            </a>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-1">
              <a
                href="#about"
                className="text-slate-300 hover:text-white px-4 py-2 rounded-lg transition font-medium text-sm"
              >
                Tentang
              </a>
              <a
                href="#agenda"
                className="text-slate-300 hover:text-white px-4 py-2 rounded-lg transition font-medium text-sm"
              >
                Agenda
              </a>
              <a
                href="#speakers"
                className="text-slate-300 hover:text-white px-4 py-2 rounded-lg transition font-medium text-sm"
              >
                Pembicara
              </a>
              <a
                href="#register"
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-2 rounded-lg transition font-bold text-sm ml-2"
              >
                Daftar
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-300 hover:text-white p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-800 py-4">
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-lg transition font-medium"
              >
                Tentang
              </a>
              <a
                href="#agenda"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-lg transition font-medium"
              >
                Agenda
              </a>
              <a
                href="#speakers"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-lg transition font-medium"
              >
                Pembicara
              </a>
              <a
                href="#register"
                onClick={() => setMobileMenuOpen(false)}
                className="block bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-3 rounded-lg transition font-bold mt-2 text-center"
              >
                Daftar Sekarang
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white py-20 md:py-28 px-4 overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center">
            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight">
              NSS
              <br />
              <span className="text-amber-400">National Sugar Summit 2025</span>
            </h1>

            <p className="text-lg md:text-2xl mb-10 text-slate-300 font-light max-w-3xl mx-auto">
              Strengthening Food & Energy Security Through Sugar Industry
              Transformation
            </p>

            {/* Event Info Pills */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm md:text-base mb-12">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-full border border-white/20">
                <svg
                  className="w-5 h-5 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-semibold">17 Desember 2025</span>
              </div>

              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-full border border-white/20">
                <svg
                  className="w-5 h-5 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="font-semibold">
                  Ballroom Grand City, Surabaya
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <a
              href="#register"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-4 px-12 rounded-lg transition duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform uppercase tracking-wide text-sm"
            >
              Daftar Sekarang
            </a>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-2">
                  500+
                </div>
                <div className="text-xs md:text-sm text-slate-400 uppercase tracking-wide">
                  Peserta
                </div>
              </div>

              <div className="text-center md:border-l md:border-slate-700/50">
                <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-2">
                  15+
                </div>
                <div className="text-xs md:text-sm text-slate-400 uppercase tracking-wide">
                  Pembicara
                </div>
              </div>

              <div className="text-center md:border-l md:border-slate-700/50">
                <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-2">
                  5+
                </div>
                <div className="text-xs md:text-sm text-slate-400 uppercase tracking-wide">
                  Workshop
                </div>
              </div>

              <div className="text-center md:border-l md:border-slate-700/50">
                <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-2">
                  25+
                </div>
                <div className="text-xs md:text-sm text-slate-400 uppercase tracking-wide">
                  Booth Expo
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Timer */}
      <section className="bg-amber-500 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-center text-slate-900 font-bold text-xl mb-6 uppercase tracking-wide">
            Event Dimulai Dalam
          </h3>
          <div className="grid grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto">
            {[
              { value: timeLeft.days, label: "Hari" },
              { value: timeLeft.hours, label: "Jam" },
              { value: timeLeft.minutes, label: "Menit" },
              { value: timeLeft.seconds, label: "Detik" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900 text-white p-6 text-center"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {item.value}
                </div>
                <div className="text-sm md:text-base uppercase tracking-wide">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            Tentang Event
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="border-l-4 border-slate-900 pl-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Apa Itu NSS 2025?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                National Sugar Summit (NSS) 2025 adalah konferensi nasional
                industri gula Indonesia yang berfokus pada penguatan ketahanan
                pangan dan energi melalui transformasi menyeluruh rantai pasok
                gula, dari hulu hingga hilir.
              </p>
              <p className="text-slate-600 leading-relaxed mt-3">
                Melalui sesi konferensi, diskusi panel, dan expo teknologi, NSS
                2025 menghadirkan wawasan kebijakan, inovasi budidaya dan
                pabrik, hingga pemanfaatan tebu sebagai sumber bioenergi
                berkelanjutan.
              </p>
            </div>

            <div className="border-l-4 border-amber-500 pl-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Siapa yang Hadir?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Peserta NSS 2025 meliputi perwakilan Kementerian dan lembaga
                pemerintah, direksi dan manajemen pabrik gula BUMN maupun
                swasta, petani dan asosiasi tebu, peneliti dan akademisi, pelaku
                industri pendukung, hingga lembaga keuangan dan investor.
              </p>
              <p className="text-slate-600 leading-relaxed mt-3">
                Event ini dirancang sebagai platform kolaborasi lintas pemangku
                kepentingan untuk berbagi pengalaman, menyusun strategi, dan
                membangun kemitraan konkret demi masa depan industri gula
                Indonesia yang lebih tangguh dan berdaya saing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Speakers Section */}
      <section id="speakers" className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">
            Pembicara
          </h2>
          <p className="text-center text-slate-600 mb-16 text-lg">
            Belajar langsung dari para ahli dan praktisi terbaik
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Budi Rahardjo",
                title: "AI Researcher & Professor",
                company: "ITB",
                topic: "AI Revolution in Indonesia",
              },
              {
                name: "Sarah Wijaya",
                title: "CTO & Co-Founder",
                company: "TechStartup Unicorn",
                topic: "Building Scalable Systems",
              },
              {
                name: "Michael Tan",
                title: "VP of Engineering",
                company: "Global Tech Company",
                topic: "Future of Web Development",
              },
            ].map((speaker, idx) => (
              <div
                key={idx}
                className="bg-white border-2 border-slate-200 hover:border-amber-500 transition-colors duration-300 overflow-hidden group"
              >
                <div className="h-64 bg-slate-200 flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-slate-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {speaker.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-1">{speaker.title}</p>
                  <p className="text-sm font-semibold text-amber-600 mb-3">
                    {speaker.company}
                  </p>
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">Topic:</span>{" "}
                      {speaker.topic}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agenda Section */}
      <section id="agenda" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            Agenda Acara
          </h2>
          <div className="space-y-4">
            {[
              {
                time: "08.00 - 08.30",
                title: "Registrasi dan Coffee Break",
                desc: "",
              },
              {
                time: "08.30 - 09.15",
                title:
                  "Pembukaan Acara, Menyanyikan Lagu Indonesia Raya dan Pembacaan Doa",
                desc: "",
              },
              {
                time: "09.15 - 11.00",
                title: "Keynote Speech",
                desc: "",
              },
              {
                time: "11.00 - 11.45",
                title: "Technology Session 1",
                desc: "",
              },
              {
                time: "11.45 - 12.45",
                title: "Lunch Break",
                desc: "",
              },
              {
                time: "12.45 - 13.15",
                title: "International Speaker",
                desc: "",
              },
              {
                time: "13.15 - 14.00",
                title: "Technology Session 2",
                desc: "",
              },
              {
                time: "14.00 - 16.00",
                title: "Industrial Session",
                desc: "",
              },
              {
                time: "16.00 - 16.30",
                title: "Awarding Best Sugar Mills & Best Farmers",
                desc: "",
              },
              {
                time: "16.30 - 17.00",
                title: "Pembacaan Rumusan & Closing",
                desc: "",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white border-l-2 border-slate-900 p-6 hover:border-amber-500 transition-colors duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <span className="text-slate-900 font-semibold text-sm md:w-40 uppercase tracking-wide">
                    {item.time}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      {item.title}
                    </h3>
                    {item.desc && (
                      <p className="text-slate-600 text-sm">{item.desc}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Venue Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            Lokasi Event
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                Ballroom Grand City, Surabaya
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <svg
                    className="w-6 h-6 text-amber-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-slate-900">Alamat</p>
                    <p className="text-slate-600">
                      Jl. Gubeng Pojok No.1, Ketabang, Kec. Genteng, Surabaya,
                      Jawa Timur 60272
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <svg
                    className="w-6 h-6 text-amber-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-slate-900">Transportasi</p>
                    <p className="text-slate-600">
                      ±5 menit dari Stasiun Gubeng dengan kendaraan.
                    </p>
                    <p className="text-slate-600">
                      Akses mudah via transportasi online dan angkutan kota
                      pusat Surabaya.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <svg
                    className="w-6 h-6 text-amber-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-slate-900">Parkir</p>
                    <p className="text-slate-600">
                      Area parkir luas di dalam kompleks Grand City Mall.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-96 bg-slate-200 border-2 border-slate-900">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.808716391202!2d112.74613858679446!3d-7.262597974035777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7f963466fcf4f%3A0x9183b1620f465602!2sGrand%20City%20Convention%20Dan%20Exhibition!5e0!3m2!1sid!2sid!4v1765377542494!5m2!1sid!2sid"
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            Apa Yang Kamu Dapatkan?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Sertifikat Eksklusif",
                desc: "Sertifikat fisik resmi National Sugar Summit 2025 untuk peserta, official, dan sponsor.",
              },
              {
                title: "Souvenir Premium",
                desc: "Plakat eksklusif NSS 2025 sebagai apresiasi untuk pembicara, sponsor, dan penerima penghargaan.",
              },
              {
                title: "Goodie Bag NSS 2025",
                desc: "Tote bag berisi merchandise resmi NSS seperti tumbler, pulpen, dan notebook edisi khusus.",
              },
              {
                title: "Materi & Dokumentasi",
                desc: "Akses ke materi presentasi terpilih dan dokumentasi kegiatan setelah acara.",
              },
              {
                title: "Networking",
                desc: "Kesempatan bertemu langsung dengan pelaku industri gula, pemerintah, dan akademisi.",
              },
              {
                title: "Kesempatan Penghargaan",
                desc: "Berbagai kategori apresiasi untuk pabrik gula dan petani terbaik di ajang NSS 2025.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-200 p-8 hover:border-amber-500 transition-colors duration-300 group"
              >
                <div className="w-12 h-1 bg-slate-900 mb-6 group-hover:bg-amber-500 transition-colors duration-300" />
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      {/* <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">
            Sponsor & Partner
          </h2>
          <p className="text-center text-slate-600 mb-16 text-lg">
            Didukung oleh perusahaan teknologi terkemuka
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="bg-white border border-slate-200 p-8 flex items-center justify-center hover:border-amber-500 transition-colors duration-300"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-200 mx-auto mb-3 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-slate-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Sponsor Logo
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Testimonials Section */}
      {/* <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">
            Kata Mereka
          </h2>
          <p className="text-center text-slate-600 mb-16 text-lg">
            Testimoni peserta TIF 2024
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Ahmad Rizki",
                role: "Software Engineer",
                company: "Tech Company",
                text: "Event yang sangat insightful! Banyak knowledge baru yang saya dapatkan dan networking yang luar biasa.",
              },
              {
                name: "Dinda Putri",
                role: "Product Manager",
                company: "Startup Indonesia",
                text: "Speaker-speaker berkualitas dan materi yang sangat applicable untuk pekerjaan sehari-hari. Recommended!",
              },
              {
                name: "Reza Firmansyah",
                role: "Founder",
                company: "Digital Agency",
                text: "Salah satu tech event terbaik di Indonesia. Organisasi rapi dan konten berkualitas tinggi.",
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="border-l-4 border-amber-500 bg-slate-50 p-6"
              >
                <svg
                  className="w-8 h-8 text-amber-500 mb-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <p className="text-slate-700 mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                <div className="border-t border-slate-200 pt-4">
                  <p className="font-bold text-slate-900">{testimonial.name}</p>
                  <p className="text-sm text-slate-600">{testimonial.role}</p>
                  <p className="text-sm text-amber-600 font-semibold">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Registration Section */}
      <RegistrationSection
        onRegisterSuccess={handleRegisterSuccess}
        type={type as TicketType}
      />

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            Pertanyaan Umum
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Apakah mengikuti National Sugar Summit 2025 berbayar?",
                a:
                  type === "vip"
                    ? "Untuk tamu VIP, tiket tidak dikenakan biaya (gratis). Undangan VIP mendapatkan fasilitas khusus sesuai paket yang ditentukan panitia."
                    : "Untuk peserta reguler, tiket berbayar Rp 300.000 per orang dengan fasilitas akses sesi konferensi, coffee break, lunch break, dan expo.",
              },
              {
                q: "Apa perbedaan tiket VIP dan Reguler?",
                a: "Pemegang tiket VIP merupakan tamu undangan/sponsor dengan fasilitas khusus, sedangkan tiket Reguler adalah tiket berbayar untuk peserta umum dengan akses ke seluruh sesi konferensi dan expo.",
              },
              {
                q: "Apakah semua peserta mendapatkan sertifikat?",
                a: "Ya, baik peserta VIP maupun Reguler yang hadir dan melakukan registrasi ulang akan mendapatkan sertifikat sesuai ketentuan panitia.",
              },
              {
                q: "Apa saja fasilitas untuk peserta reguler?",
                a: "Peserta reguler mendapatkan akses ke sesi konferensi, coffee break, lunch break, dan booth expo selama hari acara.",
              },
              {
                q: "Bagaimana jika saya sudah daftar tetapi tidak bisa hadir?",
                a: "Silakan informasikan ke panitia melalui kontak resmi agar kuota dan kursi dapat dialokasikan ke peserta lain.",
              },
              {
                q: "Apakah tersedia materi atau rekaman acara?",
                a: "Panitia akan menyediakan materi presentasi dan dokumentasi terbatas yang dapat diakses peserta terdaftar setelah acara.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border-l-4 border-slate-900 p-6"
              >
                <h3 className="font-bold text-slate-900 mb-3 text-lg">
                  {faq.q}
                </h3>
                <p className="text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">
                National Sugar Summit 2025
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Forum strategis nasional untuk memperkuat ketahanan pangan dan
                energi melalui transformasi industri gula Indonesia dari hulu
                hingga hilir.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 uppercase tracking-wide text-sm">
                Kontak Panitia
              </h4>
              <div className="space-y-2 text-slate-400">
                {/* <p>Email: nss2025@danantara.id</p>
                <p>WhatsApp Sekretariat: +62 812-0000-0000</p> */}
                <p>Lokasi: Ballroom Grand City, Surabaya</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4 uppercase tracking-wide text-sm">
                Quick Links
              </h4>
              <div className="space-y-2">
                <a
                  href="#about"
                  className="block text-slate-400 hover:text-amber-500 transition"
                >
                  Tentang Event
                </a>
                <a
                  href="#agenda"
                  className="block text-slate-400 hover:text-amber-500 transition"
                >
                  Agenda
                </a>
                <a
                  href="#register"
                  className="block text-slate-400 hover:text-amber-500 transition"
                >
                  Pendaftaran
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2025 National Sugar Summit. All rights reserved.
            </p>
            <p className="text-slate-500 text-xs">
              Diselenggarakan oleh pemangku kepentingan industri gula Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
