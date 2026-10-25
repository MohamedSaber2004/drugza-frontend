import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { useI18n } from '@/composables/useI18n';
import { buildHomeJsonLd, setSeo } from '@/utils/seo';

interface SeoCopy {
  title: string;
  description: string;
}

interface RouteSeoCopy {
  en: SeoCopy;
  ar: SeoCopy;
  noindex?: boolean;
}

const ROUTE_SEO: Record<string, RouteSeoCopy> = {
  home: {
    en: {
      title: 'Trusted Pharmacy Marketplace in Egypt',
      description:
        'Order medicines, medical supplies, and cold-chain products online from verified Egyptian distributors at competitive wholesale prices.'
    },
    ar: {
      title: 'سوق الأدوية والمستلزمات الطبية الموثوق في مصر',
      description:
        'اطلب الأدوية والمستلزمات الطبية ومنتجات سلسلة التبريد أونلاين من موزعين مصريين معتمدين بأسعار جملة تنافسية.'
    }
  },
  catalog: {
    en: {
      title: 'Browse Medicines & Medical Supplies',
      description:
        'Search thousands of medicines and pharmacy products by name, active ingredient, category, or distributor with live prices and stock.'
    },
    ar: {
      title: 'تصفح الأدوية والمستلزمات الطبية',
      description:
        'ابحث في آلاف الأدوية ومنتجات الصيدليات بالاسم أو المادة الفعالة أو الفئة أو الموزع مع أسعار ومخزون محدث.'
    }
  },
  'product-detail': {
    en: {
      title: 'Product Details',
      description:
        'View product details, live supplier prices, stock availability, and order medicines online from Drugza.'
    },
    ar: {
      title: 'تفاصيل المنتج',
      description: 'اعرف تفاصيل المنتج وأسعار الموزعين والمخزون المتاح واطلب الدواء أونلاين من دراجزا.'
    }
  },
  'flash-sales': {
    en: {
      title: 'Flash Sales & Pharmacy Deals',
      description: 'Limited-time flash offers on medicines and medical supplies from verified distributors.'
    },
    ar: {
      title: 'العروض السريعة وخصومات الصيدليات',
      description: 'عروض محدودة المدة على الأدوية والمستلزمات الطبية من موزعين معتمدين.'
    }
  },
  categories: {
    en: {
      title: 'Medicine Categories',
      description:
        'Browse medicines and medical supplies by therapeutic category, from antibiotics to cold-chain products.'
    },
    ar: {
      title: 'فئات الأدوية',
      description: 'تصفح الأدوية والمستلزمات الطبية حسب الفئة العلاجية، من المضادات الحيوية إلى منتجات سلسلة التبريد.'
    }
  },
  'category-providers': {
    en: {
      title: 'Category Products & Providers',
      description: 'Compare verified distributors and live prices for products in this category.'
    },
    ar: {
      title: 'منتجات وموزعو الفئة',
      description: 'قارن بين الموزعين المعتمدين والأسعار المحدثة لمنتجات هذه الفئة.'
    }
  },
  providers: {
    en: {
      title: 'Verified Medical Distributors & Wholesalers',
      description: 'Discover authorized pharmaceutical distributors and wholesalers serving pharmacies across Egypt.'
    },
    ar: {
      title: 'موزعو الأدوية المعتمدون',
      description: 'تعرف على موزعي الأدوية المعتمدين وتجار الجملة الذين يخدمون الصيدليات في مصر.'
    }
  },
  'provider-detail': {
    en: {
      title: 'Distributor Profile & Products',
      description: 'View distributor details, product catalog, and live wholesale prices.'
    },
    ar: {
      title: 'ملف الموزع ومنتجاته',
      description: 'اعرف بيانات الموزع وقائمة منتجاته وأسعار الجملة المحدثة.'
    }
  },
  favorites: {
    en: { title: 'My Favorites', description: 'Your saved medicines and products on Drugza.' },
    ar: { title: 'المفضلة', description: 'الأدوية والمنتجات المحفوظة في دراجزا.' },
    noindex: true
  },
  profile: {
    en: { title: 'My Account', description: 'Manage your Drugza pharmacy account.' },
    ar: { title: 'حسابي', description: 'إدارة حساب صيدليتك في دراجزا.' },
    noindex: true
  },
  addresses: {
    en: { title: 'Delivery Addresses', description: 'Manage your pharmacy delivery addresses.' },
    ar: { title: 'عناوين التوصيل', description: 'إدارة عناوين توصيل الصيدلية.' },
    noindex: true
  },
  checkout: {
    en: { title: 'Checkout', description: 'Complete your Drugza order.' },
    ar: { title: 'إتمام الطلب', description: 'أكمل طلبك من دراجزا.' },
    noindex: true
  },
  orders: {
    en: { title: 'My Orders', description: 'Track your Drugza orders.' },
    ar: { title: 'طلباتي', description: 'تابع طلباتك في دراجزا.' },
    noindex: true
  },
  login: {
    en: { title: 'Login', description: 'Sign in to your Drugza pharmacy account.' },
    ar: { title: 'تسجيل الدخول', description: 'سجّل الدخول إلى حساب صيدليتك في دراجزا.' },
    noindex: true
  },
  register: {
    en: { title: 'Create Account', description: 'Register your pharmacy on Drugza.' },
    ar: { title: 'إنشاء حساب', description: 'سجّل صيدليتك في دراجزا.' },
    noindex: true
  },
  otp: {
    en: { title: 'Verify Account', description: 'Confirm your Drugza account.' },
    ar: { title: 'تفعيل الحساب', description: 'أكّد حسابك في دراجزا.' },
    noindex: true
  },
  'forgot-password': {
    en: { title: 'Reset Password', description: 'Reset your Drugza password.' },
    ar: { title: 'استعادة كلمة المرور', description: 'استعد كلمة مرور حسابك في دراجزا.' },
    noindex: true
  },
  terms: {
    en: {
      title: 'Terms & Conditions',
      description: "Read Drugza's terms of use for pharmacies and medical distributors."
    },
    ar: { title: 'الشروط والأحكام', description: 'اقرأ شروط استخدام دراجزا للصيدليات وموزعي الأدوية.' }
  },
  'auth-terms': {
    en: {
      title: 'Terms & Conditions',
      description: "Read Drugza's terms of use for pharmacies and medical distributors."
    },
    ar: { title: 'الشروط والأحكام', description: 'اقرأ شروط استخدام دراجزا للصيدليات وموزعي الأدوية.' }
  },
  privacy: {
    en: {
      title: 'Privacy Policy',
      description: 'Learn how Drugza collects, uses, and protects pharmacy and distributor data.'
    },
    ar: { title: 'سياسة الخصوصية', description: 'اعرف كيف تجمع دراجزا بيانات الصيدليات والموزعين وتحميها.' }
  },
  'auth-privacy': {
    en: {
      title: 'Privacy Policy',
      description: 'Learn how Drugza collects, uses, and protects pharmacy and distributor data.'
    },
    ar: { title: 'سياسة الخصوصية', description: 'اعرف كيف تجمع دراجزا بيانات الصيدليات والموزعين وتحميها.' }
  }
};

export function applyRouteSeo(to: RouteLocationNormalizedLoaded): void {
  const name = typeof to.name === 'string' ? to.name : '';
  const copy = ROUTE_SEO[name];
  if (!copy) return;

  const { locale } = useI18n();
  const localized = locale.value === 'ar' ? copy.ar : copy.en;
  const isSearchResults = name === 'catalog' && Boolean(to.query.search);

  setSeo({
    title: localized.title,
    description: localized.description,
    path: to.path,
    noindex: copy.noindex || isSearchResults,
    jsonLd: name === 'home' ? buildHomeJsonLd() : undefined
  });
}
