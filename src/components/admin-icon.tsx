import type { ReactNode } from "react";

export type AdminIconName = "dashboard" | "orders" | "menu" | "reports" | "team" | "settings" | "close" | "bars" | "back" | "activity";

const paths: Record<AdminIconName, ReactNode> = {
  activity: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  orders: <><path d="M9 4H6a2 2 0 0 0-2 2v14a1 1 0 0 0 1.6.8L8 19l4 2 4-2 2.4 1.8A1 1 0 0 0 20 20V6a2 2 0 0 0-2-2h-3" /><rect x="9" y="2" width="6" height="5" rx="1" /><path d="M8 11h8M8 15h5" /></>,
  menu: <><path d="M4 8h13v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4ZM17 9h2a3 3 0 0 1 0 6h-2M7 2v2m4-2v2m4-2v2" /></>,
  reports: <path d="M4 3v17a1 1 0 0 0 1 1h16M9 16v-5m5 5V7m5 9V4" />,
  team: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m3 11v-3a6 6 0 0 0-3-5" /></>,
  settings: <><path d="M12 3 14 4l2-.3 2 3.5-1 1.8v2l1 1.8-2 3.5-2-.3-2 1-2-1-2 .3-2-3.5 1-1.8v-2l-1-1.8 2-3.5 2 .3Z" transform="translate(0 2)" /><circle cx="12" cy="12" r="3" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  bars: <path d="M4 6h16M4 12h16M4 18h16" />,
  back: <path d="m10 5-7 7 7 7M3 12h18" />,
};

export function AdminIcon({ name }: { name: AdminIconName }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
