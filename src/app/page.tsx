// app/page.tsx
import { Suspense, use } from "react";
import PageShell from "./pageclient";
import { TicketType } from "./components/RegistrationSection";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = use(searchParams); // unwrap Promise

  const rawType = (params.type || "").toLowerCase();

  const type: TicketType = rawType === "vip" ? "vip" : "regular";

  return (
    <Suspense fallback={null}>
      <PageShell type={type} />
    </Suspense>
  );
}
