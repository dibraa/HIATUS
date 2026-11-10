# Password reset email

Password setup, password resets, and order receipts use SMTP through Nodemailer.

## Configuration

Set these in server/.env, then restart the backend:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-mailbox@example.com
SMTP_PASS=your-mailbox-app-password
SMTP_FROM=
CLIENT_URL=http://localhost:3000
```

SMTP_FROM is optional when SMTP_USER is an email address. Port 465 uses implicit TLS; other ports require STARTTLS. Gmail app passwords require two-step verification and an eligible account. Never use your regular account password.

Enable **Email delivery** and **Enable password setup and reset email** in Admin Settings. The separate receipt switch controls receipts. Every send checks server-side policy; there is no fallback provider. Original and complete CUSTOM_SMTP_* groups follow the existing custom-credentials rules.

## Reset flow

POST /api/auth/forgot-password creates a random, hashed, one-hour token and sends a link using CLIENT_URL. The request succeeds only after SMTP accepts delivery. A send failure removes only that request's token; newer requests are preserved. POST /api/auth/reset-password verifies the token, updates the password, and retires the token. Existing session and rate-limit rules remain in place.

Public errors are generic. Server logs contain allowlisted SMTP failure codes without credentials, email content or reset tokens. SMTP acceptance does not guarantee inbox placement; check spam and provider delivery logs.
