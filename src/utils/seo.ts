import { useI18n } from '@/composables/useI18n';

export const SITE_NAME = 'Drugza';
export const DEFAULT_TITLE = 'Drugza — Your Trusted Pharmacy Marketplace';
export const DEFAULT_DESCRIPTION =
  'Order medicines, medical supplies, and cold-chain products online from verified Egyptian distributors at competitive wholesale prices.';

const DEFAULT_IMAGE_PATH = '/images/drugza-logo.jpg';
const JSON_LD_ID = 'drugza-seo-jsonld';

type JsonLd = Record<string, unknown>;

export interface SeoOptions {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: JsonLd | JsonLd[];
}

function absolute(pathOrUrl: string, origin: string): string {
  try {
    return new URL(pathOrUrl, origin).toString();
  } catch {
    return origin;
  }
}

function ensureMeta(attr: 'name' | 'property', key: string): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  return el;
}

function setMeta(attr: 'name' | 'property', key: string, content?: string): void {
  const el = ensureMeta(attr, key);
  if (content) {
    el.setAttribute('content', content);
  } else {
    el.remove();
  }
}

function setLink(rel: string, href?: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  if (href) {
    el.setAttribute('href', href);
  } else {
    el.remove();
  }
}

export function setSeo(options: SeoOptions = {}): void {
  if (typeof document === 'undefined') return;

  const { locale } = useI18n();
  const isArabic = locale.value === 'ar';
  const origin = window.location.origin;
  const url = absolute(options.path || `${window.location.pathname}${window.location.search}`, origin);
  const image = absolute(options.image || DEFAULT_IMAGE_PATH, origin);
  const title = options.title ? `${options.title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const description = options.description || DEFAULT_DESCRIPTION;

  document.title = title;
  document.documentElement.lang = isArabic ? 'ar' : 'en';
  document.documentElement.dir = isArabic ? 'rtl' : 'ltr';

  setMeta('name', 'description', description);
  setMeta('name', 'robots', options.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  setLink('canonical', url);

  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', options.type || 'website');
  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:image:alt', title);
  setMeta('property', 'og:locale', isArabic ? 'ar_EG' : 'en_US');
  setMeta('property', 'og:locale:alternate', isArabic ? 'en_US' : 'ar_EG');

  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);

  document.getElementById(JSON_LD_ID)?.remove();
  if (options.jsonLd) {
    const payload = Array.isArray(options.jsonLd)
      ? { '@context': 'https://schema.org', '@graph': options.jsonLd }
      : { '@context': 'https://schema.org', ...options.jsonLd };
    const script = document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(payload);
    document.head.appendChild(script);
  }
}

export function buildHomeJsonLd(): JsonLd[] {
  const origin = window.location.origin;
  const organizationId = `${origin}/#organization`;

  return [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: SITE_NAME,
      url: origin,
      logo: `${origin}${DEFAULT_IMAGE_PATH}`,
      description: DEFAULT_DESCRIPTION
    },
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url: origin,
      name: SITE_NAME,
      publisher: { '@id': organizationId },
      inLanguage: ['en', 'ar'],
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${origin}/catalog?search={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    }
  ];
}
