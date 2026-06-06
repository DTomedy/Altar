import 'server-only';

import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set — check .env.local');
  return secret;
}

export interface JWTPayload {
  userId: string;
  email: string;
  kycLevel: number;
  emailVerified: boolean;
}

export function signToken(payload: JWTPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as string;
  return jwt.sign(payload, getSecret(), { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyAuth(req: NextRequest): Promise<JWTPayload | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return verifyToken(token);
}

// Fallback: read from cookie if Bearer header is absent
export async function verifyAuthWithFallback(req: NextRequest): Promise<JWTPayload | null> {
  const headerResult = await verifyAuth(req);
  if (headerResult) return headerResult;
  const token = req.cookies.get('altar_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Password hashing helper (cost factor 12)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
