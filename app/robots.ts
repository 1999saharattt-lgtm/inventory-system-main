import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://rh-inventory.vercel.app";

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