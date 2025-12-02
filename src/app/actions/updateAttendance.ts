"use server";

import { google } from "googleapis";

export async function updateAttendanceStatus(registrationId: string) {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 1. Get all data untuk find row dengan ID yang cocok
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:F", // A=ID, B=Name, C=Email, D=Phone, E=Timestamp, F=Status
    });

    const rows = getResponse.data.values || [];
    let rowIndex = -1;

    // Find row dengan registration ID yang cocok
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === registrationId) {
        rowIndex = i + 1; // Sheets API uses 1-based index
        break;
      }
    }

    if (rowIndex === -1) {
      return {
        success: false,
        error: "Registration ID tidak ditemukan",
      };
    }

    // Check if already attended
    if (rows[rowIndex - 1][5] === "HADIR") {
      return {
        success: false,
        error: "Peserta sudah melakukan check-in sebelumnya",
        alreadyAttended: true,
      };
    }

    // 2. Update status menjadi HADIR
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!F${rowIndex}`, // Column F = Status
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["HADIR"]],
      },
    });

    // 3. Update timestamp check-in di column G
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!G${rowIndex}`, // Column G = Check-in Time
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })],
        ],
      },
    });

    return {
      success: true,
      data: {
        id: rows[rowIndex - 1][0],
        name: rows[rowIndex - 1][1],
        email: rows[rowIndex - 1][2],
        phone: rows[rowIndex - 1][3],
      },
    };
  } catch (error) {
    console.error("Error updating attendance:", error);
    return {
      success: false,
      error: "Gagal mengupdate status kehadiran",
    };
  }
}
