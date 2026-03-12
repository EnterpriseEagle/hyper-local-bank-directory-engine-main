import type { PortfolioWeeklyReport, WeeklyReport } from "./revenue";

/**
 * Sends the legacy single-site weekly digest email.
 * Uses Resend API. Falls back to console logging if email env vars are missing.
 */
export async function sendWeeklyEmail(report: WeeklyReport): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.REPORT_EMAIL;
  const html = buildLegacyEmailHtml(report);

  if (!apiKey || !toEmail) {
    console.log("[email] No RESEND_API_KEY or REPORT_EMAIL set. Logging report:");
    console.log(JSON.stringify(report, null, 2));
    return false;
  }

  const weekLabel = `${formatDate(report.weekStart)} - ${formatDate(report.weekEnd)}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BANK NEAR ME <reports@banknearme.com.au>",
        to: [toEmail],
        subject: `Weekly Report: ${report.totalClicks} clicks | ~$${report.estimatedRevenue.toFixed(
          0
        )} est. revenue | ${weekLabel}`,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[email] Resend API error:", errorText);
      return false;
    }

    console.log("[email] Weekly report sent to", toEmail);
    return true;
  } catch (error) {
    console.error("[email] Failed to send:", error);
    return false;
  }
}

/**
 * Sends the portfolio-wide weekly digest email for the affiliate control plane.
 */
export async function sendPortfolioWeeklyEmail(
  report: PortfolioWeeklyReport
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.REPORT_EMAIL;
  const html = buildPortfolioEmailHtml(report);

  if (!apiKey || !toEmail) {
    console.log("[email] No RESEND_API_KEY or REPORT_EMAIL set. Logging portfolio report:");
    console.log(JSON.stringify(report, null, 2));
    return false;
  }

  const weekLabel = `${formatDate(report.weekStart)} - ${formatDate(report.weekEnd)}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NEAR ME NETWORK <reports@banknearme.com.au>",
        to: [toEmail],
        subject: `${report.portfolioName}: ${report.totalClicks} clicks | ~$${report.estimatedRevenue.toFixed(
          0
        )} est. revenue | ${weekLabel}`,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[email] Resend API error:", errorText);
      return false;
    }

    console.log("[email] Portfolio report sent to", toEmail);
    return true;
  } catch (error) {
    console.error("[email] Failed to send portfolio report:", error);
    return false;
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildLegacyEmailHtml(report: WeeklyReport): string {
  const weekLabel = `${formatDate(report.weekStart)} - ${formatDate(report.weekEnd)}`;

  const offerRows = report.clicksByOffer
    .sort((a, b) => b.clicks - a.clicks)
    .map(
      (offer) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px">${offer.brand}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px;text-align:right;font-weight:600">${offer.clicks}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#16a34a;font-size:14px;text-align:right;font-weight:600">$${offer.estRevenue.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const placementRows = report.clicksByPlacement
    .sort((a, b) => b.clicks - a.clicks)
    .map(
      (placement) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px">${placement.placement}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px;text-align:right;font-weight:600">${placement.clicks}</td>
      </tr>`
    )
    .join("");

  const topPageRows = report.topPages
    .slice(0, 5)
    .map(
      (page) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px">${page.pageUrl}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px;text-align:right;font-weight:600">${page.clicks}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:32px;margin-bottom:16px;text-align:center">
      <h1 style="color:#111;font-size:14px;letter-spacing:3px;text-transform:uppercase;margin:0;font-weight:700">BANK NEAR ME</h1>
      <p style="color:#6b7280;font-size:13px;margin:8px 0 0">Weekly Revenue Report</p>
      <p style="color:#9ca3af;font-size:12px;margin:4px 0 0">${weekLabel}</p>
    </div>

    <div style="margin-bottom:16px">
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
    </div>

    ${
      report.confirmedRevenue > 0
        ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:16px;text-align:center">
      <span style="color:#16a34a;font-size:15px;font-weight:600">Confirmed: $${report.confirmedRevenue.toFixed(
        2
      )} from ${report.confirmedConversions} conversion${report.confirmedConversions !== 1 ? "s" : ""}</span>
    </div>
    `
        : ""
    }

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

    <div style="text-align:center;padding:16px 0">
      <p style="color:#9ca3af;font-size:11px;margin:0">BANK NEAR ME · Automated Weekly Report</p>
      <p style="color:#d1d5db;font-size:10px;margin:4px 0 0">banknearme.com.au</p>
    </div>
  </div>
</body>
</html>`;
}

function buildPortfolioEmailHtml(report: PortfolioWeeklyReport): string {
  const weekLabel = `${formatDate(report.weekStart)} - ${formatDate(report.weekEnd)}`;

  const siteRows = report.sites
    .map(
      (site) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px">
          <div style="font-weight:600">${site.displayName}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px">${site.primaryDomain ?? "Domain pending"}</div>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px;text-align:right">${site.totalClicks}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#16a34a;font-size:14px;text-align:right">$${site.estimatedRevenue.toFixed(2)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:13px;text-align:right">${site.topOfferLabel ?? "-"}</td>
      </tr>`
    )
    .join("");

  const offerRows = report.topOffers
    .map(
      (offer) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px">${offer.label}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px;text-align:right">${offer.clicks}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#16a34a;font-size:14px;text-align:right">$${offer.estimatedRevenue.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const pageRows = report.topPages
    .map(
      (page) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px">${page.displayName}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:12px">${page.pageUrl}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px;text-align:right">${page.clicks}</td>
      </tr>`
    )
    .join("");

  const alertRows = report.policyAlerts
    .slice(0, 6)
    .map(
      (alert) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111;font-size:14px">${alert.displayName}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#b45309;font-size:13px;text-transform:uppercase">${alert.severity}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:12px">${alert.message}</td>
      </tr>`
    )
    .join("");

  const noteItems = report.infrastructureNotes
    .slice(0, 8)
    .map(
      (note) =>
        `<li style="margin:0 0 8px;color:#374151;font-size:13px;line-height:1.5">${note}</li>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:720px;margin:0 auto;padding:32px 16px">
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:32px;margin-bottom:16px;text-align:center">
      <p style="color:#2563eb;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;font-weight:700">Weekly Control Plane</p>
      <h1 style="color:#111;font-size:28px;line-height:1.1;margin:0">${report.portfolioName}</h1>
      <p style="color:#6b7280;font-size:13px;margin:8px 0 0">Portfolio summary for ${weekLabel}</p>
    </div>

    <div style="margin-bottom:16px">
      <table role="presentation" width="100%" style="border-collapse:collapse">
        <tr>
          <td style="width:25%;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px 0 0 8px;padding:20px 12px;text-align:center;vertical-align:top">
            <div style="color:#16a34a;font-size:28px;font-weight:700;line-height:1">$${report.estimatedRevenue.toFixed(0)}</div>
            <div style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:6px">Est. Revenue</div>
          </td>
          <td style="width:25%;background:#ffffff;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:20px 12px;text-align:center;vertical-align:top">
            <div style="color:#111;font-size:28px;font-weight:700;line-height:1">${report.totalClicks}</div>
            <div style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:6px">Clicks</div>
          </td>
          <td style="width:25%;background:#ffffff;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:20px 12px;text-align:center;vertical-align:top">
            <div style="color:#111;font-size:28px;font-weight:700;line-height:1">${report.totalSites}</div>
            <div style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:6px">Sites</div>
          </td>
          <td style="width:25%;background:#ffffff;border:1px solid #e5e7eb;border-radius:0 8px 8px 0;padding:20px 12px;text-align:center;vertical-align:top">
            <div style="color:#2563eb;font-size:28px;font-weight:700;line-height:1">${report.connectedDomains}</div>
            <div style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:6px">Mapped Domains</div>
          </td>
        </tr>
      </table>
    </div>

    ${
      report.confirmedRevenue > 0
        ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:16px;text-align:center">
      <span style="color:#16a34a;font-size:15px;font-weight:600">Confirmed revenue: $${report.confirmedRevenue.toFixed(
        2
      )} from ${report.confirmedConversions} conversion${report.confirmedConversions !== 1 ? "s" : ""}</span>
    </div>
    `
        : ""
    }

    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px">
      <div style="padding:16px;border-bottom:1px solid #e5e7eb">
        <h2 style="color:#111;font-size:14px;font-weight:600;margin:0">Performance by Site</h2>
      </div>
      <table role="presentation" style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;font-weight:600">Site</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;font-weight:600">Clicks</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;font-weight:600">Est. Rev</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;font-weight:600">Top Offer</th>
          </tr>
        </thead>
        <tbody>${siteRows || '<tr><td colspan="4" style="padding:24px 16px;color:#9ca3af;text-align:center;font-size:14px">No site data yet</td></tr>'}</tbody>
      </table>
    </div>

    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px">
      <div style="padding:16px;border-bottom:1px solid #e5e7eb">
        <h2 style="color:#111;font-size:14px;font-weight:600;margin:0">Top Offers</h2>
      </div>
      <table role="presentation" style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;font-weight:600">Offer</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;font-weight:600">Clicks</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;font-weight:600">Est. Rev</th>
          </tr>
        </thead>
        <tbody>${offerRows || '<tr><td colspan="3" style="padding:24px 16px;color:#9ca3af;text-align:center;font-size:14px">No offer activity yet</td></tr>'}</tbody>
      </table>
    </div>

    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px">
      <div style="padding:16px;border-bottom:1px solid #e5e7eb">
        <h2 style="color:#111;font-size:14px;font-weight:600;margin:0">Top Pages</h2>
      </div>
      <table role="presentation" style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;font-weight:600">Site</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;font-weight:600">Page</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;font-weight:600">Clicks</th>
          </tr>
        </thead>
        <tbody>${pageRows || '<tr><td colspan="3" style="padding:24px 16px;color:#9ca3af;text-align:center;font-size:14px">No page activity yet</td></tr>'}</tbody>
      </table>
    </div>

    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px">
      <h2 style="color:#111;font-size:14px;font-weight:600;margin:0 0 12px">Infrastructure Notes</h2>
      <ul style="padding-left:18px;margin:0">${noteItems || '<li style="color:#9ca3af;font-size:13px">No infrastructure notes.</li>'}</ul>
    </div>

    ${
      alertRows
        ? `
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px">
      <div style="padding:16px;border-bottom:1px solid #e5e7eb">
        <h2 style="color:#111;font-size:14px;font-weight:600;margin:0">Policy Alerts</h2>
      </div>
      <table role="presentation" style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;font-weight:600">Site</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;font-weight:600">Severity</th>
            <th style="padding:10px 16px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;font-weight:600">Message</th>
          </tr>
        </thead>
        <tbody>${alertRows}</tbody>
      </table>
    </div>
    `
        : ""
    }

    <div style="text-align:center;padding:16px 0">
      <p style="color:#9ca3af;font-size:11px;margin:0">NEAR ME NETWORK · Automated Weekly Control Plane Report</p>
      <p style="color:#d1d5db;font-size:10px;margin:4px 0 0">reports@banknearme.com.au</p>
    </div>
  </div>
</body>
</html>`;
}
