import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';
import { ROLE_SCOPES } from './interfaces/permission.types';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      role: UserRole.USER,
    });

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    console.log('------- user: ', user);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  async refresh(userId: string) {
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.issueTokenPair(user.id, user.email, user.role);
    } catch (error) {
      throw new UnauthorizedException('User not found');
    }
  }
  // TODO: refactor -> pass object instead of separate parameters
  // TODO: refactor -> extract this.jwtService.signAsync calls to separate method
  private async issueTokenPair(userId: string, email: string, role: UserRole) {
    const scopes = ROLE_SCOPES[role] || [];
    const payload = { sub: userId, email, role, scopes };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
