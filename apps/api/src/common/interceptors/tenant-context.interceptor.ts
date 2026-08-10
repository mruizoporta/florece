import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { Observable } from 'rxjs';
import { TenantContext } from '../../tenant/tenant.context';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ tenant?: Tenant }>();
    const tenant = request.tenant ?? this.tenantContext.tryGetTenant();
    if (!tenant) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      this.tenantContext.run(tenant, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
