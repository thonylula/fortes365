import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";

type Schema = Record<string, unknown>;

const organization: Schema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-192.svg`,
  description: SITE_DESCRIPTION,
  areaServed: "BR",
  inLanguage: "pt-BR",
};

const website: Schema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "pt-BR",
};

const softwareApplication: Schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  description: `${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
  url: SITE_URL,
  applicationCategory: "HealthApplication",
  operatingSystem: "Web, iOS, Android",
  inLanguage: "pt-BR",
  offers: [
    {
      "@type": "Offer",
      name: "Plano Mensal",
      price: "14.90",
      priceCurrency: "BRL",
      url: `${SITE_URL}/assinar`,
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Plano Anual",
      price: "99.90",
      priceCurrency: "BRL",
      url: `${SITE_URL}/assinar`,
      availability: "https://schema.org/InStock",
    },
  ],
};

export function JsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [organization, website, softwareApplication],
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
