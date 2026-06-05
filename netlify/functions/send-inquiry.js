require('dotenv').config();
const { Resend } = require("resend");

const REQUIRED_FIELDS = ["name", "email", "projectName", "projectDescription"];

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clean(value = "") {
  return String(value).trim();
}

function list(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return clean(value) || "Not specified";
}

function buildHtml(data, audience = "owner") {
  const rows = [
    ["Name", data.name],
    ["Email", data.email],
    ["WhatsApp / Phone", data.phone || "Not provided"],
    ["Company / Project", data.projectName],
    ["Services needed", list(data.services)],
    ["Project stage", data.stage || "Not specified"],
    ["Timeline", data.timeline || "Not specified"],
    ["Budget", data.budget || "Not specified"],
    ["Deadline", data.deadline || "Not specified"],
    ["Reference links / current site", data.links || "Not provided"],
    ["How they found D'SEIKOU", data.discovery || "Not specified"],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #e7e2da;color:#6f6b66;font-size:13px;vertical-align:top;width:34%;">${escapeHtml(label)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #e7e2da;color:#11100f;font-size:14px;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>
  `,
    )
    .join("");

  const intro =
    audience === "client"
      ? `Thanks for reaching out. Here is a copy of the project inquiry you sent to D'SEIKOU.`
      : `A new project inquiry has been submitted through the D'SEIKOU contact page.`;

  return `
  <div style="margin:0;padding:0;background:#efefe9;font-family:Arial,sans-serif;color:#11100f;">
    <div style="max-width:720px;margin:0 auto;padding:32px 18px;">
      <div style="background:#11100f;color:#efefe9;border-radius:22px;padding:26px 24px;margin-bottom:18px;">
        <p style="margin:0 0 10px;color:#be001c;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;">D'SEIKOU Project Inquiry</p>
        <h1 style="margin:0;font-size:28px;line-height:1.15;">${escapeHtml(data.projectName || "New Project")}</h1>
        <p style="margin:12px 0 0;color:#d7d2cc;font-size:14px;line-height:1.65;">${intro}</p>
      </div>

      <div style="background:#ffffff;border:1px solid #e2ddd5;border-radius:22px;overflow:hidden;box-shadow:0 18px 55px rgba(17,16,15,0.08);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          ${rowsHtml}
        </table>
        <div style="padding:20px 22px;">
          <p style="margin:0 0 8px;color:#6f6b66;font-size:13px;font-weight:700;">Project description</p>
          <p style="margin:0;color:#11100f;font-size:15px;line-height:1.75;white-space:pre-line;">${escapeHtml(data.projectDescription)}</p>
        </div>
        ${
          data.deliverables
            ? `
        <div style="padding:0 22px 22px;">
          <p style="margin:0 0 8px;color:#6f6b66;font-size:13px;font-weight:700;">Expected deliverables</p>
          <p style="margin:0;color:#11100f;font-size:15px;line-height:1.75;white-space:pre-line;">${escapeHtml(data.deliverables)}</p>
        </div>`
            : ""
        }
      </div>

      <p style="margin:18px 0 0;text-align:center;color:#6f6b66;font-size:12px;">D'SEIKOU — Design Studio</p>
    </div>
  </div>`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
  if (event.httpMethod !== "POST")
    return json(405, { error: "Method not allowed" });

  const apiKey = process.env.RESEND_API_KEY;
  const contactTo = process.env.CONTACT_TO;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !contactTo || !from) {
    return json(500, {
      error:
        "Email service is not configured. Check RESEND_API_KEY, CONTACT_TO and RESEND_FROM.",
    });
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (error) {
    return json(400, { error: "Invalid JSON body." });
  }

  const normalized = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(clean) : clean(value),
    ]),
  );

  const missing = REQUIRED_FIELDS.filter((field) => !normalized[field]);
  if (missing.length) {
    return json(400, {
      error: `Missing required fields: ${missing.join(", ")}`,
    });
  }

  const resend = new Resend(apiKey);
  const subject = `Project Inquiry: ${normalized.projectName} — ${normalized.name}`;

  try {
    const ownerEmail = await resend.emails.send({
      from,
      to: [contactTo],
      replyTo: normalized.email,
      subject,
      html: buildHtml(normalized, "owner"),
    });

    if (ownerEmail.error) {
      console.error("Owner email error:", ownerEmail.error);
      return json(500, {
        error: ownerEmail.error.message || "Could not send owner email.",
        details: ownerEmail.error,
      });
    }

    const clientEmail = await resend.emails.send({
      from,
      to: [normalized.email],
      replyTo: contactTo,
      subject: `Copy of your D'SEIKOU project inquiry`,
      html: buildHtml(normalized, "client"),
    });

    if (clientEmail.error) {
      console.error("Client email error:", clientEmail.error);
      return json(500, {
        error:
          clientEmail.error.message ||
          "Owner email sent, but client copy failed.",
        details: clientEmail.error,
        ownerEmailId: ownerEmail.data && ownerEmail.data.id,
      });
    }

    return json(200, {
      ok: true,
      message: "Inquiry sent successfully.",
      ownerEmailId: ownerEmail.data && ownerEmail.data.id,
      clientEmailId: clientEmail.data && clientEmail.data.id,
    });
  } catch (error) {
    console.error("Unexpected Resend error:", error);
    return json(500, {
      error:
        error && error.message
          ? error.message
          : "Could not send inquiry right now.",
    });
  }
};
