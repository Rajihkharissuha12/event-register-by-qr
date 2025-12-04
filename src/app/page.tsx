"use client";
import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { saveToGoogleSheets } from "./actions/saveToSheet";
import RegistrationSection from "./components/RegistrationSection";

export default function EventLanding() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [error, setError] = useState("");

  const [ticketType, setTicketType] = useState("regular"); // 'regular' or 'vip'

  // Countdown Timer
  useEffect(() => {
    const eventDate = new Date("2025-12-16T09:00:00").getTime();

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
    const svg = document.getElementById("qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${registrationData.id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
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
              <QRCode
                id="qr-code"
                value={JSON.stringify(registrationData)}
                size={256}
                level="H"
                fgColor="#0f172a"
                bgColor="#ffffff"
              />
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
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Tech Innovation Festival 2025
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-slate-300 font-light">
            Merayakan Inovasi Digital Indonesia
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-lg mb-10">
            <div className="flex items-center gap-2">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>16 Desember 2025</span>
            </div>

            <span className="hidden sm:block text-slate-500">•</span>

            <div className="flex items-center gap-2">
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Grand Atrium Mall, Jakarta</span>
            </div>
          </div>

          <a
            href="#register"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-4 px-10 rounded-md transition duration-300 shadow-lg hover:shadow-xl"
          >
            Daftar Sekarang
          </a>
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
                Apa Itu TIF 2025?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Tech Innovation Festival adalah event tahunan terbesar yang
                menghadirkan para pelaku industri teknologi, startup, developer,
                dan enthusiast untuk berbagi pengalaman, networking, dan
                showcase produk inovatif terkini.
              </p>
            </div>

            <div className="border-l-4 border-amber-500 pl-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Siapa Yang Hadir?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Bergabunglah dengan 2000+ peserta dari berbagai background:
                Founder & CTO startup, Software Engineers, Product Managers,
                Investors, Mahasiswa IT, dan profesional tech dari seluruh
                Indonesia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Speakers Section */}
      <section className="py-20 px-4 bg-slate-50">
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
                time: "09:00 - 10:00",
                title: "Registrasi & Welcoming Coffee",
                desc: "Check-in peserta dan networking session",
              },
              {
                time: "10:00 - 11:30",
                title: "Keynote: AI Revolution in Indonesia",
                desc: "Speaker: Dr. Budi Rahardjo - AI Researcher",
              },
              {
                time: "11:30 - 13:00",
                title: "Panel Discussion: Startup Ecosystem",
                desc: "4 Founder unicorn startup Indonesia",
              },
              {
                time: "13:00 - 14:00",
                title: "Lunch Break & Expo",
                desc: "Networking sambil menjelajahi booth sponsor",
              },
              {
                time: "14:00 - 16:00",
                title: "Workshop: Building Scalable Apps",
                desc: "Hands-on session dengan senior engineers",
              },
              {
                time: "16:00 - 17:30",
                title: "Startup Pitch Competition",
                desc: "10 startup terbaik pitching ide mereka",
              },
              {
                time: "17:30 - 18:00",
                title: "Closing & Networking Party",
                desc: "Doorprize dan live music performance",
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
                    <p className="text-slate-600 text-sm">{item.desc}</p>
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
                Grand Atrium Mall
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
                      Jl. Jenderal Sudirman No. 123, Jakarta Pusat 10220
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
                      MRT Bundaran HI (5 menit jalan kaki)
                    </p>
                    <p className="text-slate-600">
                      TransJakarta Halte Dukuh Atas
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
                      Tersedia parkir gratis untuk peserta
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-96 bg-slate-200 border-2 border-slate-900 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-slate-400 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <p className="text-slate-500 font-medium">Google Maps</p>
                <p className="text-sm text-slate-400 mt-1">Embed map di sini</p>
              </div>
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
                title: "Sertifikat Digital",
                desc: "Sertifikat resmi dari penyelenggara",
              },
              {
                title: "Goodie Bag",
                desc: "Merchandise eksklusif senilai 500rb",
              },
              {
                title: "Free Lunch & Snack",
                desc: "Makan siang dan coffee break gratis",
              },
              {
                title: "Job Fair Access",
                desc: "Akses ke booth recruitment 20+ perusahaan",
              },
              {
                title: "E-Book Bundle",
                desc: "Kumpulan e-book tech senilai 1 juta",
              },
              {
                title: "Doorprize",
                desc: "Kesempatan menang gadget & voucher",
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
      <section className="py-20 px-4 bg-slate-50">
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
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
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
      </section>

      {/* Registration Section */}
      <RegistrationSection
        onRegisterSuccess={(data) => {
          setRegistrationData(data);
          setIsSubmitted(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
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
                q: "Apakah event ini berbayar?",
                a: "Tidak, event ini 100% GRATIS untuk semua peserta. Namun kuota terbatas hanya 2000 peserta.",
              },
              {
                q: "Apakah saya perlu membawa laptop?",
                a: "Untuk sesi workshop disarankan membawa laptop. Untuk sesi lainnya tidak wajib.",
              },
              {
                q: "Bagaimana dress code untuk event ini?",
                a: "Smart casual atau business casual. Kami menyarankan pakaian yang nyaman untuk networking.",
              },
              {
                q: "Apakah ada sertifikat?",
                a: "Ya, semua peserta yang hadir akan mendapatkan sertifikat digital yang bisa di-download setelah event.",
              },
              {
                q: "Bagaimana jika saya tidak bisa hadir?",
                a: "Silakan informasikan kepada kami minimal H-3 agar kuota bisa diberikan ke peserta lain.",
              },
              {
                q: "Apakah tersedia recording?",
                a: "Ya, recording keynote dan panel discussion akan dibagikan ke semua peserta terdaftar.",
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
                Tech Innovation Festival
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Merayakan inovasi digital Indonesia dan membangun ekosistem
                teknologi yang lebih kuat.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 uppercase tracking-wide text-sm">
                Kontak
              </h4>
              <div className="space-y-2 text-slate-400">
                <p>Email: info@techinnovation.id</p>
                <p>WhatsApp: +62 812-3456-7890</p>
                <p>Instagram: @techinnovationfest</p>
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
                  Tentang
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
                  Daftar
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2025 Tech Innovation Festival. All rights reserved.
            </p>

            <div className="flex gap-6">
              <a
                href="#"
                className="text-slate-400 hover:text-amber-500 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
                  <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.999 3.999 0 110-7.998 3.999 3.999 0 010 7.998z" />
                  <circle cx="18.406" cy="5.594" r="1.44" />
                </svg>
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-amber-500 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-amber-500 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
