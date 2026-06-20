const nodemailer = require("nodemailer");

const DEFAULT_RECIPIENT_EMAIL = "georgia07.realtor@gmail.com";
const DEFAULT_SENDER_EMAIL = "georgia07.realtor@gmail.com";
const DEFAULT_SENDER_NAME = "Georgia Stavrou Rentals";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalize(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildTransport() {
  const host = normalize(process.env.BREVO_SMTP_HOST) || "smtp-relay.brevo.com";
  const port = Number(normalize(process.env.BREVO_SMTP_PORT)) || 587;
  const secure =
    String(process.env.BREVO_SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
  const user = normalize(process.env.BREVO_SMTP_USER);
  const pass = normalize(process.env.BREVO_SMTP_PASS);

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

function toDisplayDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return normalize(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function response(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: statusCode === 204 ? "" : JSON.stringify(payload),
  };
}

function buildHtmlEmail(data) {
  const preferredShowing = data.preferredShowing || {};
  const showingDate = normalize(preferredShowing.dateLabel) || toDisplayDate(data.tourDate);
  const showingTime = normalize(preferredShowing.timeLabel) || normalize(data.tourTime);
  const submittedAt = toDisplayDate(data.submittedAt || new Date().toISOString());

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6efe7;color:#161311;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
    <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
      <div style="background:#121715;color:#f6efe7;border-radius:20px;padding:28px 24px;border:1px solid rgba(255,255,255,0.08);">
        <p style="margin:0 0 8px;color:#d7b56f;text-transform:uppercase;letter-spacing:.18em;font-size:12px;font-weight:700;">New rental lead</p>
        <h1 style="margin:0 0 18px;font-size:30px;line-height:1.15;">${escapeHtml(data.name)} requested more information</h1>
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr>
            <td style="padding:8px 0;color:#c8bdb0;width:38%;">Business</td>
            <td style="padding:8px 0;">${escapeHtml(data.businessName)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#c8bdb0;">Brokerage</td>
            <td style="padding:8px 0;">${escapeHtml(data.brokerageName)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#c8bdb0;">Market</td>
            <td style="padding:8px 0;">${escapeHtml(data.market)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#c8bdb0;">Name</td>
            <td style="padding:8px 0;">${escapeHtml(data.name)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#c8bdb0;">Email</td>
            <td style="padding:8px 0;">${escapeHtml(data.email)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#c8bdb0;">Phone</td>
            <td style="padding:8px 0;">${escapeHtml(data.phone)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#c8bdb0;">Need</td>
            <td style="padding:8px 0;">${escapeHtml(data.goal)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#c8bdb0;">Property or neighborhood</td>
            <td style="padding:8px 0;">${escapeHtml(data.location)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#c8bdb0;">Preferred showing</td>
            <td style="padding:8px 0;">${escapeHtml(showingDate)} ${showingTime ? `at ${escapeHtml(showingTime)}` : ""}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#c8bdb0;">Submitted</td>
            <td style="padding:8px 0;">${escapeHtml(submittedAt)}</td>
          </tr>
        </table>
        <div style="margin-top:22px;padding:18px 18px 2px;border-radius:16px;background:rgba(255,255,255,0.05);">
          <p style="margin:0 0 10px;color:#d7b56f;font-weight:700;">Details</p>
          <p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(data.details)}</p>
        </div>
      </div>
      <p style="margin:14px 0 0;color:#6f665d;font-size:12px;text-align:center;">Lead captured from ${escapeHtml(data.pageUrl || "the website")}.</p>
    </div>
  </body>
</html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return response(204, {});
  }

  if (event.httpMethod !== "POST") {
    return response(405, { ok: false, error: "Method not allowed" });
  }

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    return response(400, { ok: false, error: "Invalid JSON payload" });
  }

  if (normalize(body.website) || normalize(body.company)) {
    return response(200, { ok: true });
  }

  const requiredFields = ["name", "email", "phone", "goal", "location", "tourDate", "tourTime", "details"];
  const missingField = requiredFields.find((field) => !normalize(body[field]));
  if (missingField) {
    return response(400, { ok: false, error: `Missing field: ${missingField}` });
  }

  if (!looksLikeEmail(normalize(body.email))) {
    return response(400, {
      ok: false,
      error: "Invalid email address.",
    });
  }

  const transport = buildTransport();
  if (!transport) {
    return response(500, {
      ok: false,
      error: "Missing BREVO_SMTP_USER or BREVO_SMTP_PASS environment variable.",
    });
  }

  const recipientEmail = normalize(process.env.LEAD_RECIPIENT_EMAIL) || DEFAULT_RECIPIENT_EMAIL;
  const senderEmail = normalize(process.env.BREVO_SENDER_EMAIL) || DEFAULT_SENDER_EMAIL;
  const senderName = normalize(process.env.BREVO_SENDER_NAME) || body.businessName || DEFAULT_SENDER_NAME;
  const replyToEmail = normalize(body.email);
  const replyToName = normalize(body.name);
  const preferredShowingDate = normalize(body.preferredShowing?.dateLabel) || normalize(body.tourDate);
  const preferredShowingTime = normalize(body.preferredShowing?.timeLabel) || normalize(body.tourTime);
  const textContent = [
    `New rental lead from ${normalize(body.name)}`,
    "",
    `Business: ${normalize(body.businessName)}`,
    `Brokerage: ${normalize(body.brokerageName)}`,
    `Market: ${normalize(body.market)}`,
    `Name: ${normalize(body.name)}`,
    `Email: ${normalize(body.email)}`,
    `Phone: ${normalize(body.phone)}`,
    `Need: ${normalize(body.goal)}`,
    `Property or neighborhood: ${normalize(body.location)}`,
    `Preferred showing: ${preferredShowingDate}${preferredShowingTime ? ` at ${preferredShowingTime}` : ""}`,
    "",
    "Details:",
    normalize(body.details),
    "",
    `Source: ${normalize(body.pageUrl || "the website")}`,
  ].join("\n");

  const mailOptions = {
    from: {
      name: senderName,
      address: senderEmail,
    },
    to: {
      name: body.ownerName || "Georgia Stavrou",
      address: recipientEmail,
    },
    replyTo: {
      name: replyToName,
      address: replyToEmail,
    },
    subject: `New rental lead from ${normalize(body.name)}`,
    html: buildHtmlEmail(body),
    text: textContent,
    headers: {
      "X-Lead-Source": "Georgia Stavrou Rentals",
      "X-Lead-Type": "Rental inquiry",
    },
  };

  try {
    await transport.sendMail(mailOptions);
  } catch (error) {
    return response(502, {
      ok: false,
      error: "Unable to send the email through Brevo SMTP.",
      details: error instanceof Error ? error.message : String(error),
    });
  }

  return response(200, {
    ok: true,
  });
};
