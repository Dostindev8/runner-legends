import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { User } from './schemas/user.schema';
import { Player } from '../players/schemas/player.schema';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthCrypto } from './auth-crypto.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Player.name) private readonly players: Model<Player>,
    private readonly jwt: JwtService,
    private readonly crypto: AuthCrypto,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; playerId: string }> {
    const existing = await this.users.findOne({ email: dto.email.toLowerCase() }).lean();
    if (existing) throw new ConflictException('Email already registered');

    const playerId = randomUUID();
    // NEW hashes use Argon2id via AuthCrypto (bcrypt verify still supported for legacy rows).
    const passwordHash = await this.crypto.hash(dto.password);
    await this.users.create({ email: dto.email.toLowerCase(), passwordHash, playerId, isMinor: dto.isMinor ?? false });
    // Kori Voltz is the starting character (GDD 9.2).
    await this.players.create({ playerId, unlockedCharacters: ['kori_voltz'] });
    return { accessToken: await this.sign(playerId), playerId };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; playerId: string }> {
    const user = await this.users.findOne({ email: dto.email.toLowerCase() });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await this.crypto.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    // Transparent upgrade: bcrypt → Argon2id after a successful login (EXTEND migration).
    if (this.crypto.needsRehash(user.passwordHash)) {
      user.passwordHash = await this.crypto.hash(dto.password);
      await user.save();
    }
    return { accessToken: await this.sign(user.playerId), playerId: user.playerId };
  }

  /** GDPR right-to-erasure (GDD 13.3): hard-delete account + all linked game data. */
  async deleteAccount(playerId: string): Promise<void> {
    await Promise.all([
      this.users.deleteOne({ playerId }),
      this.players.deleteOne({ playerId }),
    ]);
  }

  private sign(playerId: string): Promise<string> {
    return this.jwt.signAsync({ sub: playerId, playerId });
  }
}
