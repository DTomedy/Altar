import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  phone: z.string().regex(/^(?:\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number').trim(),
});

export const CreateCampaignSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100).trim(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000).trim(),
  type: z.enum(['WISHLIST', 'GOAL']),
  coverPhoto: z.string().optional().nullable(),
  goalAmount: z.number().min(500, 'Minimum goal is ₦500').max(50000000, 'Maximum goal is ₦50,000,000').optional().nullable(),
  deadline: z.string().optional().nullable(), // ISO string date
  allowOverflow: z.boolean().default(false),
  items: z.array(z.object({
    name: z.string().min(2, 'Item name must be at least 2 characters').trim(),
    description: z.string().optional().nullable(),
    targetAmount: z.number().positive('Target amount must be greater than zero'),
  })).optional(),
}).refine(data => {
  if (data.type === 'GOAL') {
    return data.goalAmount !== undefined && data.goalAmount !== null && data.deadline !== undefined && data.deadline !== null;
  }
  return true;
}, {
  message: 'Goal amount and deadline are required for goal-based fundraisers',
  path: ['goalAmount'],
}).refine(data => {
  if (data.type === 'WISHLIST') {
    return data.items !== undefined && data.items !== null && data.items.length >= 1;
  }
  return true;
}, {
  message: 'At least one wishlist item is required for wishlist campaigns',
  path: ['items'],
});

export const CreateContributionSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  wishlistItemId: z.string().optional().nullable(),
  amount: z.number().min(500, 'Minimum contribution is ₦500').max(10000000, 'Maximum contribution is ₦10,000,000'),
  isAnonymous: z.boolean(),
  displayName: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  txRef: z.string().min(1, 'Transaction reference is required'),
});

export const VerifyContributionSchema = z.object({
  txRef: z.string().min(1, 'Transaction reference is required'),
});

export const WithdrawSchema = z.object({
  accountNumber: z.string().regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
  bankCode: z.string().min(1, 'Bank code is required'),
  amount: z.number().positive('Amount must be positive'),
});

export const KycSubmitSchema = z.object({
  documentType: z.enum(['NIN', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD']),
  documentBase64: z.string().min(1, 'Document file data (base64) is required'),
});
