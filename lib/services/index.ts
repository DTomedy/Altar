import 'server-only';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { PaymentService } from './payment.service';
import { StorageService } from './storage.service';
import { UserRepository, CampaignRepository, ContributionRepository } from './repositories';

export const authService = new AuthService();
export const emailService = new EmailService();
export const paymentService = new PaymentService();
export const storageService = new StorageService();
export const userRepository = new UserRepository();
export const campaignRepository = new CampaignRepository();
export const contributionRepository = new ContributionRepository();

export type {
  IAuthService,
  IEmailService,
  IPaymentService,
  IStorageService,
  IUserRepository,
  ICampaignRepository,
  IContributionRepository,
  JWTPayload,
  InitiateTransferParams,
  CreateUserData,
  CreateCampaignData,
  CreateContributionData,
} from './interfaces';
