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
const RANGE = "Vip!A:H"; // contoh 8 kolom

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

    const normalize = (s: string) =>
      String(s).trim().replace(/\s+/g, "").toLowerCase();

    // 1) ambil semua data (ID, Nama, ticketType) untuk cek duplikat + nomor terbesar
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Vip!A:E", // A: ID, B: Nama, ..., E: ticketType (sesuaikan)
    });

    const rows = readRes.data.values || [];

    let maxNum = 0;
    const inputNorm = normalize(inputName);

    for (const row of rows) {
      const id = row[0] as string | undefined; // kolom A
      const name = row[1] as string | undefined; // kolom B
      const ticketType = row[4] as string | undefined; // kolom E (misal 'vip' / 'regular')

      // cek nomor terbesar (ID numeric 4 digit)
      if (id) {
        const match = id.match(/^(\d+)$/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!Number.isNaN(n) && n > maxNum) maxNum = n;
        }
      }

      // cek duplikat nama VIP (normalisasi: hilang spasi & lowercase)
      if (name && ticketType) {
        if (
          String(ticketType).toLowerCase() === "vip" &&
          normalize(name) === inputNorm
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Nama VIP sudah terdaftar. Tidak boleh ada nama VIP yang sama.",
            },
            { status: 400 }
          );
        }
      }
    }

    // 2) generate ID baru dari nomor terbesar
    const nextNum = maxNum + 1;
    const newId = String(nextNum).padStart(4, "0");

    const data = {
      id: newId,
      name: inputName,
      email: body.email ?? "",
      phone: inputNoHp ?? "",
      ticketType: "vip" as const,
    };

    // 3) Validasi Perusahaan
    const sponsorRes = await fetch(`${baseUrl}/api/sponsor-package`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: inputName }),
    });

    const sponsorJson = await sponsorRes.json();

    if (!sponsorJson.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Sponsor VIP tidak valid atau paket tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    const sponsorPackage = sponsorJson.package;
    const kuota = sponsorJson.kuota ?? undefined;

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
      phone: body.phone,
      type: "vip",
    };

    const encoded = encodeTicketPayload(payload);
    const ticketUrl = `${baseUrl}/ticket?d=${encoded}`;

    const message =
      `Yang Terhormat Bapak/Ibu sebagai Sponsor VIP kategori ${sponsorPackage},\n\n` +
      "Terima kasih atas dukungan Bapak/Ibu dalam acara National Sugar Summit 2025.\n\n" +
      "Berikut adalah link VIP e-ticket Bapak/Ibu:\n" +
      ticketUrl +
      "\n\nMohon ditunjukkan kepada petugas saat memasuki area acara.\n" +
      "Kami sangat mengapresiasi partisipasi dan kehadiran Bapak/Ibu.";

    const waLink = `https://wa.me/${data.phone.replace(
      /^0/,
      "62"
    )}?text=${encodeURIComponent(message)}`;

    // 3) append row dengan ID baru (uncomment kalau sudah siap tulis ke sheet)
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            data.id, // A: ID
            data.name, // B: Nama
            data.email, // C: Email
            data.phone, // D: Phone
            "vip", // E: ticketType
            new Date().toISOString().split("T")[0],
            "Tidak Hadir",
            "",
            ticketUrl,
            kuota,
            sponsorPackage,
            waLink,
          ],
        ],
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: inputName,
        phone: inputNoHp,
        kuota: kuota,
        kategori: sponsorPackage,
        type: "vip",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Failed to register VIP" },
      { status: 500 }
    );
  }
}
