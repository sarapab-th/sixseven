import { site } from "~/config/site";

export interface QuoteEmailData {
  reference: string;
  kind: "3d" | "print" | "contact";
  locale: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  total: number;
  lines: { label: string; value: string }[];
  fileUrl?: string;
  fileName?: string;
  fileSizeMb?: string;
  receivedAt: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function renderQuoteEmail(data: QuoteEmailData): { subject: string; html: string; text: string } {
  const kindLabel =
    data.kind === "3d" ? "3D print" : data.kind === "print" ? "Printing / copying" : "General enquiry";
  const subject =
    data.kind === "contact"
      ? `[${data.reference}] Message from ${data.name}`
      : `[${data.reference}] ${kindLabel} quote — ฿${Math.round(data.total).toLocaleString("en-US")} — ${data.name}`;

  const rows = data.lines
    .map(
      (line) => `
      <tr>
        <td style="padding:7px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #eef0f3;">${escapeHtml(line.label)}</td>
        <td style="padding:7px 0;color:#111827;font-size:13px;text-align:right;border-bottom:1px solid #eef0f3;">${escapeHtml(line.value)}</td>
      </tr>`,
    )
    .join("");

  const fileBlock = data.fileUrl
    ? `<p style="margin:18px 0 0;">
         <a href="${escapeHtml(data.fileUrl)}"
            style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:14px;font-weight:600;">
           Download ${escapeHtml(data.fileName ?? "file")}${data.fileSizeMb ? ` (${data.fileSizeMb} MB)` : ""}
         </a>
       </p>`
    : `<p style="margin:18px 0 0;color:#6b7280;font-size:13px;">No file attached — the customer is bringing originals or will send them separately.</p>`;

  const html = `<!doctype html>
<html><body style="margin:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr><td style="background:linear-gradient(100deg,#00E5FF,#9B5CFF 55%,#FF2E88);padding:20px 24px;">
          <p style="margin:0;color:#06060a;font-size:12px;font-weight:700;letter-spacing:.18em;">SIXSEVEN</p>
          <p style="margin:4px 0 0;color:#06060a;font-size:18px;font-weight:700;">New quote request</p>
        </td></tr>

        <tr><td style="padding:24px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Reference</p>
          <p style="margin:0 0 20px;color:#111827;font-size:20px;font-weight:700;font-family:ui-monospace,SFMono-Regular,monospace;">${escapeHtml(data.reference)}</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="padding:7px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #eef0f3;">Service</td>
              <td style="padding:7px 0;color:#111827;font-size:13px;text-align:right;border-bottom:1px solid #eef0f3;">${escapeHtml(kindLabel)}</td>
            </tr>
            ${rows}
            ${
              data.kind === "contact"
                ? ""
                : `<tr>
              <td style="padding:14px 0 0;color:#111827;font-size:15px;font-weight:700;">Quoted total</td>
              <td style="padding:14px 0 0;color:#111827;font-size:20px;font-weight:700;text-align:right;">฿${Math.round(data.total).toLocaleString("en-US")}</td>
            </tr>`
            }
          </table>

          ${fileBlock}

          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #eef0f3;">
            <p style="margin:0 0 10px;color:#6b7280;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Customer</p>
            <p style="margin:0;color:#111827;font-size:15px;font-weight:600;">${escapeHtml(data.name)}</p>
            ${data.email ? `<p style="margin:4px 0 0;font-size:14px;"><a href="mailto:${escapeHtml(data.email)}" style="color:#2563eb;">${escapeHtml(data.email)}</a></p>` : ""}
            ${data.phone ? `<p style="margin:4px 0 0;color:#374151;font-size:14px;">${escapeHtml(data.phone)}</p>` : ""}
            <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">Site language: ${escapeHtml(data.locale)} · ${escapeHtml(data.receivedAt)}</p>
          </div>

          ${
            data.notes
              ? `<div style="margin-top:18px;padding:14px 16px;background:#f9fafb;border-radius:10px;">
                   <p style="margin:0 0 6px;color:#6b7280;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Notes</p>
                   <p style="margin:0;color:#111827;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(data.notes)}</p>
                 </div>`
              : ""
          }
        </td></tr>

        <tr><td style="padding:16px 24px;background:#fafbfc;border-top:1px solid #eef0f3;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Sent automatically by ${escapeHtml(site.url)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `New quote request — ${data.reference}`,
    `Service: ${kindLabel}`,
    "",
    ...data.lines.map((l) => `${l.label}: ${l.value}`),
    "",
    data.kind === "contact" ? "" : `Quoted total: THB ${Math.round(data.total).toLocaleString("en-US")}`,
    data.fileUrl ? `File: ${data.fileName} — ${data.fileUrl}` : "File: none attached",
    "",
    `Customer: ${data.name}`,
    data.email ? `Email: ${data.email}` : "",
    data.phone ? `Phone/LINE: ${data.phone}` : "",
    `Language: ${data.locale}`,
    `Received: ${data.receivedAt}`,
    data.notes ? `\nNotes:\n${data.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
