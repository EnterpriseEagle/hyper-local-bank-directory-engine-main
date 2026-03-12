import type { JsonLd } from "@/lib/seo";

interface StructuredDataProps {
  data: JsonLd | JsonLd[] | null;
}

export function StructuredData({ data }: StructuredDataProps) {
  if (!data) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}
