"use client";

import { ToastBar, Toaster, type DefaultToastOptions } from "react-hot-toast";

/* react-hot-toast paints white by default, which is a bright card on a dark
   page. Pointing it at the tokens keeps it themed with everything else, in
   both directions, for free. */
const options: DefaultToastOptions = {
  duration: 2500,
  style: {
    background: "var(--hi-card)",
    color: "var(--hi-ink)",
    border: "1px solid var(--hi-line)",
    boxShadow: "var(--hi-shadow-md)",
    fontSize: "0.875rem",
  },
  // Errors are the only place a failure is shown, so they stay long enough
  // to read a full sentence.
  error: { duration: 6000 },
};

/* ...and interrupt a screen reader instead of waiting politely behind what
   it is reading. Set here because every toast() call stamps its own polite
   ariaProps, which win over toastOptions. */
const ERROR_ARIA = { role: "alert", "aria-live": "assertive" } as const;

/**
 * The app's pop-up notifications. A modal <dialog> sits in the browser's top
 * layer and makes the rest of the page inert, so the page-level toaster ends
 * up behind its backdrop and unheard. Dialogs render their own copy
 * (`inDialog`), and globals.css hides the page copy while one is open.
 */
export function AppToaster({ inDialog = false }: { inDialog?: boolean }) {
  return (
    <Toaster
      position="bottom-center"
      containerClassName={inDialog ? "dialog-toaster" : "page-toaster"}
      toastOptions={options}
    >
      {(t) => (
        <ToastBar toast={t.type === "error" ? { ...t, ariaProps: ERROR_ARIA } : t} />
      )}
    </Toaster>
  );
}
