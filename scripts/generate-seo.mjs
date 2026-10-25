import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve('dist');
if (!existsSync(distDir)) {
  console.warn('[seo] dist/ not found — run this script after "vite build".');
  process.exit(0);
}

const rawSiteUrl =
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  '';

if (!rawSiteUrl) {
  console.warn(
    '[seo] No site URL found. Set VITE_SITE_URL (e.g. https://drugza.com) to generate sitemap.xml and robots.txt.'
  );
  process.exit(0);
}

const siteUrl = (rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`).replace(/\/+$/, '');
const lastmod = new Date().toISOString().slice(0, 10);

const routes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/catalog', priority: '0.9', changefreq: 'daily' },
  { path: '/flash-sales', priority: '0.8', changefreq: 'daily' },
  { path: '/categories', priority: '0.8', changefreq: 'weekly' },
  { path: '/providers', priority: '0.8', changefreq: 'weekly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' }
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    route => `  <url>
    <loc>${siteUrl}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /auth/
Disallow: /checkout
Disallow: /orders
Disallow: /profile
Disallow: /addresses
Disallow: /favorites

Sitemap: ${siteUrl}/sitemap.xml
`;

writeFileSync(resolve(distDir, 'sitemap.xml'), sitemap, 'utf8');
writeFileSync(resolve(distDir, 'robots.txt'), robots, 'utf8');
console.log(`[seo] Generated sitemap.xml and robots.txt for ${siteUrl}`);
