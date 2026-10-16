"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import { AdminIcon } from "@/components/admin-icon";
import { SignOutButton } from "@/components/sign-out-button";

type AdminAccount = { full_name?: string | null; email?: string | null };

function SidebarContent({ account, onNavigate }: { account: AdminAccount; onNavigate?: () => void }) {
  return (
    <>
      <div className="admin-brand">
        <Image src="/logo.png" alt="" width={44} height={44} className="admin-brand-logo" />
        <div><span className="admin-brand-name">HIATUS</span><span className="admin-brand-caption">Administration</span></div>
      </div>
      <AdminNav onNavigate={onNavigate} />
      <div className="admin-account">
        <span className="admin-account-role">Admin account</span>
        <p className="admin-account-name">{account.full_name || "Administrator"}</p>
        {account.email && <p className="admin-account-email">{account.email}</p>}
        <SignOutButton />
      </div>
    </>
  );
}

export function AdminSidebar({ account }: { account: AdminAccount }) {
  const drawer = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef("");
  const [isOpen, setIsOpen] = useState(false);

  function close() { drawer.current?.close(); }

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const dialog = drawer.current;
    const onResize = () => { if (desktop.matches) dialog?.close(); };
    desktop.addEventListener("change", onResize);
    return () => {
      desktop.removeEventListener("change", onResize);
      if (dialog?.open) document.body.style.overflow = previousOverflow.current;
    };
  }, []);

  return (
    <>
      <aside className="admin-sidebar"><SidebarContent account={account} /></aside>
      <div className="admin-mobile-bar">
        <span className="admin-mobile-brand">HIATUS <span>Admin</span></span>
        <button ref={menuButton} type="button" className="admin-menu-button" aria-haspopup="dialog" aria-expanded={isOpen} aria-controls="admin-navigation-drawer" onClick={() => {
          previousOverflow.current = document.body.style.overflow;
          drawer.current?.showModal();
          document.body.style.overflow = "hidden";
          setIsOpen(true);
        }}><AdminIcon name="bars" />Menu</button>
      </div>
      <dialog ref={drawer} id="admin-navigation-drawer" aria-label="Admin navigation" className="admin-drawer" onClick={(event) => { if (event.target === event.currentTarget) close(); }} onClose={() => {
        document.body.style.overflow = previousOverflow.current;
        setIsOpen(false);
        if (window.innerWidth < 1024) menuButton.current?.focus();
      }}>
        <div className="admin-drawer-content">
          <button type="button" className="admin-drawer-close" onClick={close} aria-label="Close navigation"><AdminIcon name="close" /></button>
          <SidebarContent account={account} onNavigate={close} />
        </div>
      </dialog>
    </>
  );
}
