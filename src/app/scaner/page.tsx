"use client";

import { useState, useEffect } from "react";
import { updateAttendanceStatus } from "../actions/updateAttendance";

// Install: npm install react-qr-reader
import { Scanner } from "@yudiel/react-qr-scanner";

export default function ScannerPage() {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleScan = async (result: any) => {
    if (!result || isProcessing) return;

    setIsProcessing(true);
    setError("");

    try {
      // Parse QR code data
      const scannedData = JSON.parse(result);

      if (!scannedData.id) {
        setError("QR Code tidak valid");
        setIsProcessing(false);
        return;
      }
      // Update attendance status
      const updateResult = await updateAttendanceStatus(
        scannedData.id,
        scannedData.type === "vip" ? "vip" : "reguler"
      );

      if (updateResult.success) {
        setResult({
          success: true,
          data: updateResult.data,
        });
        setScanning(false);
      } else {
        // contoh error dari server:
        // - "Registration ID tidak ditemukan"
        // - `Check-in untuk sponsor "PT Laju Brata" sudah maksimal.`
        setError(updateResult.error || "Gagal memproses check-in");
        // tidak perlu setResult.alreadyAttended lagi
      }
    } catch (err) {
      // console.error("Scan error:", err);
      setError("Format QR Code tidak valid");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError("");
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center">QR Code Scanner</h1>
          <p className="text-center text-slate-300 mt-2">
            Tech Innovation Festival 2025
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Scanner View */}
        {scanning && !result && (
          <div className="bg-white shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
                Scan QR Code Peserta
              </h2>
              <p className="text-slate-600 text-center">
                Arahkan kamera ke QR code untuk check-in
              </p>
            </div>

            {/* QR Scanner */}
            <div className="relative bg-slate-900 rounded-lg overflow-hidden mb-6">
              <Scanner
                onScan={(result) => {
                  if (result && result.length > 0) {
                    handleScan(result[0].rawValue);
                  }
                }}
                // onError={(error) => console.error(error)}
                // containerStyle={{
                //   width: "100%",
                //   maxWidth: "500px",
                //   margin: "0 auto",
                // }}
                // videoStyle={{
                //   width: "100%",
                //   height: "auto",
                // }}
              />

              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-4 border-amber-500 rounded-lg">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-500"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-500"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-500"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Processing indicator */}
            {isProcessing && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-slate-700">
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
                  <span className="font-medium">Memproses check-in...</span>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Success Result */}
        {result && result.success && (
          <div className="bg-white shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-10 h-10 text-green-600"
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

              <h2 className="text-3xl font-bold text-green-600 mb-2">
                Check-in Berhasil!
              </h2>
              <p className="text-slate-600">
                Selamat datang di Tech Innovation Festival 2025
              </p>
            </div>

            {/* Attendee Info */}
            <div className="border-l-4 border-green-500 bg-slate-50 p-6 mb-6">
              <p className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-wide">
                Data Peserta
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-sm font-semibold text-slate-600">
                    ID:
                  </span>
                  <span className="text-sm text-slate-900 font-mono">
                    {result.data?.id}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-sm font-semibold text-slate-600">
                    Nama:
                  </span>
                  <span className="text-sm text-slate-900">
                    {result.data?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-sm font-semibold text-slate-600">
                    Email:
                  </span>
                  <span className="text-sm text-slate-900">
                    {result.data?.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-600">
                    Status:
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    HADIR
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 transition duration-300 uppercase tracking-wide"
            >
              Scan QR Code Berikutnya
            </button>
          </div>
        )}

        {/* Already Attended */}
        {result && result.alreadyAttended && (
          <div className="bg-white shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-4">
                <svg
                  className="w-10 h-10 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-amber-600 mb-2">
                Sudah Check-in
              </h2>
              <p className="text-slate-600">{result.message}</p>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 transition duration-300 uppercase tracking-wide"
            >
              Scan QR Code Berikutnya
            </button>
          </div>
        )}

        {/* Instructions */}
        {scanning && !result && (
          <div className="mt-8 bg-white border-l-4 border-amber-500 p-6">
            <h3 className="font-bold text-slate-900 mb-3">Instruksi:</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Pastikan QR code terlihat jelas di kamera</li>
              <li>• Jaga jarak kamera sekitar 20-30 cm dari QR code</li>
              <li>• Pastikan pencahayaan cukup</li>
              <li>
                • Sistem akan otomatis memproses setelah QR code terdeteksi
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
