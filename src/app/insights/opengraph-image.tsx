import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createBrandOgImage,
} from "@/lib/og-image";

export const runtime = "edge";
export const alt = "BANK NEAR ME insights hub";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createBrandOgImage({
    eyebrow: "Banking Insights",
    title: "Editorial pages built from real banking access data.",
    subtitle:
      "Closure intelligence, ATM access guides, network comparisons, and working-bank search support across Australia.",
    theme: "amber",
    stats: [
      { label: "Coverage", value: "Australia" },
      { label: "Articles", value: "5" },
      { label: "Updated", value: "Weekly" },
    ],
  });
}
