import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import type { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(() => {
    usersService = { findByEmail: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-jwt') };
    const configService = {
      get: jest.fn((key: string) => (key === 'JWT_EXPIRES_IN_SECONDS' ? 3600 : undefined)),
    };

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('rejects a login for an unknown email without revealing which part was wrong', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nobody@example.test', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a login with an incorrect password', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    usersService.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@example.test',
      passwordHash,
      fullname: 'A',
    });

    await expect(
      service.login({ email: 'a@example.test', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issues a signed access token and profile on success', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    usersService.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@example.test',
      passwordHash,
      fullname: 'A',
    });

    const result = await service.login({ email: 'a@example.test', password: 'correct-password' });

    expect(result).toEqual({
      accessToken: 'signed-jwt',
      expiresIn: 3600,
      user: { id: 'u1', email: 'a@example.test', fullname: 'A' },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: 'u1', email: 'a@example.test' },
      { expiresIn: 3600 },
    );
  });
});
