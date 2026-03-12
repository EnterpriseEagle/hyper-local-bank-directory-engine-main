function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(params: {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.log("[ops-email] Missing RESEND_API_KEY. Email payload:");
    console.log(JSON.stringify(params, null, 2));
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error("[ops-email] Resend error:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[ops-email] Failed to send email:", error);
    return false;
  }
}

export async function sendPayoutOpsSummaryEmail(input: {
  subject: string;
  html: string;
}) {
  const to = process.env.REPORT_EMAIL?.trim();

  if (!to) {
    console.log("[ops-email] Missing REPORT_EMAIL. Summary payload:");
    console.log(JSON.stringify(input, null, 2));
    return false;
  }

  return sendEmail({
    from: process.env.PAYOUT_FROM_EMAIL?.trim() || "NEAR ME NETWORK <ops@banknearme.com.au>",
    to: [to],
    subject: input.subject,
    html: input.html,
  });
}

export async function sendPartnerPayoutEmail(input: {
  to: string;
  subject: string;
  bodyText: string;
}) {
  const reportEmail = process.env.REPORT_EMAIL?.trim();

  return sendEmail({
    from: process.env.PAYOUT_FROM_EMAIL?.trim() || "NEAR ME NETWORK <ops@banknearme.com.au>",
    to: [input.to],
    cc: reportEmail ? [reportEmail] : undefined,
    subject: input.subject,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;color:#111;background:#fff">
        <h1 style="font-size:18px;margin:0 0 16px">Near Me Network payout follow-up</h1>
        <pre style="white-space:pre-wrap;font-family:inherit;line-height:1.6;margin:0">${escapeHtml(
          input.bodyText
        )}</pre>
      </div>
    `,
  });
}
