const STORAGE_KEY = "hiatus-checkout-attempt";
const VALID_KEY = /^[A-Za-z0-9_-]{16,128}$/;

export type AttemptItem = {
  menuItemId: string;
  quantity: number;
  size: string;
};

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function cartFingerprint(items: AttemptItem[]): string {
  return [...items]
    .map((item) => `${item.menuItemId}:${item.size}:${item.quantity}`)
    .sort()
    .join("|");
}

function defaultKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

/**
 * Returns a stable idempotency key for the current cart contents so retrying
 * checkout after a dropped connection or `/session-unavailable` recovery
 * resolves to the same order instead of creating a duplicate.
 */
export function getCheckoutAttemptKey(
  storage: StorageLike | null | undefined,
  items: AttemptItem[],
  generateKey: () => string = defaultKey
): string {
  const fingerprint = cartFingerprint(items);
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { fingerprint?: unknown; key?: unknown };
      if (
        parsed?.fingerprint === fingerprint &&
        typeof parsed.key === "string" &&
        VALID_KEY.test(parsed.key)
      ) {
        return parsed.key;
      }
    }
  } catch {
    // Corrupted or unavailable storage falls through to a fresh key.
  }

  const key = generateKey();
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ fingerprint, key }));
  } catch {
    // Private browsing / full quota: still return the key for this submission.
  }
  return key;
}

export function clearCheckoutAttemptKey(storage: StorageLike | null | undefined): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage access errors.
  }
}
