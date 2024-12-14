import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuth } from './decorators/jwt-auth.decorator';
import { AuthPayloadDto } from './dtos/auth.dto';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() payload: AuthPayloadDto) {
    return this.authService.signup(payload);
  }

  @Post('login')
  login(@Body() payload: AuthPayloadDto) {
    return this.authService.login(payload);
  }

  @Get('me')
  @JwtAuth()
  me(@Req() req: Request & { user: User }) {
    return req.user;
  }
}
