"use server";

import { google } from "googleapis";

export async function deleteVipRegistration(registrationId: string) {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 1) Ambil semua data VIP
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Vip!A:K", // sama seperti yang kamu pakai di updateAttendanceStatus
    });

    const normalizeId = (id: string) => String(Number(id));

    const rows = getResponse.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      const sheetId = rows[i][0]; // kolom A
      if (!sheetId) continue;

      if (normalizeId(sheetId) === normalizeId(registrationId)) {
        rowIndex = i + 1; // 1-based index di Sheets
        break;
      }
    }

    if (rowIndex === -1) {
      return {
        success: false,
        error: "Registration ID VIP tidak ditemukan",
      };
    }

    // 2) Clear isi row (A..K) → dianggap “hapus”
    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Vip!A${rowIndex}:K${rowIndex}`,
    });

    return {
      success: true,
      data: {
        deletedRow: rowIndex,
        id: registrationId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Gagal menghapus data VIP",
    };
  }
}
