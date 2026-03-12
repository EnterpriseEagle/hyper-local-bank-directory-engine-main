import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createBrandOgImage,
} from "@/lib/og-image";

export const runtime = "edge";
export const alt = "BANK NEAR ME - Is your bank actually working?";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createBrandOgImage({
    eyebrow: "Live Bank Status",
    title: "Find your bank. See if it is actually working.",
    subtitle:
      "Live suburb-by-suburb tracking for Australian bank branches, ATMs, closures, and community-reported service issues.",
    theme: "blue",
    stats: [
      { label: "Suburbs", value: "15K+" },
      { label: "Branches", value: "4K+" },
      { label: "ATMs", value: "2.9K+" },
    ],
  });
}
