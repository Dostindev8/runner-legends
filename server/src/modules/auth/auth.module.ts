import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Player, PlayerSchema } from '../players/schemas/player.schema';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthCrypto } from './auth-crypto.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { buildJwtModuleOptions } from './jwt-options';

/**
 * Auth module — EXTEND: optional RS256 via JWT_PRIVATE_KEY / JWT_PUBLIC_KEY.
 * See docs/JWT_RS256.md. Missing keys → HS256 + JWT_SECRET (unchanged default).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Player.name, schema: PlayerSchema },
    ]),
    JwtModule.register(buildJwtModuleOptions()),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthCrypto, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule, AuthCrypto],
})
export class AuthModule {}
