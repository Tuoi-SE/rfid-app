import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivityLogService } from './activity-log.service';

const METHOD_ACTION_MAP: Record<string, string> = {
  POST: 'CREATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private activityLogService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const action = METHOD_ACTION_MAP[method];

    // Only log CUD operations
    if (!action) return next.handle();

    const user = request.user;
    if (!user) return next.handle();

    // Extract entity from controller route path
    const path = request.route?.path || request.url;
    const entity = this.extractEntity(path);
    const entityId = request.params?.id || request.params?.epc || null;

    return next.handle().pipe(
      tap((responseData) => {
        this.activityLogService.log({
          userId: user.id,
          action,
          entity,
          entityId: entityId || responseData?.id,
          details: {
            method,
            path: request.url,
            body: this.sanitizeBody(request.body),
          },
          ipAddress: request.ip,
        }).catch(() => {}); // Fire and forget — don't block response
      }),
    );
  }

  private extractEntity(path: string): string {
    const segments = path.replace('/api/', '').split('/');
    const raw = segments[0] || 'unknown';
    // Capitalize: "categories" -> "Category"
    return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/s$/, '');
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body) return {};
    const sanitized = { ...body };
    delete sanitized.password;
    return sanitized;
  }
}
