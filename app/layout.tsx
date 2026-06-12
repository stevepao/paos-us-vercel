import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteShell } from "@/components/SiteShell";
import { buildDefaultMetadata } from "@/lib/metadata";
import { getSiteSettings } from "@/lib/wordpress";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildDefaultMetadata(settings);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en">
      <body>
        <SiteShell settings={settings}>{children}</SiteShell>
        <Analytics />
      </body>
    </html>
  );
}
