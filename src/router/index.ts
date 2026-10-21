import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';

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
      component: HomeView
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: () => import('@/views/CatalogView.vue')
    },
    {
      path: '/products',
      redirect: '/catalog'
    },
    {
      path: '/flash-sales',
      redirect: '/catalog?filter=flash'
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('@/views/CategoriesView.vue')
    },
    {
      path: '/categories/:id',
      name: 'category-providers',
      component: () => import('@/views/CategoryProvidersView.vue')
    },
    {
      path: '/providers',
      name: 'providers',
      component: () => import('@/views/ProvidersView.vue')
    },
    {
      path: '/providers/:id',
      name: 'provider-detail',
      component: () => import('@/views/ProviderDetailView.vue')
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue')
    },
    {
      path: '/addresses',
      name: 'addresses',
      component: () => import('@/views/AddressesView.vue')
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('@/views/CheckoutView.vue')
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('@/views/OrdersView.vue')
    },
    {
      path: '/auth/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue')
    },
    {
      path: '/auth/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue')
    },
    {
      path: '/auth/otp',
      name: 'otp',
      component: () => import('@/views/auth/OtpView.vue')
    },
    {
      path: '/auth/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue')
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

router.beforeEach((to, _from, next) => {
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

export default router;
