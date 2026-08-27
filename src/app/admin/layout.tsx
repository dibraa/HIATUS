import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Belt and braces: src/proxy.ts gates /admin/* at the request boundary and
  // RLS gates the data. This is the third check, and the cheapest to keep.
  if (profile?.role !== "admin") redirect("/");

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        Staff area
      </p>
      <AdminNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
