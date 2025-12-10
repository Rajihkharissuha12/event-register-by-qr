// app/api/regular-count/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export async function GET() {
  try {
    const sheets = google.sheets({ version: "v4", auth });

    // A: ID, B: NAMA, C: EMAIL, D: NO HP, E: Type, dst
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:E",
    });

    const rows = res.data.values || [];
    // skip header (index 0)
    const regularCount = rows.slice(1).filter((row) => {
      const type = row[4];
      return String(type).toLowerCase() === "reguler";
    }).length;

    return NextResponse.json({ success: true, count: regularCount });
  } catch (err: any) {
    console.error("REGULAR_COUNT_ERROR", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to get regular count" },
      { status: 500 }
    );
  }
}
