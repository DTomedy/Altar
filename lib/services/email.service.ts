import 'server-only';
import { IEmailService } from './interfaces';
import {
  sendVerificationEmail as libSendVerification,
  sendCampaignGoalReachedEmail as libSendGoalReached,
  sendCampaignExpiredEmail as libSendExpired,
  sendWithdrawalStatusEmail as libSendWithdrawal,
  sendEmail,
} from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export class EmailService implements IEmailService {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    await libSendVerification(email, token);
  }

  async sendCampaignGoalReachedEmail(
    email: string,
    campaignTitle: string,
    raisedAmount: string
  ): Promise<void> {
    await libSendGoalReached(email, campaignTitle, raisedAmount);
  }

  async sendCampaignExpiredEmail(
    email: string,
    campaignTitle: string,
    raisedAmount: string
  ): Promise<void> {
    await libSendExpired(email, campaignTitle, raisedAmount);
  }

  async sendWithdrawalStatusEmail(
    email: string,
    amount: string,
    reference: string,
    status: 'COMPLETED' | 'FAILED'
  ): Promise<void> {
    await libSendWithdrawal(email, amount, reference, status);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    const html = `
      <div style="font-family: 'DM Sans', sans-serif; color: #2C2C2A; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3D1F6B; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 500;">Reset your Altar password</h1>
        <p style="font-size: 16px; line-height: 1.5;">We received a request to reset the password for your Altar account.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3D1F6B; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 50px; font-weight: 500; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #787878;">This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `;
    await sendEmail({ to: email, subject: 'Reset your Altar password', html });
  }
}
