import 'server-only';
import nodemailer from 'nodemailer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransporter(forceEthereal = false): Promise<nodemailer.Transporter> {
  if (!forceEthereal && process.env.SMTP_HOST && process.env.SMTP_USER) {
    console.log('[Nodemailer] Using SMTP:', process.env.SMTP_HOST, process.env.SMTP_USER);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Dev fallback — Ethereal
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount();
      console.log('[Nodemailer] Ethereal account created:', testAccount.user);
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    })();
  }

  return transporterPromise;
}

const FROM_EMAIL = process.env.SMTP_FROM || 'Altar <noreply@altar.app>';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const primaryTransporter = await getTransporter(false);
  try {
    const info = await primaryTransporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (info.messageId && !process.env.SMTP_HOST) {
      console.log('[Nodemailer] Preview URL:', nodemailer.getTestMessageUrl(info));
    } else if (info.messageId) {
      console.log('[Nodemailer] Email sent:', info.messageId);
    }

    return info;
  } catch (err) {
    console.error('[Nodemailer] Primary SMTP failed:', err);
    if (!process.env.SMTP_HOST) {
      console.log('[Nodemailer] Falling back to Ethereal...');
      transporterPromise = null;
      const fallback = await getTransporter(true);
      const info = await fallback.sendMail({
        from: 'Altar <noreply@altar.app>',
        to,
        subject,
        html,
      });
      if (info.messageId) {
        console.log('[Nodemailer] Ethereal Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      return info;
    }
    throw err;
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
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

  return sendEmail({ to: email, subject: 'Verify your Altar account', html });
}

export async function sendCampaignGoalReachedEmail(email: string, campaignTitle: string, raisedAmount: string) {
  const html = `
    <div style="font-family: 'DM Sans', sans-serif; color: #2C2C2A; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #3D1F6B; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 500;">Goal Reached!</h1>
      <p style="font-size: 16px; line-height: 1.5;">Congratulations! Your campaign <strong>${campaignTitle}</strong> has reached its goal of <span style="font-family: 'IBM Plex Mono', monospace; font-weight: 500;">${raisedAmount}</span>.</p>
      <p style="font-size: 16px; line-height: 1.5;">You can check your wallet details and manage your gifts on your Altar dashboard.</p>
      <div style="margin: 30px 0;">
        <a href="${APP_URL}/dashboard" style="background-color: #3D1F6B; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 50px; font-weight: 500; display: inline-block;">Go to Dashboard</a>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject: `Goal Reached: ${campaignTitle}`, html });
}

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

  return sendEmail({ to: email, subject: `Campaign finished: ${campaignTitle}`, html });
}

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

  return sendEmail({ to: email, subject, html });
}
