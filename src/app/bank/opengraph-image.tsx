import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createBrandOgImage,
} from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Banks in Australia";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return createBrandOgImage({
    eyebrow: "Bank Directory",
    title: "Browse banks in Australia by brand, branch, and ATM coverage.",
    subtitle:
      "Compare major, regional, digital, and mutual banks with linked state and suburb-level pages.",
    theme: "amber",
    stats: [
      { label: "Directory", value: "Banks" },
      { label: "Market", value: "Australia" },
      { label: "Use Case", value: "Compare Coverage" },
    ],
  });
}
