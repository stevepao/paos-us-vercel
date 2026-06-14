import { getSiteUrl } from "@/lib/env";
import type { SiteSettings } from "@/lib/wordpress";

type SiteJsonLdProps = {
  settings: SiteSettings;
};

type PersonNode = {
  "@type": "Person";
  "@id": string;
  name: string;
  alternateName?: string | string[];
  spouse?: { "@id": string };
  children?: Array<{ "@id": string }>;
  parent?: Array<{ "@id": string }>;
  sameAs?: string[];
};

function getSameAs(envName: string): string[] | undefined {
  const urls = (process.env[envName] ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  return urls.length ? urls : undefined;
}

export function SiteJsonLd({ settings }: SiteJsonLdProps) {
  const siteUrl = getSiteUrl();
  const websiteId = `${siteUrl}/#website`;
  const stephenId = `${siteUrl}/#stephen-pao`;
  const marshaId = `${siteUrl}/#marsha-pao`;
  const christinaId = `${siteUrl}/#christina-pao`;
  const annalisaId = `${siteUrl}/#annalisa-pao`;
  const childRefs = [{ "@id": christinaId }, { "@id": annalisaId }];
  const parentRefs = [{ "@id": stephenId }, { "@id": marshaId }];

  const people: PersonNode[] = [
    {
      "@type": "Person",
      "@id": stephenId,
      name: "Stephen Pao",
      alternateName: "Steve Pao",
      spouse: { "@id": marshaId },
      children: childRefs,
      sameAs: getSameAs("SCHEMA_STEPHEN_PAO_SAME_AS"),
    },
    {
      "@type": "Person",
      "@id": marshaId,
      name: "Marsha Pao",
      alternateName: ["Marsha Kumi Pao", "Marsha Kumi"],
      spouse: { "@id": stephenId },
      children: childRefs,
      sameAs: getSameAs("SCHEMA_MARSHA_PAO_SAME_AS"),
    },
    {
      "@type": "Person",
      "@id": christinaId,
      name: "Christina Pao",
      parent: parentRefs,
      sameAs: getSameAs("SCHEMA_CHRISTINA_PAO_SAME_AS"),
    },
    {
      "@type": "Person",
      "@id": annalisaId,
      name: "Annalisa Pao",
      parent: parentRefs,
      sameAs: getSameAs("SCHEMA_ANNALISA_PAO_SAME_AS"),
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: settings.title,
        description: settings.description,
        url: siteUrl,
        publisher: { "@id": stephenId },
        about: people.map((person) => ({ "@id": person["@id"] })),
      },
      ...people,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
