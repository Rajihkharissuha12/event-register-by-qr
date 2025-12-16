"use client";

import { useEffect, useRef, useState } from "react";
import { updateAttendanceStatus } from "../actions/updateAttendance";

export default function HardwareScannerPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // selalu fokus ke input (penting untuk scanner)
  useEffect(() => {
    inputRef.current?.focus();

    const interval = setInterval(() => {
      inputRef.current?.focus();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || isProcessing) return;

    const rawValue = e.currentTarget.value.trim();
    e.currentTarget.value = "";

    setIsProcessing(true);
    setError("");
    setResult(null);

    try {
      const scannedData = JSON.parse(rawValue);

      if (!scannedData.id) {
        throw new Error("QR Code tidak valid");
      }

      const updateResult = await updateAttendanceStatus(
        scannedData.id,
        scannedData.type === "vip" ? "vip" : "reguler"
      );

      if (updateResult.success) {
        setResult({
          success: true,
          data: scannedData,
        });
      } else {
        setError(updateResult.error || "Gagal memproses check-in");
      }
    } catch (err) {
      setError("Format QR Code tidak valid");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError("");
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white py-6 px-4">
        <h1 className="text-3xl font-bold text-center">
          Scanner QR (Hardware)
        </h1>
        <p className="text-center text-slate-300 mt-2">
          Tech Innovation Festival 2025
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hidden input */}
        <input
          ref={inputRef}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="absolute opacity-0 pointer-events-none"
        />

        {/* Scanner status */}
        {!result && (
          <div className="bg-white shadow-lg p-8 text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Siap Scan QR Code
              </h2>
              <p className="text-slate-600">
                Gunakan scanner SharkPOS untuk scan QR peserta
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="w-48 h-48 border-4 border-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-amber-600 font-bold text-lg">
                  SCAN DI SINI
                </span>
              </div>
            </div>

            {isProcessing && (
              <p className="text-slate-700 font-medium">
                Memproses check-in...
              </p>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Success */}
        {result?.success && (
          <div className="bg-white shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                ✅
              </div>
              <h2 className="text-3xl font-bold text-green-600 mb-2">
                Check-in Berhasil!
              </h2>
            </div>

            <div className="border-l-4 border-green-500 bg-slate-50 p-6 mb-6 text-black">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-semibold">ID</span>
                  <span className="font-mono">{result.data?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Nama</span>
                  <span>{result.data?.name}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4"
            >
              Scan Berikutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
