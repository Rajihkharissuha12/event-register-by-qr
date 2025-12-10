"use client";

import { Cuer } from "cuer";
import { useMemo } from "react";
import * as htmlToImage from "html-to-image";

function decodeTicketPayload(encoded: string | null) {
  if (!encoded) return null;
  try {
    const b64 = encoded
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const json = atob(b64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

type TicketClientProps = {
  encoded: string; // base64 dari query d
};

export default function TicketClient({ encoded }: TicketClientProps) {
  const payload = useMemo(() => decodeTicketPayload(encoded), [encoded]);

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-700">Link tiket tidak valid atau rusak.</p>
      </div>
    );
  }

  const registrationData = payload;

  const downloadQRCode = () => {
    const node = document.getElementById("qr-code");
    if (!node) {
      // console.info("QR wrapper tidak ditemukan");
      return;
    }

    htmlToImage.toPng(node).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = `QR-${registrationData.id}.png`;
      link.href = dataUrl;
      link.click();
    });
  };

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
                border: "8px solid #111827",
                borderRadius: "8px",
              }}
            >
              <Cuer
                value={JSON.stringify(registrationData)}
                size={260}
                color="black"
                arena={
                  <div
                    style={{
                      transform: "scale(4)",
                      transformOrigin: "center",
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
                {registrationData.id}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-sm font-semibold text-slate-600">
                Nama:
              </span>
              <span className="text-sm text-slate-900">
                {registrationData.name}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-sm font-semibold text-slate-600">
                Email:
              </span>
              <span className="text-sm text-slate-900">
                {registrationData.email}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600">
                WhatsApp:
              </span>
              <span className="text-sm text-slate-900">
                {registrationData.phone}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={downloadQRCode}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-6 transition duration-200 flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
          >
            Download QR Code
          </button>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-center">
          <p className="text-sm text-slate-700 leading-relaxed">
            QR Code juga dikirim ke email dan WhatsApp Anda.
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
