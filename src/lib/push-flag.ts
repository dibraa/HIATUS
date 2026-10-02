/**
 * Browser push on/off switch.
 *
 * Off until the Express API stores subscriptions (docs/push-notifications-
 * backend.md). While off, the profile shows push as "Coming soon" and nothing
 * tries to subscribe or send — so the app can ship before the server half.
 *
 * Set NEXT_PUBLIC_PUSH_ENABLED=true to turn it on. It is a NEXT_PUBLIC_
 * variable, so it is baked in at build time: restart `next dev` or rebuild
 * after changing it.
 */
export const PUSH_ENABLED = process.env.NEXT_PUBLIC_PUSH_ENABLED === "true";
