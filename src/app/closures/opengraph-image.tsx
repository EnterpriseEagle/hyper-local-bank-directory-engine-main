import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createBrandOgImage,
} from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Bank branch closures Australia";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createBrandOgImage({
    eyebrow: "Closures Tracker",
    title: "Track bank branch closures across Australia.",
    subtitle:
      "See the suburbs taking the hit, compare nearby alternatives, and move from closure news into local service coverage fast.",
    theme: "red",
    stats: [
      { label: "Signals", value: "Live" },
      { label: "Market", value: "Australia" },
      { label: "Use Case", value: "Find Alternatives" },
    ],
  });
}
