import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const body = (await req.json()) as { id?: string };

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "ID wajib diisi" },
        { status: 400 }
      );
    }

    const sheets = google.sheets({ version: "v4", auth });

    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Vip!A:L",
    });

    const normalizeId = (id: string) => String(Number(id));

    const rows = getResponse.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      const sheetId = rows[i][0];
      if (!sheetId) continue;

      if (normalizeId(sheetId) === normalizeId(body.id)) {
        rowIndex = i + 1; // 1-based
        break;
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Registration ID VIP tidak ditemukan" },
        { status: 404 }
      );
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Vip!A${rowIndex}:K${rowIndex}`,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          deletedRow: rowIndex,
          id: body.id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal menghapus data VIP" },
      { status: 500 }
    );
  }
}
