function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export const affiliateFeaturesEnabled = isEnabled(
  process.env.NEXT_PUBLIC_ENABLE_AFFILIATE_FEATURES
);

export const statusReportsEnabled = isEnabled(
  process.env.NEXT_PUBLIC_ENABLE_STATUS_REPORTS
);

export const reportEvidenceEnabled =
  statusReportsEnabled &&
  isEnabled(process.env.NEXT_PUBLIC_ENABLE_REPORT_EVIDENCE);
