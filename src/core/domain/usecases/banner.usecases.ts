import type { IBannerRepository, IContentRepository } from '../repositories';
import type { Banner, PolicyDocument, BalanceAccount, BalanceTransaction, Invoice, NotificationItem } from '../entities';

export class GetHomeDataUseCase {
  constructor(
    private bannerRepo: IBannerRepository,
    private contentRepo: IContentRepository
  ) {}

  async execute(): Promise<any> {
    return this.bannerRepo.getHomeData();
  }
}

export class GetBannersUseCase {
  constructor(private bannerRepo: IBannerRepository) {}

  async execute(): Promise<Banner[]> {
    return this.bannerRepo.getBanners();
  }
}

export class GetSpecialOffersUseCase {
  constructor(private bannerRepo: IBannerRepository) {}

  async execute(): Promise<Banner[]> {
    return this.bannerRepo.getSpecialOffers();
  }
}

export class GetTermsUseCase {
  constructor(private contentRepo: IContentRepository) {}

  async execute(): Promise<PolicyDocument | string> {
    return this.contentRepo.getTermsAndConditions();
  }
}

export class GetPrivacyPolicyUseCase {
  constructor(private contentRepo: IContentRepository) {}

  async execute(): Promise<PolicyDocument | string> {
    return this.contentRepo.getPrivacyPolicy();
  }
}

export class GetBalancesUseCase {
  constructor(private contentRepo: IContentRepository) {}

  async execute(userId: string): Promise<{ account: BalanceAccount | null; transactions: BalanceTransaction[] }> {
    const [account, transactions] = await Promise.all([
      this.contentRepo.getUserBalance(userId),
      this.contentRepo.getUserTransactions(userId)
    ]);
    return { account, transactions };
  }
}

export class GetInvoicesUseCase {
  constructor(private contentRepo: IContentRepository) {}

  async execute(userId: string): Promise<Invoice[]> {
    return this.contentRepo.getUserInvoices(userId);
  }
}

export class GetNotificationsUseCase {
  constructor(private contentRepo: IContentRepository) {}

  async execute(): Promise<NotificationItem[]> {
    return this.contentRepo.getNotifications();
  }
}
