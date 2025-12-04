declare module "midtrans-client" {
  interface SnapOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface ItemDetail {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }

  interface CustomerDetails {
    first_name: string;
    email: string;
    phone: string;
  }

  interface TransactionParameter {
    transaction_details: TransactionDetails;
    item_details: ItemDetail[];
    customer_details: CustomerDetails;
  }

  interface TransactionResponse {
    token: string;
    redirect_url: string;
  }

  class Snap {
    constructor(options: SnapOptions);
    createTransactionToken(parameter: TransactionParameter): Promise<string>;
    createTransaction(
      parameter: TransactionParameter
    ): Promise<TransactionResponse>;
  }

  export { Snap };
}

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: MidtransResult) => void;
          onPending?: (result: MidtransResult) => void;
          onError?: (result: MidtransResult) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export interface MidtransResult {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  pdf_url?: string;
  finish_redirect_url?: string;
}

export interface PaymentRequest {
  ticketType: "regular" | "vip";
  name: string;
  email: string;
  phone: string;
  amount: number;
}

export interface PaymentResponse {
  success: boolean;
  token?: string;
  redirectUrl?: string; // Tambahkan ini
  orderId?: string;
  error?: string;
}
