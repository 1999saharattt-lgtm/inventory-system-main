import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://rh-inventory-822madau5-inventory-system2.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/issue",
        "/receive",
        "/materials",
        "/material-master",
        "/stock-card",
        "/users",
        "/departments",
        "/sections",
        "/vendors",
      ],
    },

    sitemap: `${baseUrl}/sitemap.xml`,
  };
}