import type { Metadata } from "next";

export const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://goldgeek.com").replace(/\/$/, "");
export const siteName = "Gold Geek";

interface PageMetaInput {
  title: string;
  description: string;
  /** Path relative to the site root, e.g. "/what-we-buy" (use "/" for the home page). */
  path: string;
  /** Use the title verbatim as the document <title>, bypassing the "%s | Gold Geek" template. */
  absoluteTitle?: boolean;
}

/**
 * Build per-page metadata (canonical URL, Open Graph, Twitter card) for the
 * public marketing pages. Keeps titles/descriptions unique per page so they
 * aren't all collapsed into the single site-wide default.
 */
export function pageMetadata({ title, description, path, absoluteTitle }: PageMetaInput): Metadata {
  const url = path === "/" ? siteUrl : `${siteUrl}${path}`;
  const ogTitle = absoluteTitle ? title : `${title} | ${siteName}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
  };
}
