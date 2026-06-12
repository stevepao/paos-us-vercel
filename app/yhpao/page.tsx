import type { Metadata } from "next";
import { PublicWordPressPage } from "@/components/PublicWordPressPage";
import { buildPageMetadata } from "@/lib/metadata";
import { getPageBySlug, getSiteSettings } from "@/lib/wordpress";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([
    getSiteSettings(),
    getPageBySlug("yhpao"),
  ]);

  return page ? buildPageMetadata(page, settings) : {};
}

export default function YhPaoPage() {
  return <PublicWordPressPage slug="yhpao" />;
}
