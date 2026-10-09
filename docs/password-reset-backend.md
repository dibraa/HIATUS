# Password reset: Express implementation

The website side is done: `/forgot-password` asks for an email, and
`/reset-password?token=…` sets the new password. The Express server has to
**create a one-time link, email it, and check it when it comes back**.

The Express server now provides both routes. Configure the SMTP variables in
`server/.env` before using this in production. Without SMTP configuration in
development, the server prints the one-time reset link to its console.

## How it works

1. Customer enters their email → `POST /api/auth/forgot-password`.
2. If an account has that email, the server creates a random token, saves a
   **hash** of it with a 1-hour expiry, and emails
   `${CLIENT_URL}/reset-password?token=<token>`.
3. Customer opens the link, types a new password → `POST /api/auth/reset-password`.
4. Server hashes the token, finds the user, checks it hasn't expired, saves the
   new password (hashed the same way signup does), and clears the token so the
   link can't be used twice.

Rules that matter:

- **Always answer 200 to forgot-password**, whether or not the email exists.
  Otherwise anyone can check which emails are registered.
- **Store only the token's hash.** If the database leaks, the links in it are useless.
- **One hour, one use.** Clear the token after a successful reset.

## 1. User model — add two fields

```js
// models/User.js — inside the existing schema
reset_token_hash: { type: String, default: null, index: true },
reset_token_expires: { type: Date, default: null },
```

## 2. Email sender — `utils/mailer.js`

```bash
npm install nodemailer
```

```js
const nodemailer = require("nodemailer");

// Gmail: turn on 2-step verification, then create an "App password"
// (Google Account → Security → App passwords) and use it as SMTP_PASS.
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,          // smtp.gmail.com
  port: Number(process.env.SMTP_PORT),  // 465
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

exports.sendResetEmail = (to, link) =>
  transport.sendMail({
    from: `"Hiatus Coffee" <${process.env.SMTP_USER}>`,
    to,
    subject: "Reset your Hiatus password",
    text: `Someone asked to reset the password for this account.\n\nSet a new password here (the link works once and expires in 1 hour):\n${link}\n\nIf this wasn't you, ignore this email — your password won't change.`,
  });
```

Add to `server/.env` (and `server/.env.example`, without the real password):

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=the-shop-address@gmail.com
SMTP_PASS=the-16-character-app-password
# CLIENT_URL already exists — it's the website address used in the link
```

## 3. Routes — in the auth router

```js
const crypto = require("crypto");
const User = require("../models/User");
const { sendResetEmail } = require("../utils/mailer");

const hash = (token) => crypto.createHash("sha256").update(token).digest("hex");
const recentRequests = new Map(); // email -> timestamp; simple 1-per-minute limit

router.post("/forgot-password", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email is required." });

  const last = recentRequests.get(email);
  if (last && Date.now() - last < 60_000) {
    return res.status(429).json({ error: "Too many requests." });
  }
  recentRequests.set(email, Date.now());

  // Match how signup stores emails: if it doesn't lowercase them, drop the
  // .toLowerCase() above or this lookup will miss mixed-case accounts.
  const user = await User.findOne({ email });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.reset_token_hash = hash(token);
    user.reset_token_expires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    sendResetEmail(user.email, link).catch((err) => console.error("[reset] email failed:", err.message));
  }

  // Same answer either way — see "Rules that matter".
  res.json({ ok: true });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (typeof token !== "string" || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Invalid request." });
  }

  const user = await User.findOne({
    reset_token_hash: hash(token),
    reset_token_expires: { $gt: new Date() },
  });
  if (!user) return res.status(410).json({ error: "This link has expired or was already used." });

  // Use exactly what signup uses to hash passwords, e.g.:
  user.password = await bcrypt.hash(password, 10);
  user.reset_token_hash = null;
  user.reset_token_expires = null;
  await user.save();

  res.json({ ok: true });
});
```

If the User model hashes the password itself in a `pre("save")` hook, set
`user.password = password` instead of hashing it here — match what signup does.

## 4. Check it

| Request | Expect |
|---|---|
| `POST /api/auth/forgot-password` with a registered email | `200`, email arrives with a `/reset-password?token=…` link |
| same, unregistered email | `200`, no email (same answer on purpose) |
| same email again within a minute | `429` |
| `POST /api/auth/reset-password` with that token + new password | `200`; logging in with the new password works |
| the same token again | `410` |
| a token older than 1 hour | `410` |

## What the website does with each answer

| Server answers | Customer sees |
|---|---|
| forgot `200` | "Check your email — if that address has an account, a link is on its way." |
| forgot `429` | "Too many reset requests. Wait a few minutes…" |
| reset `200` | "Password changed" + Log in button |
| reset `400` / `410` | "This reset link has expired or was already used." + Send a new link |
| either `404` (routes not added yet) | "Password reset by email isn't available yet. Ask at the counter…" |
