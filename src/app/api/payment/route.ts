import { NextRequest, NextResponse } from "next/server";
import Midtrans from "midtrans-client";
import { PaymentRequest, PaymentResponse } from "@/types/midtrans";

export async function POST(
  request: NextRequest
): Promise<NextResponse<PaymentResponse>> {
  try {
    const body: PaymentRequest = await request.json();
    const { ticketType, name, email, phone, amount } = body;

    if (!ticketType || !name || !email || !phone || !amount) {
      return NextResponse.json(
        { success: false, error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const snap = new Midtrans.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY as string,
      clientKey: process.env.MIDTRANS_CLIENT_KEY as string,
    });

    const orderId = `TKT-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      item_details: [
        {
          id: ticketType,
          price: amount,
          quantity: 1,
          name:
            ticketType === "vip"
              ? "Tiket VIP Seminar Event 2025"
              : "Tiket Reguler Seminar Event 2025",
        },
      ],
      customer_details: {
        first_name: name,
        email: email,
        phone: phone,
      },
    };

    // Gunakan createTransaction untuk mendapatkan token DAN redirect_url
    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url, // URL untuk dibuka di browser
      orderId: orderId,
    });
  } catch (error) {
    console.error("Midtrans Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
