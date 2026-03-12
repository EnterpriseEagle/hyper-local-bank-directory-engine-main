import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createBrandOgImage,
} from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Bank Near Me Australia";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createBrandOgImage({
    eyebrow: "Bank Near Me",
    title: "Find a bank near you. Know if it is actually open.",
    subtitle:
      "Search Australian suburbs for branch coverage, nearby ATMs, local closures, and live service signals before you travel.",
    theme: "blue",
    stats: [
      { label: "Intent", value: "Near Me" },
      { label: "Market", value: "Australia" },
      { label: "Coverage", value: "15K+ suburbs" },
    ],
  });
}
