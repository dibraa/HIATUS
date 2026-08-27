import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import type { Profile } from "@/types/database";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  return (
    <div className="mx-auto max-w-sm py-2">
      <PageHeader
        title="Profile"
        description="How the shop identifies your order at the counter."
      />
      {profile && <ProfileForm profile={profile} email={user!.email ?? ""} />}
    </div>
  );
}
