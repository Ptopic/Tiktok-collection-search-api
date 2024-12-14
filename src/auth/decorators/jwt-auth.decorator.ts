import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt.guard';

export function JwtAuth(): MethodDecorator {
	return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth());
}
