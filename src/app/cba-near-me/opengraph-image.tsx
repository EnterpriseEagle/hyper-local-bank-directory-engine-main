import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createBrandOgImage,
} from "@/lib/og-image";

export const runtime = "edge";
export const alt = "CBA Near Me Australia";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createBrandOgImage({
    eyebrow: "Commonwealth Bank",
    title: "Find a CBA near you across Australia.",
    subtitle:
      "Browse Commonwealth Bank branches, ATMs, suburb coverage, and local alternatives before you head out.",
    theme: "blue",
    stats: [
      { label: "Brand", value: "CBA" },
      { label: "Intent", value: "Near Me" },
      { label: "Market", value: "Australia" },
    ],
  });
}
