export type RecaptchaApi = {
  render: (container: HTMLElement, parameters: Record<string, unknown>) => number;
  reset: (widgetId?: number) => void;
  getResponse: (widgetId?: number) => string;
};

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
    __hiatusRecaptchaReady?: () => void;
  }
}

let pending: Promise<RecaptchaApi> | null = null;

function readyApi(): RecaptchaApi | null {
  const api = window.grecaptcha;
  // Google's bootstrap creates grecaptcha before its render/reset API exists.
  return api && typeof api.render === "function" && typeof api.reset === "function" &&
    typeof api.getResponse === "function" ? api : null;
}

/** Share one script across mounts; failed requests can be tried again. */
export function loadRecaptcha(): Promise<RecaptchaApi> {
  const ready = readyApi();
  if (ready) return Promise.resolve(ready);
  if (pending) return pending;

  const request = new Promise<RecaptchaApi>((resolve, reject) => {
    const script = document.createElement("script");
    let complete = false;
    function finish(error?: Error) {
      if (complete) return;
      const api = readyApi();
      if (!error && !api) return;
      complete = true;
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      script.onerror = null;
      // The provider may invoke its callback just after polling observes the
      // API. Leave a no-op instead of removing that callback too early.
      if (window.__hiatusRecaptchaReady === check) window.__hiatusRecaptchaReady = () => {};
      if (error) { script.remove(); reject(error); }
      else resolve(api!);
    }
    function check() { finish(); }
    const timeout = window.setTimeout(() => finish(new Error("Verification took too long to load. Retry verification.")), 15000);
    const poll = window.setInterval(check, 100);
    window.__hiatusRecaptchaReady = check;
    script.src = "https://www.google.com/recaptcha/api.js?onload=__hiatusRecaptchaReady&render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.hiatusRecaptcha = "true";
    script.onerror = () => finish(new Error("Verification could not load. Retry verification. If it keeps failing, contact the shop."));
    try { document.head.appendChild(script); }
    catch { finish(new Error("Verification could not start. Retry verification, or contact the shop.")); }
  });
  pending = request;
  const clearPending = () => { if (pending === request) pending = null; };
  void request.then(clearPending, clearPending);
  return request;
}
