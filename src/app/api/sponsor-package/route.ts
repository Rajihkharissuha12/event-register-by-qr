// app/api/sponsor-package/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    await auth.authorize();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet2!A:B", // A: Nama Sponsor, B: Paket
    });

    const rows = res.data.values || [];

    const normalize = (s: string) =>
      String(s).trim().replace(/\s+/g, "").toLowerCase();

    const target = normalize(name);

    // cari baris yang nama sponsornya match
    let foundPackage: string | null = null;

    for (const row of rows) {
      const sponsorName = row[0];
      const pkg = row[1];
      if (!sponsorName || !pkg) continue;

      if (normalize(sponsorName) === target) {
        foundPackage = String(pkg).trim();
        break;
      }
    }

    if (!foundPackage) {
      return NextResponse.json({
        success: false,
        error: "Sponsor tidak ditemukan",
      });
    }

    let kuota: number | null = null;
    const pkgNorm = foundPackage.toLowerCase();

    if (pkgNorm === "diamond") kuota = 12;
    else if (pkgNorm === "platinum") kuota = 7;
    else if (pkgNorm === "gold") kuota = 4;

    return NextResponse.json({
      success: true,
      package: foundPackage,
      kuota,
    });
  } catch (err: any) {
    // console.error("SPONSOR_PACKAGE_ERROR", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to fetch sponsor package",
      },
      { status: 500 }
    );
  }
}
