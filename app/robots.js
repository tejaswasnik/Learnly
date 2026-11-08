import { siteUrl } from "@/lib/server/site-url";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/courses"],
        disallow: ["/api/", "/dashboard", "/instructor", "/learn/", "/me", "/courses/create", "/courses/edit/", "/login", "/register"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
