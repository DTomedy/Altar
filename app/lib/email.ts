import 'server-only';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = 'Altar <no-reply@altar.app>'; // Resend verified domain in production

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Base email sender helper.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Resend Email Mock] To: ${to} | Subject: ${subject}`);
    return { id: 'mock-id' };
  }
  
  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    throw new Error('Email delivery failed');
  }
}

/**
 * Sends the email verification link to a user.
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;
  const html = `
    <div style="font-family: 'DM Sans', sans-serif; color: #2C2C2A; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #3D1F6B; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 500;">Verify your Altar account</h1>
      <p style="font-size: 16px; line-height: 1.5;">Welcome to Altar! Please confirm your email address to unlock your digital wallet and start celebrating.</p>
      <div style="margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #3D1F6B; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 50px; font-weight: 500; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="font-size: 14px; color: #787878;">This link will expire in 24 hours. If you did not sign up for Altar, you can safely ignore this email.</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Verify your Altar account',
    html,
  });
}

/**
 * Sends a notification when a campaign reaches its funding goal.
 */
export async function sendCampaignGoalReachedEmail(email: string, campaignTitle: string, raisedAmount: string) {
  const html = `
    <div style="font-family: 'DM Sans', sans-serif; color: #2C2C2A; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #3D1F6B; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 500;">Goal Reached! 🎉</h1>
      <p style="font-size: 16px; line-height: 1.5;">Congratulations! Your campaign <strong>${campaignTitle}</strong> has reached its goal of <span style="font-family: 'IBM Plex Mono', monospace; font-weight: 500;">${raisedAmount}</span>.</p>
      <p style="font-size: 16px; line-height: 1.5;">You can check your wallet details and manage your gifts on your Altar dashboard.</p>
      <div style="margin: 30px 0;">
        <a href="${APP_URL}/dashboard" style="background-color: #3D1F6B; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 50px; font-weight: 500; display: inline-block;">Go to Dashboard</a>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: `Goal Reached: ${campaignTitle}`,
    html,
  });
}

/**
 * Sends a notification when a campaign expires.
 */
export async function sendCampaignExpiredEmail(email: string, campaignTitle: string, raisedAmount: string) {
  const html = `
    <div style="font-family: 'DM Sans', sans-serif; color: #2C2C2A; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #3D1F6B; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 500;">Campaign Finished</h1>
      <p style="font-size: 16px; line-height: 1.5;">Your campaign <strong>${campaignTitle}</strong> has reached its deadline.</p>
      <p style="font-size: 16px; line-height: 1.5;">A total of <span style="font-family: 'IBM Plex Mono', monospace; font-weight: 500;">${raisedAmount}</span> was gifted. The funds are currently available in your digital wallet, and you can withdraw them at any time.</p>
      <div style="margin: 30px 0;">
        <a href="${APP_URL}/wallet" style="background-color: #3D1F6B; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 50px; font-weight: 500; display: inline-block;">View Wallet</a>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: `Campaign finished: ${campaignTitle}`,
    html,
  });
}

/**
 * Sends a notification when a withdrawal is processed.
 */
export async function sendWithdrawalStatusEmail(
  email: string,
  amount: string,
  reference: string,
  status: 'COMPLETED' | 'FAILED'
) {
  const isCompleted = status === 'COMPLETED';
  const subject = isCompleted ? 'Withdrawal successful' : 'Withdrawal failed';
  const header = isCompleted ? 'Withdrawal processed successfully' : 'Withdrawal attempt failed';
  const text = isCompleted
    ? `Your withdrawal request of ${amount} (ref: ${reference}) has been sent to your bank account.`
    : `We could not process your withdrawal request of ${amount} (ref: ${reference}). The funds have been returned to your wallet. Please verify your bank details or contact support.`;
  
  const html = `
    <div style="font-family: 'DM Sans', sans-serif; color: #2C2C2A; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #3D1F6B; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 500;">${header}</h1>
      <p style="font-size: 16px; line-height: 1.5;">${text}</p>
      <div style="margin: 30px 0;">
        <a href="${APP_URL}/wallet" style="background-color: #3D1F6B; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 50px; font-weight: 500; display: inline-block;">Go to Wallet</a>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html,
  });
}
