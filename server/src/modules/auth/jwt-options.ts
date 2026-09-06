/**
 * JWT algorithm selection — RS256 when PEM keys are present, else HS256 + JWT_SECRET.
 * Purpose: optional RS256 path without breaking existing HS256 deploys (EXTEND).
 * Dependencies: @nestjs/jwt JwtModuleOptions
 * Date: 2026-08-10
 *
 * Docs (RS256 path):
 * - Set JWT_PRIVATE_KEY + JWT_PUBLIC_KEY (PEM, `\n` escaped in .env is OK).
 * - Prefer delivering access tokens via HttpOnly Secure cookies on the client
 *   (never localStorage). Cookie wiring is a future client EXTEND; API still
 *   returns Bearer tokens today for backward compatibility.
 * - If either key is missing, fall back to HS256 with JWT_SECRET.
 */
import type { JwtModuleOptions } from '@nestjs/jwt';

function normalizePem(raw: string): string {
  return raw.replace(/\\n/g, '\n').trim();
}

export function buildJwtModuleOptions(env: NodeJS.ProcessEnv = process.env): JwtModuleOptions {
  const privateKeyRaw = env.JWT_PRIVATE_KEY?.trim();
  const publicKeyRaw = env.JWT_PUBLIC_KEY?.trim();
  const expiresIn = env.JWT_EXPIRES_IN ?? '7d';

  if (privateKeyRaw && publicKeyRaw) {
    return {
      privateKey: normalizePem(privateKeyRaw),
      publicKey: normalizePem(publicKeyRaw),
      signOptions: { algorithm: 'RS256', expiresIn },
      verifyOptions: { algorithms: ['RS256'] },
    };
  }

  // HS256 fallback — preserves all existing builds that only set JWT_SECRET.
  return {
    secret: env.JWT_SECRET ?? 'dev-secret',
    signOptions: { expiresIn },
  };
}
