import { createToken, type InjectionToken } from './container';

// Infrastructure Tokens
export const TOKENS = {
  HttpClient: createToken<any>('HttpClient'),
  StorageService: createToken<any>('StorageService'),

  // Repository Tokens
  AuthRepository: createToken<any>('AuthRepository'),
  ProductRepository: createToken<any>('ProductRepository'),
  CategoryRepository: createToken<any>('CategoryRepository'),
  ProviderRepository: createToken<any>('ProviderRepository'),
  CartRepository: createToken<any>('CartRepository'),
  OrderRepository: createToken<any>('OrderRepository'),
  AddressRepository: createToken<any>('AddressRepository'),
  BannerRepository: createToken<any>('BannerRepository'),
  ContentRepository: createToken<any>('ContentRepository'),

  // Use Case Tokens: Auth
  LoginUseCase: createToken<any>('LoginUseCase'),
  RegisterUseCase: createToken<any>('RegisterUseCase'),
  VerifyOtpUseCase: createToken<any>('VerifyOtpUseCase'),
  ForgotPasswordUseCase: createToken<any>('ForgotPasswordUseCase'),
  ResetPasswordUseCase: createToken<any>('ResetPasswordUseCase'),
  LogoutUseCase: createToken<any>('LogoutUseCase'),
  GetCurrentUserUseCase: createToken<any>('GetCurrentUserUseCase'),

  // Use Case Tokens: Products
  GetProductsUseCase: createToken<any>('GetProductsUseCase'),
  GetProductDetailUseCase: createToken<any>('GetProductDetailUseCase'),
  GetFlashSaleProductsUseCase: createToken<any>('GetFlashSaleProductsUseCase'),
  SearchProductsUseCase: createToken<any>('SearchProductsUseCase'),
  GetPopularProductsUseCase: createToken<any>('GetPopularProductsUseCase'),
  GetProductsByCategoryUseCase: createToken<any>('GetProductsByCategoryUseCase'),
  GetProductsByProviderUseCase: createToken<any>('GetProductsByProviderUseCase'),

  // Use Case Tokens: Categories & Providers
  GetCategoriesUseCase: createToken<any>('GetCategoriesUseCase'),
  GetCategoryByIdUseCase: createToken<any>('GetCategoryByIdUseCase'),
  GetProvidersUseCase: createToken<any>('GetProvidersUseCase'),
  GetProviderByIdUseCase: createToken<any>('GetProviderByIdUseCase'),
  GetCategoryProvidersUseCase: createToken<any>('GetCategoryProvidersUseCase'),

  // Use Case Tokens: Cart
  GetCartUseCase: createToken<any>('GetCartUseCase'),
  AddToCartUseCase: createToken<any>('AddToCartUseCase'),
  UpdateCartItemUseCase: createToken<any>('UpdateCartItemUseCase'),
  RemoveCartItemUseCase: createToken<any>('RemoveCartItemUseCase'),
  ClearCartUseCase: createToken<any>('ClearCartUseCase'),
  ApplyCouponUseCase: createToken<any>('ApplyCouponUseCase'),

  // Use Case Tokens: Orders
  CheckoutOrderUseCase: createToken<any>('CheckoutOrderUseCase'),
  GetUserOrdersUseCase: createToken<any>('GetUserOrdersUseCase'),
  GetOrderDetailUseCase: createToken<any>('GetOrderDetailUseCase'),
  CancelOrderUseCase: createToken<any>('CancelOrderUseCase'),

  // Use Case Tokens: Addresses
  GetAddressesUseCase: createToken<any>('GetAddressesUseCase'),
  SaveAddressUseCase: createToken<any>('SaveAddressUseCase'),
  DeleteAddressUseCase: createToken<any>('DeleteAddressUseCase'),

  // Use Case Tokens: Banners & Home
  GetHomeDataUseCase: createToken<any>('GetHomeDataUseCase'),
  GetBannersUseCase: createToken<any>('GetBannersUseCase'),
  GetSpecialOffersUseCase: createToken<any>('GetSpecialOffersUseCase'),

  // Use Case Tokens: Content, Balances, Policies
  GetPrivacyPolicyUseCase: createToken<any>('GetPrivacyPolicyUseCase'),
  GetTermsUseCase: createToken<any>('GetTermsUseCase'),
  GetBalancesUseCase: createToken<any>('GetBalancesUseCase'),
  GetInvoicesUseCase: createToken<any>('GetInvoicesUseCase'),
  GetReturnsUseCase: createToken<any>('GetReturnsUseCase'),
  GetNotificationsUseCase: createToken<any>('GetNotificationsUseCase'),
} as const;
