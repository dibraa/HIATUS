# Browser push: what the Express server needs

The website side of browser push is done (service worker, the "Turn on" switch
on the profile page, and sending the notification when staff change an order's
status). The Express server only has to **store each customer's browser
subscriptions and hand them back**. No push library is needed on the server.

A *subscription* is what a browser gives us when the customer allows
notifications: a URL at Google/Mozilla/Apple (`endpoint`) plus two keys. One
customer can have several (phone, laptop).

## 1. Model — `models/PushSubscription.js`

```js
const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    user_agent: { type: String, default: "" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
```

## 2. Routes

Use the existing JWT middleware (`req.user`) and role check. Names below
assume `requireAuth` and `requireRole(...)`; swap in whatever the server uses.

```js
const PushSubscription = require("../models/PushSubscription");
const NotificationPreferences = require("../models/NotificationPreferences"); // whatever backs /account/notifications
const Order = require("../models/Order");

// Customer saves this browser's subscription. Upsert by endpoint: the same
// browser subscribing again (or a different account on it) takes it over.
router.post("/account/push-subscriptions", requireAuth, async (req, res) => {
  const { endpoint, keys, user_agent } = req.body;
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: "Invalid subscription." });
  }
  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { user_id: req.user.id, endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth }, user_agent: String(user_agent ?? "").slice(0, 200) },
    { upsert: true }
  );
  res.status(201).json({ ok: true });
});

// Customer turns notifications off on this browser. Only their own rows.
router.delete("/account/push-subscriptions", requireAuth, async (req, res) => {
  await PushSubscription.deleteOne({ endpoint: req.body.endpoint, user_id: req.user.id });
  res.json({ ok: true });
});

// Staff/admin, called by the website right before it changes an order's status.
router.get("/orders/:id/push-targets", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const order = await Order.findById(req.params.id).select("status user_id");
  if (!order) return res.status(404).json({ error: "Order not found." });

  const [prefs, subs] = await Promise.all([
    NotificationPreferences.findOne({ user_id: order.user_id }),
    order.user_id ? PushSubscription.find({ user_id: order.user_id }).select("endpoint keys") : [],
  ]);

  res.json({
    status: order.status,
    prefs: {
      order_updates: prefs?.order_updates ?? true, // no row yet = defaults (on)
      ready_alerts: prefs?.ready_alerts ?? true,
    },
    subscriptions: subs.map((s) => ({ endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } })),
  });
});

// Staff/admin: the website reports subscriptions the push service said are gone.
router.post("/push-subscriptions/prune", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const endpoints = Array.isArray(req.body.endpoints) ? req.body.endpoints.filter((e) => typeof e === "string") : [];
  await PushSubscription.deleteMany({ endpoint: { $in: endpoints } });
  res.json({ removed: endpoints.length });
});
```

## 3. Check it

| Request | Who | Expect |
|---|---|---|
| `POST /api/account/push-subscriptions` with `{ endpoint, keys: { p256dh, auth } }` | customer | `201` |
| same, `endpoint: "http://x"` | customer | `400` |
| `DELETE /api/account/push-subscriptions` with `{ endpoint }` | customer | `200`, row gone |
| `GET /api/orders/:id/push-targets` | staff | `{ status, prefs, subscriptions }` |
| `GET /api/orders/:id/push-targets` | customer | `403` — this lists another person's devices |
| `POST /api/push-subscriptions/prune` with `{ endpoints: [...] }` | staff | rows gone |

Walk-in orders without a customer (`user_id` empty) return `subscriptions: []`.

## Nothing else changes

- The website holds the VAPID keys (`.env.local`) and does the sending, so the
  server needs no new environment variables or packages.
- Until these routes exist, everything else keeps working: turning
  notifications on shows "Not found" and undoes itself, and status changes
  simply don't send a push.
