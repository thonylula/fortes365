import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/assinar`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/cadastro`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/sobre`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/login`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/privacidade`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/termos`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
  return entries;
}
