"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SavedBackup = {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  createdBy: string;
};

type BackupLog = {
  id: string;
  action: string;
  status: string;
  details: string;
  at: string;
  actor: string;
};

type BackupSchedule = {
  enabled: boolean;
  intervalHours: number;
  retention: number;
};

const HISTORY_PAGE_SIZE = 10;

type HistoryRow =
  | { kind: "backup"; key: string; at: string; backup: SavedBackup }
  | { kind: "event"; key: string; at: string; log: BackupLog };

const DATE_FORMAT = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : DATE_FORMAT.format(date);
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatCadence(hours: number) {
  if (hours < 1) return `every ${Math.max(1, Math.round(hours * 60))} minutes`;
  if (hours === 1) return "hourly";
  if (hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? "daily" : `every ${days} days`;
  }
  return `every ${hours} hours`;
}

function statusTone(status: string): BadgeTone {
  const normalized = status.toLowerCase();
  if (normalized === "success") return "success";
  if (normalized === "warning") return "warning";
  if (normalized === "failed" || normalized === "error") return "danger";
  return "neutral";
}

/**
 * One history: saved backup files plus the events around them.
 *
 * A saved backup already has a matching "Create backup" log entry, so the
 * entry is folded into the backup row instead of shown twice. Restores and
 * warnings have no file to act on, so they stay as event rows. Backups older
 * than the log window still appear because the backup list is the anchor.
 */
function buildHistory(backups: SavedBackup[], logs: BackupLog[]): HistoryRow[] {
  const usedLogs = new Set<string>();
  const rows: HistoryRow[] = backups.map(backup => {
    const match = logs.find(log =>
      !usedLogs.has(log.id) &&
      log.action === "Create backup" &&
      log.details?.includes(backup.filename),
    );
    if (match) usedLogs.add(match.id);
    return { kind: "backup", key: `backup-${backup.id}`, at: backup.createdAt, backup };
  });

  for (const log of logs) {
    if (!usedLogs.has(log.id)) rows.push({ kind: "event", key: `log-${log.id}`, at: log.at, log });
  }

  return rows.sort((a, b) => {
    const difference = new Date(b.at).getTime() - new Date(a.at).getTime();
    if (difference !== 0) return difference;
    return a.kind === b.kind ? 0 : a.kind === "backup" ? -1 : 1;
  });
}

async function fetchBackupData() {
  const response = await fetch("/api/admin/backup/export", { cache: "no-store" });
  const data = await response.json().catch(() => ({ error: "Backup list could not be loaded." }));
  if (!response.ok) throw new Error(data.error || "Backup list could not be loaded.");
  return {
    backups: (data.backups || []) as SavedBackup[],
    logs: (data.logs || []) as BackupLog[],
    schedule: (data.automatic ?? null) as BackupSchedule | null,
  };
}

export function BackupRestore() {
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [backups, setBackups] = useState<SavedBackup[]>([]);
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const history = useMemo(() => buildHistory(backups, logs), [backups, logs]);
  const historyPages = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE));
  // Clamp on read instead of correcting state in an effect, so a shorter
  // history never leaves the table pointing past its last page.
  const currentHistoryPage = Math.min(historyPage, historyPages);
  const visibleRows = history.slice(
    (currentHistoryPage - 1) * HISTORY_PAGE_SIZE,
    currentHistoryPage * HISTORY_PAGE_SIZE,
  );
  const busy = pending || restoringId !== null;

  async function loadBackups() {
    const data = await fetchBackupData();
    setBackups(data.backups);
    setLogs(data.logs);
    setSchedule(data.schedule);
  }

  useEffect(() => {
    let cancelled = false;
    fetchBackupData()
      .then(data => {
        if (cancelled) return;
        setBackups(data.backups);
        setLogs(data.logs);
        setSchedule(data.schedule);
      })
      .catch(error => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Backup list could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function createBackup() {
    setCreating(true);
    try {
      const response = await fetch("/api/admin/backup/export", { method: "POST" });
      const data = await response.json().catch(() => ({ error: "Backup could not be created." }));
      if (!response.ok) throw new Error(data.error || "Backup could not be created.");
      toast.success("Database backup created and saved automatically.");
      await loadBackups();
      setHistoryPage(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backup could not be created.");
    } finally {
      setCreating(false);
    }
  }

  async function restoreSaved(backup: SavedBackup) {
    if (!window.confirm(`Restore “${backup.filename}”? Current database records will be replaced.`)) return;
    setRestoringId(backup.id);
    try {
      const response = await fetch(`/api/admin/backup/${encodeURIComponent(backup.id)}/restore`, { method: "POST" });
      const data = await response.json().catch(() => ({ error: "Restore could not be completed." }));
      if (!response.ok) throw new Error(data.error || "Restore could not be completed.");
      toast.success(`Database restored. ${data.collections ?? 0} collections restored.`);
      await loadBackups();
      setHistoryPage(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restore could not be completed.");
    } finally {
      setRestoringId(null);
    }
  }

  async function downloadSaved(backup: SavedBackup) {
    setDownloadingId(backup.id);
    try {
      const response = await fetch(`/api/admin/backup/${encodeURIComponent(backup.id)}/download`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Backup could not be downloaded." }));
        throw new Error(data.error || "Backup could not be downloaded.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = backup.filename.replace(/\.json$/i, "") + ".zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Backup download started.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backup could not be downloaded.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function restore() {
    if (!file || !confirmed) return;
    setPending(true);
    try {
      const body = new FormData();
      body.set("backup", file);
      const response = await fetch("/api/admin/backup/restore", { method: "POST", body });
      const data = await response.json().catch(() => ({ error: "Restore could not be completed." }));
      if (!response.ok) throw new Error(data.error || "Restore could not be completed.");
      toast.success(`Database restored. ${data.collections ?? 0} collections restored.`);
      setFile(null);
      setConfirmed(false);
      if (fileInput.current) fileInput.current.value = "";
      await loadBackups();
      setHistoryPage(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restore could not be completed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="settings-backup" tabIndex={-1} aria-labelledby="backup-heading" className="admin-settings-card min-w-0">
      <h2 id="backup-heading" className="text-xl font-semibold">Database backup and restore</h2>
      <p className="mt-1.5 text-sm text-muted">
        Admin-only recovery. Backups contain MongoDB records; files in the uploads folder are not included.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-raised p-4">
        <div className="min-w-0">
          <h3 className="display text-xl text-ink">Save a backup</h3>
          <p className="mt-1 text-sm text-muted">
            Snapshot the current database. The file is saved to the server automatically.
          </p>
          {schedule && (
            <p className="mt-2 text-xs text-muted">
              {schedule.enabled
                ? `Automatic backups run ${formatCadence(schedule.intervalHours)} and keep the latest ${schedule.retention}.`
                : "Automatic backups are turned off on the server."}
            </p>
          )}
        </div>
        <Button loading={creating} onClick={createBackup}>Create &amp; save backup</Button>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="display text-xl text-ink">Backup history</h3>
          <p className="text-xs text-muted">
            {history.length === 0 ? "None yet" : `${history.length} ${history.length === 1 ? "entry" : "entries"}`}
          </p>
        </div>

        {history.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed border-line-strong/60 px-4 py-5">
            <p className="text-sm text-muted">
              No backup activity yet. Create one to keep a recoverable copy of the current database.
            </p>
            <Button className="mt-3" size="sm" variant="outline" loading={creating} onClick={createBackup}>
              Create the first backup
            </Button>
          </div>
        ) : (
          <>
            <div className="admin-table-scroll mt-3 hidden sm:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-muted">
                    <th className="px-3 py-2 font-medium">Date &amp; time</th>
                    <th className="px-3 py-2 font-medium">Backup or event</th>
                    <th className="px-3 py-2 font-medium">Size</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map(row => (
                    <tr key={row.key} className="border-b border-line align-top">
                      <td className="whitespace-nowrap px-3 py-3 text-ink-soft">{formatDate(row.at)}</td>
                      <td className="px-3 py-3">
                        {row.kind === "backup" ? (
                          <>
                            <span className="wrap-anywhere font-medium text-ink">{row.backup.filename}</span>
                            <p className="mt-1 wrap-anywhere text-xs text-muted">{row.backup.createdBy}</p>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-ink">{row.log.action}</span>
                              <Badge tone={statusTone(row.log.status)}>{row.log.status}</Badge>
                            </div>
                            {row.log.details && <p className="mt-1 wrap-anywhere text-xs text-muted">{row.log.details}</p>}
                            <p className="mt-1 wrap-anywhere text-xs text-muted">{row.log.actor}</p>
                          </>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted">
                        {row.kind === "backup" ? formatSize(row.backup.size) : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {row.kind === "backup" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              loading={downloadingId === row.backup.id}
                              disabled={downloadingId !== null}
                              aria-label={`Download ${row.backup.filename}`}
                              onClick={() => downloadSaved(row.backup)}
                            >
                              Download
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={restoringId === row.backup.id}
                              disabled={busy}
                              aria-label={`Restore ${row.backup.filename}`}
                              onClick={() => restoreSaved(row.backup)}
                            >
                              Restore
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-3 divide-y divide-line sm:hidden">
              {visibleRows.map(row => (
                <li key={row.key} className="py-3">
                  {row.kind === "backup" ? (
                    <>
                      <p className="wrap-anywhere text-sm font-medium text-ink">{row.backup.filename}</p>
                      <p className="mt-1 wrap-anywhere text-xs text-muted">
                        {formatDate(row.at)} · {formatSize(row.backup.size)} · {row.backup.createdBy}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          loading={downloadingId === row.backup.id}
                          disabled={downloadingId !== null}
                          aria-label={`Download ${row.backup.filename}`}
                          onClick={() => downloadSaved(row.backup)}
                        >
                          Download
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={restoringId === row.backup.id}
                          disabled={busy}
                          aria-label={`Restore ${row.backup.filename}`}
                          onClick={() => restoreSaved(row.backup)}
                        >
                          Restore
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink">{row.log.action}</span>
                        <Badge tone={statusTone(row.log.status)}>{row.log.status}</Badge>
                      </div>
                      <p className="mt-1 wrap-anywhere text-xs text-muted">
                        {formatDate(row.at)} · {row.log.actor}
                      </p>
                      {row.log.details && <p className="mt-1 wrap-anywhere text-xs text-muted">{row.log.details}</p>}
                    </>
                  )}
                </li>
              ))}
            </ul>

            {historyPages > 1 && (
              <nav aria-label="Backup history pages" className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">Page {currentHistoryPage} of {historyPages}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentHistoryPage === 1}
                    onClick={() => setHistoryPage(page => Math.max(1, Math.min(page, historyPages) - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentHistoryPage === historyPages}
                    onClick={() => setHistoryPage(page => Math.min(historyPages, Math.min(page, historyPages) + 1))}
                  >
                    Next
                  </Button>
                </div>
              </nav>
            )}
          </>
        )}
      </div>

      <details className="group mt-6 border-t border-line pt-5">
        <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="display text-xl text-danger">Restore from a file</span>
            <span className="hidden text-xs text-muted sm:inline">Replaces current database records</span>
          </span>
          <span className="ui-caps text-2xs text-muted">
            <span className="group-open:hidden">Open</span>
            <span className="hidden group-open:inline">Close</span>
          </span>
        </summary>

        <div className="mt-3">
          <p className="rounded-md border border-danger/40 bg-danger-soft-bg px-3 py-2 text-sm text-danger-soft-fg">
            This replaces every current database record. Files in the uploads folder are not affected.
          </p>

          <label htmlFor="database-backup-file" className="mt-4 block text-sm font-medium text-ink-soft">
            Backup file
          </label>
          <input
            id="database-backup-file"
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="mt-2 block w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-card file:px-3 file:py-2 file:text-xs file:font-medium file:text-ink"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setConfirmed(false);
            }}
          />
          <label className="mt-3 flex min-h-11 items-start gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--hi-accent)]"
            />
            I understand this will replace current database records.
          </label>
          <Button
            variant="danger"
            className="mt-4"
            disabled={!file || !confirmed || busy}
            loading={pending}
            onClick={restore}
          >
            Restore database
          </Button>
          <p className="mt-3 text-xs text-muted">Accepts a .json Hiatus backup, up to 512 MB.</p>
        </div>
      </details>

    </section>
  );
}
