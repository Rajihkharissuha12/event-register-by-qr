import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import TicketClient from "./ticketclient";

export default function TicketPage() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get("d") || "";

  return (
    <Suspense fallback={null}>
      <TicketClient encoded={encoded} />
    </Suspense>
  );
}
