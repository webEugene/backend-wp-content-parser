import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import * as requestIp from 'request-ip';

export const Ip = createParamDecorator((data, ctx: ExecutionContext) => {
  const ip = requestIp.getClientIp(ctx.switchToHttp().getRequest() as Request);

  return ip.slice(0, 7) === '::ffff:' ? ip.slice(7) : ip;
});
