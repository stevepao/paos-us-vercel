import { renderWordPressHtml } from "@/lib/html";

type WordPressContentProps = {
  html?: string | null;
};

export function WordPressContent({ html }: WordPressContentProps) {
  const safeHtml = renderWordPressHtml(html);

  if (!safeHtml) {
    return null;
  }

  return (
    <div
      className="wp-content"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
