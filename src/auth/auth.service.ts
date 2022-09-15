import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { User } from '../user/entities/user.entity';
import { compare } from 'bcrypt';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';
import { config } from '../config/config';

import { LoginResponse, LogoutAllResponse, LogoutResponse } from '../types';
import { UserHelperService } from '../user/user-helper.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserHelperService)) private userHelperService: UserHelperService,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    @Inject(JwtService) private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userService.getUser({ username });

    if (user) {
      const hashCompareResult = await compare(password, user.hashPwd);

      if (hashCompareResult) {
        return user;
      }
    }

    return null;
  }

  async login(user: User, res: Response): Promise<LoginResponse> {
    if (user.jwtId) {
      const payload = { jwtId: user.jwtId };
      res.cookie('access_token', this.jwtService.sign(payload), {
        secure: false,
        httpOnly: true,
        maxAge: config.jwtCookieTimeToExpire,
        domain: config.jwtCookieDomain,
      });
    } else {
      user.jwtId = await this.generateNewJwtId();
      await user.save();

      const payload = { jwtId: user.jwtId };
      res.cookie('access_token', this.jwtService.sign(payload), {
        secure: false,
        httpOnly: true,
        maxAge: config.jwtCookieTimeToExpire,
        domain: config.jwtCookieDomain,
      });
    }

    return this.userHelperService.filter(user);
  }

  async logout(res: Response): Promise<LogoutResponse> {
    res.clearCookie('access_token', {
      secure: false,
      httpOnly: true,
      maxAge: config.jwtCookieTimeToExpire,
      domain: config.jwtCookieDomain,
    });

    return { ok: true };
  }

  async logoutAll(user: User, res: Response): Promise<LogoutAllResponse> {
    if (!user?.jwtId) return { ok: false };

    user.jwtId = null;
    await user.save();

    res.clearCookie('access_token', {
      secure: false,
      httpOnly: true,
      maxAge: config.jwtCookieTimeToExpire,
      domain: config.jwtCookieDomain,
    });

    return { ok: true };
  }

  async generateNewJwtId(): Promise<string> {
    let isUniqueness: boolean;
    let newJwtId: string;
    do {
      newJwtId = uuid();
      isUniqueness = await this.userHelperService.checkUserFieldUniqueness({
        jwtId: newJwtId,
      });
    } while (!isUniqueness);

    return newJwtId;
  }
}
