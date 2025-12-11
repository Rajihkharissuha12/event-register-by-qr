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

    // 1) ambil semua ID VIP yang ada di kolom A
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:A", // ganti "Sheet1" dengan nama tab yang benar
    });

    const rows = readRes.data.values || [];

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
      ticketType: "reguler" as const,
    };

    // 3) append row dengan ID baru (tidak duplikat karena cek maxNum)
    // await sheets.spreadsheets.values.append({
    //   spreadsheetId: SHEET_ID,
    //   range: RANGE,
    //   valueInputOption: "USER_ENTERED",
    //   requestBody: {
    //     values: [[data.id, data.name, data.email, data.phone, data.ticketType]],
    //   },
    // });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    // console.error(err);
    return NextResponse.json(
      { success: false, error: "Failed to register Reguler" },
      { status: 500 }
    );
  }
}
