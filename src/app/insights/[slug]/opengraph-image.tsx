import { getInsightBySlug } from "@/lib/insight-definitions";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createBrandOgImage,
} from "@/lib/og-image";

export const runtime = "edge";
export const alt = "BANK NEAR ME insight article";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

interface ImageProps {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const insight = getInsightBySlug(slug);

  return createBrandOgImage({
    eyebrow: insight?.category ?? "Banking Insight",
    title: insight?.title ?? "Australian banking insight",
    subtitle:
      insight?.description ??
      "Data-backed reporting on bank access, closures, ATM coverage, and live local service signals across Australia.",
    theme: insight?.category === "Closures" ? "red" : insight?.category === "ATM Access" ? "green" : "amber",
    stats: [
      { label: "Format", value: "Editorial" },
      { label: "Market", value: "Australia" },
      { label: "Source", value: "Directory Data" },
    ],
  });
}
