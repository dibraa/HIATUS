"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { PasswordField, TextField } from "@/components/ui/field";

export function PrivacyControls({ isCustomer }: { isCustomer: boolean }) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmWord, setConfirmWord] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadData() {
    setExporting(true);
    try {
      const response = await fetch("/api/account/export", { cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Export failed." }));
        throw new Error(data.error || "Export failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "hiatus-my-data.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Your data export started.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password || undefined, confirm: confirmWord || undefined }),
      });
      const data = await response.json().catch(() => ({ error: "Deletion failed." }));
      if (!response.ok) throw new Error(data.error || "Deletion failed.");
      toast.success("Your account has been deleted.");
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-8 border-t border-line pt-6">
      <h3 className="text-base font-semibold text-ink">Privacy &amp; your data</h3>
      <p className="mt-1 text-sm text-muted">
        Download a JSON copy of your account, orders, and preferences, or review our{" "}
        <a href="/privacy" className="underline underline-offset-4 hover:text-ink">Privacy Notice</a>.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="outline" size="sm" loading={exporting} onClick={downloadData}>
          Download my data (JSON)
        </Button>
        {isCustomer && !confirmOpen && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
            Delete my account
          </Button>
        )}
      </div>

      {isCustomer && confirmOpen && (
        <div className="mt-4 space-y-3 rounded-lg border border-danger/40 bg-danger-soft-bg p-4">
          <p className="text-sm text-danger-soft-fg">
            Deleting your account removes your saved favorites, presets, and notifications, and anonymizes your past orders and reviews.
          </p>
          <PasswordField
            id="delete-account-password"
            label="Current password (if you sign in with a password)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          <TextField
            id="delete-account-confirm"
            label="Or type DELETE (for Google-only accounts)"
            value={confirmWord}
            onChange={(event) => setConfirmWord(event.target.value)}
            placeholder="DELETE"
          />
          {error && <p className="text-xs text-danger-fg">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="danger" size="sm" loading={deleting} onClick={deleteAccount}>
              Confirm account deletion
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={deleting} onClick={() => { setConfirmOpen(false); setError(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
