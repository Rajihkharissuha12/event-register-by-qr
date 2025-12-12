// app/api/register-vip/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const RANGE = "Reguler!A:H"; // contoh 8 kolom

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    const inputName = String(body.name || "").trim();
    const inputNoHp = String(body.phone || "").trim();

    if (!inputName) {
      return NextResponse.json(
        { success: false, error: "Nama wajib diisi" },
        { status: 400 }
      );
    }
    if (!inputNoHp) {
      return NextResponse.json(
        { success: false, error: "Nomor HP wajib diisi" },
        { status: 400 }
      );
    }

    // 1) ambil semua ID VIP yang ada di kolom A
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Reguler!A:A", // ganti "Sheet1" dengan nama tab yang benar
    });

    const rows = readRes.data.values || [];

    // Cek Kuota Reguler
    const regularCount = rows.slice(1).filter((row) => {
      const type = row[4];
      return String(type).toLowerCase() === "reguler";
    }).length;

    if (regularCount >= 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Kuota tiket reguler sudah penuh (50 peserta).",
        },
        { status: 400 }
      );
    }

    // 2) cari nomor terbesar
    let maxNum = 0;
    for (const row of rows) {
      const id = row[0] as string;
      const match = id?.match(/^(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!Number.isNaN(n) && n > maxNum) maxNum = n;
      }
    }

    const nextNum = maxNum + 1;
    const newId = String(nextNum).padStart(4, "0");

    const data = {
      id: newId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      type: "reguler" as const,
    };

    // Generate Url Ticket
    function encodeTicketPayload(data: any) {
      const json = JSON.stringify(data);
      // browser-safe base64 (URL-safe)
      const b64 = btoa(json)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
      return b64;
    }

    const payload = {
      id: data.id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      type: "reguler",
      company: body.company,
    };

    const encoded = encodeTicketPayload(payload);
    const ticketUrl = `${baseUrl}/ticket?d=${encoded}`;

    const message =
      "Yth. Bapak/Ibu " +
      data.name +
      ",\n\n" +
      "Terima kasih atas pembelian tiket National Sugar Summit 2025.\n\n" +
      "Berikut adalah link e-ticket Anda:\n" +
      ticketUrl +
      "\n\n" +
      "Silakan menyimpan e-ticket tersebut dan menunjukkannya kepada petugas saat memasuki area acara.\n\n" +
      "Salam hormat,\n" +
      "Panitia National Sugar Summit 2025";

    const waLink = `https://wa.me/${data.phone.replace(
      /^0/,
      "62"
    )}?text=${encodeURIComponent(message)}`;

    // 3) append row dengan ID baru (tidak duplikat karena cek maxNum)
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            data.id,
            data.name,
            data.email,
            data.phone,
            data.type,
            new Date().toISOString().split("T")[0],
            "Belum Hadir",
            "",
            ticketUrl,
            "",
            data.company,
            waLink,
          ],
        ],
      },
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    // console.error(err);
    return NextResponse.json(
      { success: false, error: "Failed to register Reguler" },
      { status: 500 }
    );
  }
}
