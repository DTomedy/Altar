declare global {
  function FlutterwaveCheckout(config: FlutterwaveConfig): void;
}

export interface FlutterwaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options?: string;
  customer: { email: string; name: string };
  meta?: Record<string, string>;
  customizations: { title: string; description: string; logo: string };
  callback: (response: { tx_ref: string; status: string }) => void;
  onclose: () => void;
}

export type CampaignType = 'WISHLIST' | 'GOAL';
export type CampaignStatus = 'ACTIVE' | 'GOAL_REACHED' | 'EXPIRED' | 'CLOSED';
export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type TransactionType = 'CREDIT' | 'DEBIT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  emailVerified: boolean;
  kycLevel: number;
  kycStatus: KycStatus;
  bankAccountNumber: string | null;
  bankCode: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItemDto {
  id: string;
  campaignId: string;
  name: string;
  description: string | null;
  targetAmount: string; // Decimals represented as strings in API responses
  fundedAmount: string;
  isFulfilled: boolean;
}

export interface CampaignDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: CampaignType;
  coverPhoto: string | null;
  goalAmount: string | null;
  deadline: string | null;
  status: CampaignStatus;
  allowOverflow: boolean;
  ownerId: string;
  owner?: UserDto;
  items?: WishlistItemDto[];
  totalRaised: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContributionDto {
  id: string;
  campaignId: string;
  wishlistItemId: string | null;
  amount: string;
  isAnonymous: boolean;
  displayName: string | null;
  message: string | null;
  status: PaymentStatus;
  flwTxRef: string;
  flwTxId: string | null;
  createdAt: string;
}

export interface WalletDto {
  id: string;
  userId: string;
  balance: string;
}

export interface WalletTransactionDto {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: string;
  description: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
