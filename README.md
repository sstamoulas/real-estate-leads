# Georgia Stavrou Rentals

Static rental lead-generation site for Georgia Stavrou / Coldwell Banker.

## Install

```bash
npm install
```

## Lead delivery

The contact form is wired to a Netlify Function at `/.netlify/functions/send-lead`.
That function uses Nodemailer over Brevo SMTP and sends the lead to your inbox.

Set these environment variables in your Netlify site settings:

- `BREVO_SMTP_USER`
- `BREVO_SMTP_PASS`
- `BREVO_SMTP_HOST` optional, defaults to `smtp-relay.brevo.com`
- `BREVO_SMTP_PORT` optional, defaults to `587`
- `BREVO_SMTP_SECURE` optional, set to `true` for port `465`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `LEAD_RECIPIENT_EMAIL`

Defaults in the function target `georgia07.realtor@gmail.com`, but Brevo still
requires a verified sender address.

## Local fallback

If the Netlify Function is not available, the form falls back to the visitor's
email app with the lead details prefilled.

## Files

- `index.html` for the page structure
- `styles.css` for the visual system
- `script.js` for the lead form and dynamic content
- `site-config.js` for business details and listings
- `netlify/functions/send-lead.js` for the SMTP relay
