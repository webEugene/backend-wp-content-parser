import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable } from 'rxjs';

@Injectable()
export class SecurityLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;

    if (this.isSuspiciousRequest(request)) {
      this.logger.warn('Suspicious request detected', {
        context: 'SecurityLoggingInterceptor',
        method,
        url,
        ip,
        userAgent: headers['user-agent'],
        timestamp: new Date().toISOString(),
      });
    }

    return next.handle();
  }

  private isSuspiciousRequest(request: any): boolean {
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i, // XSS
      /union.*select/i, // SQL injection
    ];

    const urlAndBody = `${request.url} ${JSON.stringify(request.body)}`;
    return suspiciousPatterns.some((pattern) => pattern.test(urlAndBody));
  }
}
