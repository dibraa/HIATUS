type OneSignal = {
  init(options: Record<string, unknown>): Promise<void>;
  login(id: string): Promise<void>; logout(): Promise<void>;
  setConsentGiven(value: boolean): Promise<void>;
  Notifications: { requestPermission(): Promise<boolean>; permission: boolean };
  User: { PushSubscription: { optedIn: boolean; optIn(): Promise<void>; optOut(): Promise<void> } };
};
export const ONE_SIGNAL_DEVICE_KEY = "hiatus-onesignal-device";
let generation = 0;
let activeAlias: string | null = null;
let sdk: OneSignal | null = null, initializedApp: string | null = null, loading: Promise<OneSignal> | null = null;
export function stopOneSignal() {
  generation++;
  activeAlias = null;
  if (sdk) void sdk.setConsentGiven(false).catch(() => {});
  if ("serviceWorker" in navigator) void navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.filter(r => new URL(r.scope).pathname === "/onesignal/").map(r => r.unregister()))).catch(() => {});
}
export async function enableOneSignal(): Promise<OneSignal> {
  const started = generation;
  const response = await fetch("/api/integrations/push-identity", { cache: "no-store" });
  if (!response.ok) throw new Error("Sign in as a customer and check that OneSignal is enabled.");
  const identity = await response.json() as { app_id: string; external_id: string };
  if (initializedApp && initializedApp !== identity.app_id) throw new Error("Push configuration changed. Reload this page.");
  if (!loading) loading = new Promise<OneSignal>((resolve, reject) => {
    let expired = false;
    const timer = setTimeout(() => { expired = true; loading = null; reject(new Error("Push provider could not load. Try again.")); }, 15000);
    const target = window as Window & { OneSignalDeferred?: ((instance: OneSignal) => void)[] };
    target.OneSignalDeferred = target.OneSignalDeferred || [];
    target.OneSignalDeferred.push(async instance => {
      if (expired) return;
      try {
        if (!initializedApp) {
          await instance.init({ appId: identity.app_id, requiresUserPrivacyConsent: true, serviceWorkerPath: "/onesignal/OneSignalSDKWorker.js", serviceWorkerParam: { scope: "/onesignal/" }, allowLocalhostAsSecureOrigin: location.hostname === "localhost", autoResubscribe: false, welcomeNotification: { disable: true }, notifyButton: { enable: false }, promptOptions: { slidedown: { prompts: [{ type: "push", autoPrompt: false }] } } });
          initializedApp = identity.app_id;
        }
        if (expired) { await instance.setConsentGiven(false); return; }
        sdk = instance; clearTimeout(timer); resolve(instance);
      } catch { clearTimeout(timer); loading = null; reject(new Error("Push provider setup failed. Check its site configuration.")); }
    });
    if (!document.querySelector('#hiatus-onesignal-sdk')) {
      const script = document.createElement("script"); script.id = "hiatus-onesignal-sdk"; script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"; script.defer = true;
      script.onerror = () => { expired = true; clearTimeout(timer); loading = null; script.remove(); reject(new Error("Push provider could not load. Try again.")); }; document.head.appendChild(script);
    }
  });
  const instance = await loading;
  // Refresh policy before activating a late-loading SDK.
  const check = await fetch("/api/integrations/push-identity", { cache: "no-store" });
  if (!check.ok) { stopOneSignal(); throw new Error("Push notifications are disabled."); }
  const fresh = await check.json() as typeof identity;
  if (fresh.app_id !== initializedApp) { stopOneSignal(); throw new Error("Push configuration changed. Reload this page."); }
  if (started !== generation) throw new Error("Notification settings changed. Try again.");
  await instance.setConsentGiven(true);
  if (started !== generation) { await instance.setConsentGiven(false); throw new Error("Notifications are disabled."); }
  if (activeAlias !== fresh.external_id) { await instance.login(fresh.external_id); activeAlias = fresh.external_id; }
  return instance;
}
