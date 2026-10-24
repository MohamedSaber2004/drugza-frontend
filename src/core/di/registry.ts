import { defaultContainer, type DIContainer } from './container';
import { TOKENS } from './tokens';

// Infrastructure
import { LocalStorageService } from '@/infrastructure/storage/storage.service';
import { AxiosHttpClient } from '@/infrastructure/http/http.client';
import {
  AuthRepositoryImpl,
  ProductRepositoryImpl,
  CategoryRepositoryImpl,
  ProviderRepositoryImpl,
  CartRepositoryImpl,
  OrderRepositoryImpl,
  AddressRepositoryImpl,
  BannerRepositoryImpl,
  ContentRepositoryImpl
} from '@/infrastructure/repositories';

// Use Cases
import {
  LoginUseCase,
  RegisterUseCase,
  VerifyOtpUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  LogoutUseCase,
  GetCurrentUserUseCase,
  GetProductsUseCase,
  GetProductDetailUseCase,
  GetFlashSaleProductsUseCase,
  SearchProductsUseCase,
  GetPopularProductsUseCase,
  GetProductsByCategoryUseCase,
  GetProductsByProviderUseCase,
  GetCategoriesUseCase,
  GetCategoryByIdUseCase,
  GetProvidersUseCase,
  GetProviderByIdUseCase,
  GetCategoryProvidersUseCase,
  GetCartUseCase,
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveCartItemUseCase,
  ClearCartUseCase,
  ApplyCouponUseCase,
  CheckoutOrderUseCase,
  GetUserOrdersUseCase,
  GetOrderDetailUseCase,
  CancelOrderUseCase,
  GetAddressesUseCase,
  SaveAddressUseCase,
  DeleteAddressUseCase,
  GetHomeDataUseCase,
  GetBannersUseCase,
  GetSpecialOffersUseCase,
  GetTermsUseCase,
  GetPrivacyPolicyUseCase,
  GetBalancesUseCase,
  GetInvoicesUseCase,
  GetReturnsUseCase,
  GetNotificationsUseCase
} from '@/core/domain/usecases';

/**
 * Configure and register all application dependencies into the DI Container.
 */
export function setupDependencyInjection(container: DIContainer = defaultContainer): DIContainer {
  // 1. Infrastructure Services (Singletons)
  container.registerSingleton(TOKENS.StorageService, () => new LocalStorageService());
  container.registerSingleton(
    TOKENS.HttpClient,
    (c) => new AxiosHttpClient(c.resolve(TOKENS.StorageService))
  );

  // 2. Repositories (Singletons)
  container.registerSingleton(
    TOKENS.AuthRepository,
    (c) => new AuthRepositoryImpl(c.resolve(TOKENS.HttpClient), c.resolve(TOKENS.StorageService))
  );

  container.registerSingleton(
    TOKENS.ProductRepository,
    (c) => new ProductRepositoryImpl(c.resolve(TOKENS.HttpClient))
  );

  container.registerSingleton(
    TOKENS.CategoryRepository,
    (c) => new CategoryRepositoryImpl(c.resolve(TOKENS.HttpClient))
  );

  container.registerSingleton(
    TOKENS.ProviderRepository,
    (c) => new ProviderRepositoryImpl(c.resolve(TOKENS.HttpClient))
  );

  container.registerSingleton(
    TOKENS.CartRepository,
    (c) => new CartRepositoryImpl(c.resolve(TOKENS.HttpClient), c.resolve(TOKENS.StorageService))
  );

  container.registerSingleton(
    TOKENS.OrderRepository,
    (c) => new OrderRepositoryImpl(c.resolve(TOKENS.HttpClient))
  );

  container.registerSingleton(
    TOKENS.AddressRepository,
    (c) => new AddressRepositoryImpl(c.resolve(TOKENS.HttpClient))
  );

  container.registerSingleton(
    TOKENS.BannerRepository,
    (c) => new BannerRepositoryImpl(c.resolve(TOKENS.HttpClient))
  );

  container.registerSingleton(
    TOKENS.ContentRepository,
    (c) => new ContentRepositoryImpl(c.resolve(TOKENS.HttpClient))
  );

  // 3. Auth Use Cases
  container.registerTransient(TOKENS.LoginUseCase, (c) => new LoginUseCase(c.resolve(TOKENS.AuthRepository)));
  container.registerTransient(TOKENS.RegisterUseCase, (c) => new RegisterUseCase(c.resolve(TOKENS.AuthRepository)));
  container.registerTransient(TOKENS.VerifyOtpUseCase, (c) => new VerifyOtpUseCase(c.resolve(TOKENS.AuthRepository)));
  container.registerTransient(TOKENS.ForgotPasswordUseCase, (c) => new ForgotPasswordUseCase(c.resolve(TOKENS.AuthRepository)));
  container.registerTransient(TOKENS.ResetPasswordUseCase, (c) => new ResetPasswordUseCase(c.resolve(TOKENS.AuthRepository)));
  container.registerTransient(TOKENS.LogoutUseCase, (c) => new LogoutUseCase(c.resolve(TOKENS.AuthRepository)));
  container.registerTransient(TOKENS.GetCurrentUserUseCase, (c) => new GetCurrentUserUseCase(c.resolve(TOKENS.AuthRepository)));

  // 4. Products Use Cases
  container.registerTransient(TOKENS.GetProductsUseCase, (c) => new GetProductsUseCase(c.resolve(TOKENS.ProductRepository)));
  container.registerTransient(TOKENS.GetProductDetailUseCase, (c) => new GetProductDetailUseCase(c.resolve(TOKENS.ProductRepository)));
  container.registerTransient(TOKENS.GetFlashSaleProductsUseCase, (c) => new GetFlashSaleProductsUseCase(c.resolve(TOKENS.ProductRepository)));
  container.registerTransient(TOKENS.SearchProductsUseCase, (c) => new SearchProductsUseCase(c.resolve(TOKENS.ProductRepository)));
  container.registerTransient(TOKENS.GetPopularProductsUseCase, (c) => new GetPopularProductsUseCase(c.resolve(TOKENS.ProductRepository)));
  container.registerTransient(TOKENS.GetProductsByCategoryUseCase, (c) => new GetProductsByCategoryUseCase(c.resolve(TOKENS.ProductRepository)));
  container.registerTransient(TOKENS.GetProductsByProviderUseCase, (c) => new GetProductsByProviderUseCase(c.resolve(TOKENS.ProductRepository)));

  // 5. Categories & Providers Use Cases
  container.registerTransient(TOKENS.GetCategoriesUseCase, (c) => new GetCategoriesUseCase(c.resolve(TOKENS.CategoryRepository)));
  container.registerTransient(TOKENS.GetCategoryByIdUseCase, (c) => new GetCategoryByIdUseCase(c.resolve(TOKENS.CategoryRepository)));
  container.registerTransient(TOKENS.GetProvidersUseCase, (c) => new GetProvidersUseCase(c.resolve(TOKENS.ProviderRepository)));
  container.registerTransient(TOKENS.GetProviderByIdUseCase, (c) => new GetProviderByIdUseCase(c.resolve(TOKENS.ProviderRepository)));
  container.registerTransient(TOKENS.GetCategoryProvidersUseCase, (c) => new GetCategoryProvidersUseCase(c.resolve(TOKENS.CategoryRepository), c.resolve(TOKENS.ProviderRepository)));

  // 6. Cart Use Cases
  container.registerTransient(TOKENS.GetCartUseCase, (c) => new GetCartUseCase(c.resolve(TOKENS.CartRepository)));
  container.registerTransient(TOKENS.AddToCartUseCase, (c) => new AddToCartUseCase(c.resolve(TOKENS.CartRepository)));
  container.registerTransient(TOKENS.UpdateCartItemUseCase, (c) => new UpdateCartItemUseCase(c.resolve(TOKENS.CartRepository)));
  container.registerTransient(TOKENS.RemoveCartItemUseCase, (c) => new RemoveCartItemUseCase(c.resolve(TOKENS.CartRepository)));
  container.registerTransient(TOKENS.ClearCartUseCase, (c) => new ClearCartUseCase(c.resolve(TOKENS.CartRepository)));
  container.registerTransient(TOKENS.ApplyCouponUseCase, (c) => new ApplyCouponUseCase(c.resolve(TOKENS.CartRepository)));

  // 7. Orders Use Cases
  container.registerTransient(TOKENS.CheckoutOrderUseCase, (c) => new CheckoutOrderUseCase(c.resolve(TOKENS.OrderRepository)));
  container.registerTransient(TOKENS.GetUserOrdersUseCase, (c) => new GetUserOrdersUseCase(c.resolve(TOKENS.OrderRepository)));
  container.registerTransient(TOKENS.GetOrderDetailUseCase, (c) => new GetOrderDetailUseCase(c.resolve(TOKENS.OrderRepository)));
  container.registerTransient(TOKENS.CancelOrderUseCase, (c) => new CancelOrderUseCase(c.resolve(TOKENS.OrderRepository)));

  // 8. Addresses Use Cases
  container.registerTransient(TOKENS.GetAddressesUseCase, (c) => new GetAddressesUseCase(c.resolve(TOKENS.AddressRepository)));
  container.registerTransient(TOKENS.SaveAddressUseCase, (c) => new SaveAddressUseCase(c.resolve(TOKENS.AddressRepository)));
  container.registerTransient(TOKENS.DeleteAddressUseCase, (c) => new DeleteAddressUseCase(c.resolve(TOKENS.AddressRepository)));

  // 9. Banners & Home Use Cases
  container.registerTransient(TOKENS.GetHomeDataUseCase, (c) => new GetHomeDataUseCase(c.resolve(TOKENS.BannerRepository), c.resolve(TOKENS.ContentRepository)));
  container.registerTransient(TOKENS.GetBannersUseCase, (c) => new GetBannersUseCase(c.resolve(TOKENS.BannerRepository)));
  container.registerTransient(TOKENS.GetSpecialOffersUseCase, (c) => new GetSpecialOffersUseCase(c.resolve(TOKENS.BannerRepository)));

  // 10. Content & Balances Use Cases
  container.registerTransient(TOKENS.GetTermsUseCase, (c) => new GetTermsUseCase(c.resolve(TOKENS.ContentRepository)));
  container.registerTransient(TOKENS.GetPrivacyPolicyUseCase, (c) => new GetPrivacyPolicyUseCase(c.resolve(TOKENS.ContentRepository)));
  container.registerTransient(TOKENS.GetBalancesUseCase, (c) => new GetBalancesUseCase(c.resolve(TOKENS.ContentRepository)));
  container.registerTransient(TOKENS.GetInvoicesUseCase, (c) => new GetInvoicesUseCase(c.resolve(TOKENS.ContentRepository)));
  container.registerTransient(TOKENS.GetNotificationsUseCase, (c) => new GetNotificationsUseCase(c.resolve(TOKENS.ContentRepository)));

  return container;
}
