"use server";

import { google } from "googleapis";

export async function saveToGoogleSheets(data: {
  id: string;
  name: string;
  email: string;
  phone: string;
  ticketType: "regular" | "vip";
  qrImageUrl?: string;
  kuota?: number;
  sponsorPackage?: string;
}) {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            data.id,
            data.name,
            data.email,
            data.phone,
            data.ticketType,
            new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }), // Registration Time
            "BELUM HADIR", // Status (default)
            "", // Check-in Time (kosong dulu)
            data.qrImageUrl, // QR Image URL
            data.kuota, // Kuota
            data.sponsorPackage, // Sponsor Package
          ],
        ],
      },
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error saving to Google Sheets:", error);
    return { success: false, error: "Failed to save data" };
  }
}
