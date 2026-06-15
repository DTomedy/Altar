import 'server-only';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { IAuthService, JWTPayload } from './interfaces';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

export class AuthService implements IAuthService {
  signToken(payload: JWTPayload): string {
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as string;
    return jwt.sign(payload, getSecret(), { expiresIn } as jwt.SignOptions);
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, getSecret()) as JWTPayload;
    } catch {
      return null;
    }
  }

  async verifyAuth(req: NextRequest): Promise<JWTPayload | null> {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    return this.verifyToken(token);
  }

  async verifyAuthWithFallback(req: NextRequest): Promise<JWTPayload | null> {
    const headerResult = await this.verifyAuth(req);
    if (headerResult) return headerResult;
    const token = req.cookies.get('altar_token')?.value;
    if (!token) return null;
    return this.verifyToken(token);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
