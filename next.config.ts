import type { NextConfig } from "next";

/**
 * Menu images are always Supabase Storage public URLs from the `menu-images`
 * bucket (see `handleFileChange` in src/app/admin/menu/menu-item-form.tsx), so
 * the only host next/image ever needs is this project's Supabase host.
 *
 * Derived from the env var rather than hardcoded so each environment allows
 * its own project and nothing else. Guarded because the var is absent in
 * lint/CI runs that have no Supabase project attached — in that case there are
 * no menu images to optimise anyway.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const remotePatterns = supabaseUrl
  ? [new URL(`${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/**`)]
  : [];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns,
  },
};

export default nextConfig;
