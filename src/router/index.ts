import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import { loadingService, type SkeletonType } from '@/composables/useLoading';
import { encryptId, decryptId } from '@/utils/id-crypto';
import { applyRouteSeo } from './seo';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { skeletonType: 'default' }
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: () => import('@/views/CatalogView.vue'),
      meta: { skeletonType: 'catalog' }
    },
    {
      path: '/products',
      redirect: '/catalog'
    },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: () => import('@/views/ProductDetailView.vue'),
      meta: { skeletonType: 'detail' }
    },
    {
      path: '/product/:id',
      redirect: to => `/products/${encryptId(decryptId(to.params.id as string))}`
    },
    {
      path: '/flash-sales',
      name: 'flash-sales',
      component: () => import('@/views/FlashSalesView.vue'),
      meta: { skeletonType: 'catalog' }
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('@/views/CategoriesView.vue'),
      meta: { skeletonType: 'grid' }
    },
    {
      path: '/categories/:id',
      name: 'category-providers',
      component: () => import('@/views/CategoryProvidersView.vue'),
      meta: { skeletonType: 'catalog' }
    },
    {
      path: '/providers',
      name: 'providers',
      component: () => import('@/views/ProvidersView.vue'),
      meta: { skeletonType: 'grid' }
    },
    {
      path: '/providers/:id',
      name: 'provider-detail',
      component: () => import('@/views/ProviderDetailView.vue'),
      meta: { skeletonType: 'detail' }
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
      meta: { skeletonType: 'catalog' }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { skeletonType: 'profile' }
    },
    {
      path: '/addresses',
      name: 'addresses',
      component: () => import('@/views/AddressesView.vue'),
      meta: { skeletonType: 'profile' }
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('@/views/CheckoutView.vue'),
      meta: { skeletonType: 'form' }
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('@/views/OrdersView.vue'),
      meta: { skeletonType: 'orders' }
    },
    {
      path: '/auth/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { skeletonType: 'form' }
    },
    {
      path: '/auth/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { skeletonType: 'form' }
    },
    {
      path: '/auth/otp',
      name: 'otp',
      component: () => import('@/views/auth/OtpView.vue'),
      meta: { skeletonType: 'form' }
    },
    {
      path: '/auth/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { skeletonType: 'form' }
    },
    {
      path: '/auth/terms',
      name: 'auth-terms',
      component: () => import('@/views/TermsView.vue'),
      meta: { hideNav: true, skeletonType: 'content' }
    },
    {
      path: '/auth/terms-and-conditions',
      redirect: '/auth/terms'
    },
    {
      path: '/auth/privacy',
      name: 'auth-privacy',
      component: () => import('@/views/PrivacyPolicyView.vue'),
      meta: { hideNav: true, skeletonType: 'content' }
    },
    {
      path: '/auth/privacy-policy',
      redirect: '/auth/privacy'
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('@/views/PrivacyPolicyView.vue'),
      meta: { skeletonType: 'content' }
    },
    {
      path: '/privacy-policy',
      redirect: '/privacy'
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('@/views/TermsView.vue'),
      meta: { skeletonType: 'content' }
    },
    {
      path: '/terms-and-conditions',
      redirect: '/terms'
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
});

// Authentication Route Guard
// Only protected pages (checkout, orders, profile, addresses, favorites) require login.
// Guests can freely browse products, categories, providers, and build their cart.
const PROTECTED_ROUTES = ['/checkout', '/orders', '/profile', '/addresses', '/favorites'];

router.beforeEach((to, from, next) => {
  // If it's only a hash change on the same page, don't trigger full skeleton
  if (to.path === from.path && to.hash !== from.hash) {
    return next();
  }

  // Start page skeleton loading for the incoming route
  const skeletonType = (to.meta.skeletonType as SkeletonType) || 'default';
  loadingService.startPageLoading(skeletonType);

  const token = localStorage.getItem('drugza_token');
  const isProtected = PROTECTED_ROUTES.some(p => to.path === p || to.path.startsWith(p + '/'));

  if (!token && isProtected) {
    return next({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    });
  }

  if (token && (to.path === '/auth/login' || to.path === '/auth/register')) {
    return next({ path: '/' });
  }

  next();
});

router.afterEach((to) => {
  loadingService.finishPageLoading();
  applyRouteSeo(to);
});

router.onError(() => {
  loadingService.finishPageLoading();
});

export default router;
