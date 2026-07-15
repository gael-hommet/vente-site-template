/**
 * Renders a JSON-LD <script>. Server component (no client JS). Pass an object
 * from src/lib/seo/jsonld. Safe: content is app-controlled structured data.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
