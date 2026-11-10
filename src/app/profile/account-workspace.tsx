"use client";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./account-workspace.module.css";

const sections = [{ id: "details", label: "Details" }, { id: "notifications", label: "Notifications" }, { id: "reviews", label: "Reviews" }] as const;
type Section = typeof sections[number]["id"];

export function AccountWorkspace({ name, email, shortcut, details, notifications, reviews }: {
  name: string; email: string; shortcut?: ReactNode;
  details: ReactNode; notifications: ReactNode; reviews: ReactNode;
}) {
  const [active, setActive] = useState<Section>("details");
  const [vertical, setVertical] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() : email.slice(0, 1).toUpperCase() || "H";

  useEffect(() => {
    const syncSection = () => {
      const hash = window.location.hash.slice(1);
      setActive(sections.find(section => section.id === hash)?.id ?? "details");
    };
    const media = window.matchMedia("(min-width: 1024px)");
    const syncOrientation = () => setVertical(media.matches);
    syncSection();
    syncOrientation();
    window.addEventListener("hashchange", syncSection);
    media.addEventListener("change", syncOrientation);
    return () => {
      window.removeEventListener("hashchange", syncSection);
      media.removeEventListener("change", syncOrientation);
    };
  }, []);

  function select(section: Section) {
    setActive(section);
    if (window.location.hash !== "#" + section) window.history.pushState(null, "", "#" + section);
  }
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = sections.length - 1;
    else if (event.key === (vertical ? "ArrowDown" : "ArrowRight")) next = (index + 1) % sections.length;
    else if (event.key === (vertical ? "ArrowUp" : "ArrowLeft")) next = (index - 1 + sections.length) % sections.length;
    else return;
    event.preventDefault();
    select(sections[next].id);
    tabs.current[next]?.focus();
  }

  const panels = { details, notifications, reviews };
  return <div className="mx-auto max-w-6xl py-2">
    <header className="mb-8 border-b border-line pb-6">
      <h1 className="display mb-6 text-4xl text-ink">Your account</h1>
      <div className="flex min-w-0 items-center gap-4">
        <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg font-semibold text-secondary-fg">{initials}</span>
        <div className="min-w-0"><p className="break-words text-lg font-semibold text-ink">{name.trim() || "Your profile"}</p><p className="mt-1 break-all text-sm text-muted">{email}</p></div>
      </div>
    </header>
    {shortcut}
    <div className="grid items-start gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
      <div role="tablist" aria-label="Account sections" aria-orientation={vertical ? "vertical" : "horizontal"} className="flex min-w-0 gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:pb-0">
        {sections.map((section, index) => <button key={section.id} ref={element => { tabs.current[index] = element; }} type="button" role="tab" id={"account-tab-" + section.id} aria-controls={section.id} aria-selected={active === section.id} tabIndex={active === section.id ? 0 : -1} onClick={() => select(section.id)} onKeyDown={event => navigate(event, index)} className={"min-h-11 shrink-0 whitespace-nowrap rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors " + (active === section.id ? "border-secondary bg-secondary text-secondary-fg" : "border-transparent text-ink-soft hover:bg-raised hover:text-ink")}>{section.label}</button>)}
      </div>
      <div className="min-w-0 rounded-2xl border border-line bg-card p-5 sm:p-8">
        {sections.map(section => <section key={section.id} id={section.id} role="tabpanel" aria-labelledby={"account-tab-" + section.id} tabIndex={0} hidden={active !== section.id} className={styles.panel + " scroll-mt-24"}>
          <h2 className="display mb-6 text-2xl text-ink">{section.id === "details" ? "Your details" : section.id === "reviews" ? "Your reviews" : section.label}</h2>
          {panels[section.id]}
        </section>)}
      </div>
    </div>
  </div>;
}
