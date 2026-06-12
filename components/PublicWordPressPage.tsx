import { notFound } from "next/navigation";
import { WordPressContent } from "@/components/WordPressContent";
import { stripHtml } from "@/lib/html";
import { getPageBySlug } from "@/lib/wordpress";

type PublicWordPressPageProps = {
  slug: string;
};

export async function PublicWordPressPage({ slug }: PublicWordPressPageProps) {
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <article>
      <h1>{stripHtml(page.title)}</h1>
      <WordPressContent html={page.content} />
    </article>
  );
}
