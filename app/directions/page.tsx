import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";
import { getPageBySlug, getSiteSettings } from "@/lib/wordpress";

const directionsMapSrc =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2794.9179588788056!2d-122.68408978414736!3d45.53185647910181!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x549509fe0fa0b9cd%3A0xefd928847d0762c3!2sCosmopolitan!5e0!3m2!1sen!2sus!4v1540955786127";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([
    getSiteSettings(),
    getPageBySlug("directions"),
  ]);

  return page ? buildPageMetadata(page, settings) : {};
}

export default function DirectionsPage() {
  return (
    <article>
      <h1>Directions</h1>
      <div className="wp-content">
        <p>We’re now living in northwest Portland in the Pearl District!</p>
        <div className="map-embed">
          <iframe
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={directionsMapSrc}
            title="Map to the Pearl District"
          />
        </div>
      </div>
    </article>
  );
}
