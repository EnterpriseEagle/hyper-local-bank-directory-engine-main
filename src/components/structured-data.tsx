import type { JsonLd } from "@/lib/seo";

interface StructuredDataProps {
  data: JsonLd | Array<JsonLd | null | undefined> | null | undefined;
}

export function StructuredData({ data }: StructuredDataProps) {
  if (!data) {
    return null;
  }

  const normalized = Array.isArray(data)
    ? data.filter((item): item is JsonLd => Boolean(item))
    : data;

  if (Array.isArray(normalized) && normalized.length === 0) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(normalized),
      }}
    />
  );
}
