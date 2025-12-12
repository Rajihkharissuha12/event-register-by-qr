"use server";

import { google } from "googleapis";

export async function updateAttendanceStatus(
  registrationId: string,
  registrationType: "vip" | "reguler"
) {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    // A: ID, B: NAMA, C: EMAIL, D: NO HP, E: Type, F: Tgl Regist,
    // G: Status Kehadiran, H: Tgl Checkin, I: Link QR, J: Kuota, K: Kategori
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: registrationType === "vip" ? "Vip!A:K" : "Reguler!A:K",
    });

    const normalizeId = (id: string) => String(Number(id));

    const rows = getResponse.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      const sheetId = rows[i][0]; // ID di kolom A
      if (!sheetId) continue;

      if (normalizeId(sheetId) === normalizeId(registrationId)) {
        rowIndex = i + 1; // 1-based
        break;
      }
    }

    if (rowIndex === -1) {
      return {
        success: false,
        error: "Registration ID tidak ditemukan",
      };
    }

    const row = rows[rowIndex - 1];

    const name = row[1]; // B
    const type = row[4]; // E
    const status = row[6]; // G
    const kuotaRaw = row[9]; // J
    const currentKuota = Number(kuotaRaw) || 0;

    if (
      String(type).toLowerCase() === "reguler" &&
      String(status).toUpperCase() === "HADIR"
    ) {
      return {
        success: false,
        error: `Peserta "${name}" sudah melakukan check-in.`,
      };
    }

    // jika ada angka kuota dan sudah 0 → tolak checkin
    if (type === "vip" && kuotaRaw !== undefined && currentKuota <= 0) {
      return {
        success: false,
        error: `Check-in untuk sponsor "${name}" sudah maksimal.`,
      };
    }

    // hitung kuota baru jika ada kuota dan type vip
    let newKuota = kuotaRaw;
    if (kuotaRaw !== undefined && String(type).toLowerCase() === "vip") {
      newKuota = currentKuota > 0 ? currentKuota - 1 : 0;
    }

    const now = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
    });

    // status HADIR boleh di-set tiap scan; kuota yang jadi pembatas
    const updatedRow = [
      row[0], // A: ID
      row[1], // B: NAMA
      row[2], // C: EMAIL
      row[3], // D: NO HP
      row[4], // E: Type
      row[5], // F: Tanggal Regist
      status === "Tidak Hadir" ? "Belum Hadir" : "HADIR", // G: Status Kehadiran
      now, // H: Tanggal Checkin
      row[8], // I: Link QR
      status === "Tidak Hadir" ? kuotaRaw : newKuota, // J: Kuota
      row[10], // K: Kategori
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range:
        registrationType === "vip"
          ? `Vip!A${rowIndex}:K${rowIndex}`
          : `Reguler!A${rowIndex}:K${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [updatedRow],
      },
    });

    return {
      success: true,
      data: {
        id: updatedRow[0],
        name: updatedRow[1],
        email: updatedRow[2],
        phone: updatedRow[3],
        type: updatedRow[4],
        kuota: updatedRow[9],
      },
    };
  } catch (error) {
    // console.error("Error updating attendance:", error);
    return {
      success: false,
      error: "Gagal mengupdate status kehadiran",
    };
  }
}
