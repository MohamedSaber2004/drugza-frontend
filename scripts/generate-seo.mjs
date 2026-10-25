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
const apiBase = (process.env.VITE_API_BASE_URL || 'https://drugzaapi.runasp.net').replace(/\/+$/, '');
const lastmod = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/catalog', priority: '0.9', changefreq: 'daily' },
  { path: '/flash-sales', priority: '0.8', changefreq: 'daily' },
  { path: '/categories', priority: '0.8', changefreq: 'weekly' },
  { path: '/providers', priority: '0.8', changefreq: 'weekly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' }
];

// Mirrors src/utils/id-crypto.ts with a fixed salt so build output is stable.
const APP_SECRET = 'drugza-route-cipher-v1';
const FIXED_SALT = new Uint8Array([7, 42, 13, 99]);

function hashSeed(input) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function encryptId(id) {
  const salt = FIXED_SALT;
  const seed =
    (hashSeed(APP_SECRET) ^ (salt[0] | (salt[1] << 8) | (salt[2] << 16) | (salt[3] << 24))) >>> 0;
  const rand = mulberry32(seed);
  const plain = new TextEncoder().encode(id);
  const out = new Uint8Array(4 + plain.length);
  out.set(salt, 0);
  for (let i = 0; i < plain.length; i++) {
    out[4 + i] = plain[i] ^ Math.floor(rand() * 256);
  }
  return Buffer.from(out).toString('base64url');
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data?.$values || data;
}

async function loadDynamicRoutes() {
  try {
    const [categories, home] = await Promise.all([
      fetchJson(`${apiBase}/api/Categories?lang=1`),
      fetchJson(`${apiBase}/api/Home/GetHome`)
    ]);

    const categoryRoutes = (Array.isArray(categories) ? categories : [])
      .filter(c => typeof c?.id === 'string' && c.id.trim())
      .map(c => ({
        path: `/categories/${encryptId(c.id)}`,
        priority: '0.6',
        changefreq: 'weekly'
      }));

    const providerRoutes = (Array.isArray(home?.providers) ? home.providers : [])
      .filter(p => typeof p?.id === 'string' && p.id.trim())
      .map(p => ({
        path: `/providers/${encryptId(p.id)}`,
        priority: '0.6',
        changefreq: 'weekly'
      }));

    return [...categoryRoutes, ...providerRoutes];
  } catch (err) {
    console.warn(`[seo] Dynamic routes skipped: ${err.message}`);
    return [];
  }
}

const dynamicRoutes = await loadDynamicRoutes();
const seen = new Set();
const routes = [...staticRoutes, ...dynamicRoutes].filter(route => {
  if (seen.has(route.path)) return false;
  seen.add(route.path);
  return true;
});

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
console.log(`[seo] Generated sitemap.xml (${routes.length} URLs) and robots.txt for ${siteUrl}`);
