// src/app/ticket/page.tsx
import { Suspense } from "react";
import TicketPageClient from "./ticketclient";

export default function TicketPageWrapper() {
  return (
    <Suspense fallback={null}>
      <TicketPageClient />
    </Suspense>
  );
}
