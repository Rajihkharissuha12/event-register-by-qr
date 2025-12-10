// app/api/register-vip/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const RANGE = "Sheet1!A:H"; // contoh 8 kolom

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    const inputName = String(body.name || "").trim();
    if (!inputName) {
      return NextResponse.json(
        { success: false, error: "Nama wajib diisi" },
        { status: 400 }
      );
    }

    const normalize = (s: string) =>
      String(s).trim().replace(/\s+/g, "").toLowerCase();

    // 1) ambil semua data (ID, Nama, ticketType) untuk cek duplikat + nomor terbesar
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:E", // A: ID, B: Nama, ..., E: ticketType (sesuaikan)
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
      phone: body.phone ?? "",
      ticketType: "vip" as const,
    };

    // 3) append row dengan ID baru (uncomment kalau sudah siap tulis ke sheet)
    // await sheets.spreadsheets.values.append({
    //   spreadsheetId: SHEET_ID,
    //   range: RANGE,
    //   valueInputOption: "USER_ENTERED",
    //   requestBody: {
    //     values: [[
    //       data.id,        // A: ID
    //       data.name,      // B: Nama
    //       data.email,     // C: Email
    //       data.phone,     // D: Phone
    //       data.ticketType // E: ticketType
    //       // tambah kolom lain (F–H) kalau perlu
    //     ]],
    //   },
    // });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Failed to register VIP" },
      { status: 500 }
    );
  }
}
