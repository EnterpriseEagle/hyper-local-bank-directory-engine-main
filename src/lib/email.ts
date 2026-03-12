import type { WeeklyReport } from "./revenue";

/**
 * Sends the weekly digest email.
 * Uses Resend API — set RESEND_API_KEY and REPORT_EMAIL in env.
 * Falls back to console logging if no API key is set.
 */
export async function sendWeeklyEmail(report: WeeklyReport): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.REPORT_EMAIL;

  const html = buildEmailHtml(report);

  if (!apiKey || !toEmail) {
    console.log("[email] No RESEND_API_KEY or REPORT_EMAIL set. Logging report:");
    console.log(JSON.stringify(report, null, 2));
    return false;
  }

  const weekLabel = formatDate(report.weekStart) + " – " + formatDate(report.weekEnd);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BANK NEAR ME <reports@banknearme.com.au>",
        to: [toEmail],
        subject: `Weekly Report: ${report.totalClicks} clicks | ~$${report.estimatedRevenue.toFixed(0)} est. revenue | ${weekLabel}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[email] Resend API error:", errText);
      return false;
    }

    console.log("[email] Weekly report sent to", toEmail);
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function buildEmailHtml(report: WeeklyReport): string {
  const weekLabel = formatDate(report.weekStart) + " – " + formatDate(report.weekEnd);

  const offerRows = report.clicksByOffer
    .sort((a, b) => b.clicks - a.clicks)
    .map(
      (o) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px">${o.brand}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px;text-align:right;font-weight:600">${o.clicks}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#16a34a;font-size:14px;text-align:right;font-weight:600">$${o.estRevenue.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const placementRows = report.clicksByPlacement
    .sort((a, b) => b.clicks - a.clicks)
    .map(
      (p) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px">${p.placement}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px;text-align:right;font-weight:600">${p.clicks}</td>
      </tr>`
    )
    .join("");

  const topPageRows = report.topPages
    .slice(0, 5)
    .map(
      (p) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px">${p.pageUrl}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px;text-align:right;font-weight:600">${p.clicks}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">

    <!-- Header -->
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:32px;margin-bottom:16px;text-align:center">
      <h1 style="color:#111;font-size:14px;letter-spacing:3px;text-transform:uppercase;margin:0;font-weight:700">BANK NEAR ME&reg;</h1>
      <p style="color:#6b7280;font-size:13px;margin:8px 0 0">Weekly Revenue Report</p>
      <p style="color:#9ca3af;font-size:12px;margin:4px 0 0">${weekLabel}</p>
    </div>

    <!-- Hero Stats -->
    <div style="margin-bottom:16px">
      <!--[if mso]><table role="presentation" width="100%"><tr><td width="33%" valign="top"><![endif]-->
      <table role="presentation" width="100%" style="border-collapse:collapse">
        <tr>
          <td style="width:33%;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px 0 0 8px;padding:24px 12px;text-align:center;vertical-align:top">
            <div style="color:#16a34a;font-size:32px;font-weight:700;line-height:1">$${report.estimatedRevenue.toFixed(0)}</div>
            <div style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:6px">Est. Revenue</div>
          </td>
          <td style="width:33%;background:#ffffff;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:24px 12px;text-align:center;vertical-align:top">
            <div style="color:#111;font-size:32px;font-weight:700;line-height:1">${report.totalClicks}</div>
            <div style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:6px">Total Clicks</div>
          </td>
          <td style="width:33%;background:#ffffff;border:1px solid #e5e7eb;border-radius:0 8px 8px 0;padding:24px 12px;text-align:center;vertical-align:top">
            <div style="color:#f59e0b;font-size:32px;font-weight:700;line-height:1">${report.estimatedConversions}</div>
            <div style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:6px">Est. Conversions</div>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </div>

    ${report.confirmedRevenue > 0 ? `
    <!-- Confirmed Revenue -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:16px;text-align:center">
      <span style="color:#16a34a;font-size:15px;font-weight:600">Confirmed: $${report.confirmedRevenue.toFixed(2)} from ${report.confirmedConversions} conversion${report.confirmedConversions !== 1 ? "s" : ""}</span>
    </div>
    ` : ""}

    <!-- By Offer -->
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px">
      <div style="padding:16px;border-bottom:1px solid #e5e7eb">
        <h2 style="color:#111;font-size:14px;font-weight:600;margin:0">Performance by Offer</h2>
      </div>
      <table role="presentation" style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;font-weight:600">Offer</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;font-weight:600">Clicks</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;font-weight:600">Est. Rev</th>
          </tr>
        </thead>
        <tbody>${offerRows || '<tr><td colspan="3" style="padding:24px 16px;color:#9ca3af;text-align:center;font-size:14px">No clicks this week</td></tr>'}</tbody>
      </table>
    </div>

    <!-- By Placement -->
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px">
      <div style="padding:16px;border-bottom:1px solid #e5e7eb">
        <h2 style="color:#111;font-size:14px;font-weight:600;margin:0">Performance by Placement</h2>
      </div>
      <table role="presentation" style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;font-weight:600">Placement</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;font-weight:600">Clicks</th>
          </tr>
        </thead>
        <tbody>${placementRows || '<tr><td colspan="2" style="padding:24px 16px;color:#9ca3af;text-align:center;font-size:14px">No data</td></tr>'}</tbody>
      </table>
    </div>

    <!-- Top Pages -->
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px">
      <div style="padding:16px;border-bottom:1px solid #e5e7eb">
        <h2 style="color:#111;font-size:14px;font-weight:600;margin:0">Top Pages</h2>
      </div>
      <table role="presentation" style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;font-weight:600">Page</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;font-weight:600">Clicks</th>
          </tr>
        </thead>
        <tbody>${topPageRows || '<tr><td colspan="2" style="padding:24px 16px;color:#9ca3af;text-align:center;font-size:14px">No data</td></tr>'}</tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:16px 0">
      <p style="color:#9ca3af;font-size:11px;margin:0">BANK NEAR ME&reg; &middot; Automated Weekly Report</p>
      <p style="color:#d1d5db;font-size:10px;margin:4px 0 0">banknearme.com.au</p>
    </div>
  </div>
</body>
</html>`;
}
