import 'server-only';
import { NextRequest } from 'next/server';
import type { User, Campaign, Contribution } from '@prisma/client';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  userId: string;
  email: string;
  kycLevel: number;
  emailVerified: boolean;
}

export interface IAuthService {
  signToken(payload: JWTPayload): string;
  verifyToken(token: string): JWTPayload | null;
  verifyAuth(req: NextRequest): Promise<JWTPayload | null>;
  verifyAuthWithFallback(req: NextRequest): Promise<JWTPayload | null>;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
}

// ─── Email ───────────────────────────────────────────────────────────────────

export interface IEmailService {
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendCampaignGoalReachedEmail(email: string, campaignTitle: string, raisedAmount: string): Promise<void>;
  sendCampaignExpiredEmail(email: string, campaignTitle: string, raisedAmount: string): Promise<void>;
  sendWithdrawalStatusEmail(
    email: string,
    amount: string,
    reference: string,
    status: 'COMPLETED' | 'FAILED'
  ): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface InitiateTransferParams {
  accountNumber: string;
  bankCode: string;
  amount: number;
  narration: string;
  reference: string;
}

export interface IPaymentService {
  initiateTransfer(params: InitiateTransferParams): Promise<unknown>;
  resolveBankAccount(accountNumber: string, bankCode: string): Promise<unknown>;
  getNigerianBanks(): Promise<unknown>;
  verifyTransaction(txRef: string): Promise<unknown>;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export interface IStorageService {
  uploadPublicImage(base64Data: string, folder?: string): Promise<string>;
  uploadPrivateFile(base64Data: string, folder?: string): Promise<string>;
  getSignedUrl(publicId: string, expiresInSeconds?: number): string;
}

// ─── Repositories ────────────────────────────────────────────────────────────

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string | null;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User>;
}

export interface CreateCampaignItemData {
  name: string;
  description?: string | null;
  targetAmount: number;
}

export interface CreateCampaignData {
  slug: string;
  title: string;
  description: string;
  type: string;
  coverPhoto: string;
  minAmount: number;
  maxAmount: number;
  goalAmount?: number | null;
  deadline?: Date | null;
  allowOverflow: boolean;
  ownerId: string;
  items?: CreateCampaignItemData[];
}

export interface ICampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  findBySlug(slug: string): Promise<Campaign | null>;
  create(data: CreateCampaignData): Promise<Campaign>;
  update(id: string, data: Partial<Campaign>): Promise<Campaign>;
  delete(id: string): Promise<void>;
}

export interface CreateContributionData {
  campaignId: string;
  wishlistItemId?: string | null;
  amount: number;
  isAnonymous: boolean;
  displayName?: string | null;
  message?: string | null;
  flwTxRef: string;
}

export interface IContributionRepository {
  findById(id: string): Promise<Contribution | null>;
  findByTxRef(txRef: string): Promise<Contribution | null>;
  create(data: CreateContributionData): Promise<Contribution>;
  update(id: string, data: Partial<Contribution>): Promise<Contribution>;
}

// ─── Payment Log ─────────────────────────────────────────────────────────────

export interface CreatePaymentLogData {
  flwTxRef: string;
  flwTxId?: string | null;
  campaignId: string;
  contributionId?: string | null;
  amountExpected: number;
  amountPaid?: number | null;
  currency?: string;
  outcome: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'AMOUNT_MISMATCH' | 'VERIFICATION_ERROR';
  failureReason?: string | null;
  ipAddress?: string | null;
}

export interface IPaymentLogRepository {
  create(data: CreatePaymentLogData): Promise<void>;
}
