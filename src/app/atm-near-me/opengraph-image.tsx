import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createBrandOgImage,
} from "@/lib/og-image";

export const runtime = "edge";
export const alt = "ATM Near Me Australia";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createBrandOgImage({
    eyebrow: "ATM Near Me",
    title: "Find an ATM near you. Skip empty and dead machines.",
    subtitle:
      "Search suburb-by-suburb ATM coverage across Australia and compare nearby alternatives before you make the trip.",
    theme: "green",
    stats: [
      { label: "Intent", value: "Cash Access" },
      { label: "Market", value: "Australia" },
      { label: "Coverage", value: "Mapped ATMs" },
    ],
  });
}
