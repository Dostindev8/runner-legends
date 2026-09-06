/**
 * Password hashing — Argon2id for NEW hashes; bcrypt verify kept for existing users.
 * Purpose: migration-friendly EXTEND (mega prompt v3.0) without invalidating legacy rows.
 * Dependencies: argon2, bcryptjs
 * Date: 2026-08-10
 */
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthCrypto {
  /** Hash with Argon2id (OWASP / mega-prompt preferred algorithm). */
  async hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  /**
   * Verify against Argon2id OR legacy bcrypt.
   * bcrypt path is EXTEND-only so pre-v3 accounts keep working until they re-login.
   */
  async verify(storedHash: string, password: string): Promise<boolean> {
    if (this.isArgon2(storedHash)) {
      try {
        return await argon2.verify(storedHash, password);
      } catch {
        return false;
      }
    }
    if (this.isBcrypt(storedHash)) {
      return bcrypt.compare(password, storedHash);
    }
    return false;
  }

  /** True when the stored hash should be upgraded to Argon2id after a successful login. */
  needsRehash(storedHash: string): boolean {
    return !this.isArgon2(storedHash);
  }

  private isArgon2(hash: string): boolean {
    return hash.startsWith('$argon2');
  }

  private isBcrypt(hash: string): boolean {
    return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
  }
}
