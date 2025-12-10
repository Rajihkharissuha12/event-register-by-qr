// app/api/sponsors/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export async function GET() {
  try {
    await auth.authorize();
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet2!A:A", // sesuaikan nama tab & kolom sponsor
    });

    const rows = res.data.values || [];
    const sponsors = rows
      .flat()
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0 && v.toLowerCase() !== "nama sponsor");

    return NextResponse.json({ success: true, sponsors });
  } catch (err: any) {
    // console.error("GET_SPONSORS_ERROR", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch sponsors" },
      { status: 500 }
    );
  }
}
