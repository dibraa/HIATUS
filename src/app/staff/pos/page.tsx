import { redirect } from "next/navigation";

/** Keep bookmarked POS links pointed at the shared counter workspace. */
export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab, q } = await searchParams;
  const params = new URLSearchParams({
    tab: tab === "paid" || tab === "reversed" ? "history" : "unpaid",
  });
  if (tab === "paid" || tab === "reversed") params.set("payment", tab);
  if (q) params.set("q", q);
  redirect(`/staff?${params}`);
}
