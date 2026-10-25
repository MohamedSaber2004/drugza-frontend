import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const distDir = resolve('dist');
const indexPath = resolve(distDir, 'index.html');

if (!existsSync(indexPath)) {
  console.warn('[seo] dist/index.html not found — run this script after "vite build".');
  process.exit(0);
}

const rawSiteUrl =
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  '';

if (!rawSiteUrl) {
  console.warn('[seo] No site URL found — static route HTML was not generated.');
  process.exit(0);
}

const siteUrl = (rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`).replace(/\/+$/, '');
const baseHtml = readFileSync(indexPath, 'utf8');

const routes = [
  {
    path: '/',
    title: 'Drugza — Trusted Pharmacy Marketplace in Egypt',
    description:
      'Order medicines, medical supplies, and cold-chain products online from verified Egyptian distributors at competitive wholesale prices.',
    h1: 'Drugza — Trusted Pharmacy Marketplace in Egypt',
    intro:
      'Drugza connects pharmacies with EDA-licensed distributors, live wholesale prices, and fast cold-chain delivery across Egypt.',
    arIntro:
      'دراجزا تربط الصيدليات بموزعي الأدوية المعتمدين في مصر، مع أسعار جملة محدثة وتوصيل سريع لسلسلة التبريد.',
    links: [
      ['/catalog', 'Browse all products'],
      ['/categories', 'Browse categories'],
      ['/providers', 'Authorized distributors']
    ]
  },
  {
    path: '/catalog',
    title: 'All Products — Wholesale Medicines & Supplies | Drugza',
    description:
      'Search thousands of medicines, cosmetics, and medical supplies with live wholesale prices from verified Egyptian distributors.',
    h1: 'All Products — Wholesale Medicines & Medical Supplies',
    intro:
      'Search and filter medicines, cosmetics, and medical supplies by name, category, or distributor, and compare live wholesale prices.',
    arIntro:
      'ابحث وفلتر الأدوية ومستحضرات التجميل والمستلزمات الطبية بالاسم أو التصنيف أو الموزع، وقارن أسعار الجملة المحدثة.',
    links: [
      ['/', 'Home'],
      ['/categories', 'Browse categories'],
      ['/providers', 'Authorized distributors']
    ]
  },
  {
    path: '/flash-sales',
    title: 'Flash Sale Deals on Medicines | Drugza',
    description:
      'Limited-time flash sale offers on medicines and medical supplies from verified Egyptian distributors.',
    h1: 'Flash Sale Deals',
    intro:
      'Limited-time wholesale offers on selected medicines and medical supplies. Availability and prices update directly from distributors.',
    arIntro:
      'عروض جملة لفترة محدودة على أدوية ومستلزمات طبية مختارة، والأسعار والتوافر بيتحدثوا مباشرة من الموزعين.',
    links: [
      ['/', 'Home'],
      ['/catalog', 'Browse all products'],
      ['/providers', 'Authorized distributors']
    ]
  },
  {
    path: '/categories',
    title: 'Medicine Categories — Browse by Category | Drugza',
    description:
      'Browse all pharmaceutical categories and discover the verified distributors that stock them.',
    h1: 'Browse Medicine & Medical Supply Categories',
    intro:
      'Explore every pharmaceutical category on Drugza and see the verified distributors that carry stock in each one.',
    arIntro:
      'استكشف كل تصنيفات الأدوية والمستلزمات الطبية على دراجزا، وشوف الموزعين المعتمدين اللي عندهم مخزون في كل تصنيف.',
    links: [
      ['/', 'Home'],
      ['/catalog', 'Browse all products'],
      ['/providers', 'Authorized distributors']
    ]
  },
  {
    path: '/providers',
    title: 'Authorized Pharmaceutical Distributors in Egypt | Drugza',
    description:
      'Explore EDA-licensed pharmaceutical distributors, their live inventory, minimum orders, and delivery coverage on Drugza.',
    h1: 'Authorized Pharmaceutical Distributors',
    intro:
      'Explore verified, EDA-licensed distribution centers, inspect their live inventory, minimum orders, and delivery coverage.',
    arIntro:
      'استكشف مراكز التوزيع المعتمدة والمرخصة من هيئة الدواء المصرية، واطلع على مخزونها وأقل حد للطلب ونطاق التوصيل.',
    links: [
      ['/', 'Home'],
      ['/catalog', 'Browse all products'],
      ['/categories', 'Browse categories']
    ]
  },
  {
    path: '/terms',
    title: 'Terms & Conditions | Drugza',
    description:
      'Terms and conditions for using the Drugza wholesale pharmacy marketplace.',
    h1: 'Terms & Conditions',
    intro: 'Read the terms and conditions that govern the use of the Drugza marketplace.',
    arIntro: 'اقرأ الشروط والأحكام المنظمة لاستخدام منصة دراجزا.',
    links: [
      ['/', 'Home'],
      ['/privacy', 'Privacy policy']
    ]
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Drugza',
    description:
      'How Drugza collects, uses, and protects pharmacy account and order data.',
    h1: 'Privacy Policy',
    intro: 'Learn how Drugza collects, uses, and protects account, order, and delivery data.',
    arIntro: 'اعرف إزاي دراجزا بتجمع وتستخدم وتحمي بيانات الحساب والطلبات والتوصيل.',
    links: [
      ['/', 'Home'],
      ['/terms', 'Terms & conditions']
    ]
  }
];

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(route) {
  const canonical = `${siteUrl}${route.path === '/' ? '/' : route.path}`;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);

  let html = baseHtml;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${description}">`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${title}">`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${description}">`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${title}">`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${description}">`
  );
  html = html.replace(/<link rel="canonical"[^>]*>\s*/g, '');
  html = html.replace(/<meta property="og:url" content="[^"]*">\s*/g, '');

  html = html.replace(
    /<\/head>/,
    `  <link rel="canonical" href="${canonical}">\n  <meta property="og:url" content="${canonical}">\n</head>`
  );

  const links = route.links
    .map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`)
    .join(' · ');

  const staticContent = `<div id="app"><div style="max-width:1100px;margin:0 auto;padding:32px 20px;font-family:Manrope,Inter,Arial,sans-serif;color:#12496B;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">${escapeHtml(route.h1)}</h1>
      <p style="font-size:15px;line-height:1.7;color:#475467;margin:0 0 10px;">${escapeHtml(route.intro)}</p>
      <p dir="rtl" lang="ar" style="font-size:15px;line-height:1.8;color:#475467;margin:0 0 18px;">${escapeHtml(route.arIntro)}</p>
      <nav style="font-size:14px;">${links}</nav>
    </div></div>`;

  html = html.replace(/<div id="app"><\/div>/, staticContent);
  return html;
}

for (const route of routes) {
  const html = buildHtml(route);
  if (route.path === '/') {
    writeFileSync(indexPath, html, 'utf8');
    continue;
  }
  const target = resolve(distDir, `.${route.path}`, 'index.html');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html, 'utf8');
}

console.log(`[seo] Generated static HTML for ${routes.length} routes.`);
