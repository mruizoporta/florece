import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Tenant } from '@prisma/client';

@Injectable()
export class TenantContext {
  private readonly storage = new AsyncLocalStorage<Tenant>();

  run<T>(tenant: Tenant, fn: () => T): T {
    return this.storage.run(tenant, fn);
  }

  setTenant(tenant: Tenant): void {
    const store = this.storage.getStore();
    if (store) {
      Object.assign(store, tenant);
      return;
    }
    this.storage.enterWith(tenant);
  }

  getTenant(): Tenant {
    const tenant = this.storage.getStore();
    if (!tenant) {
      throw new Error('Tenant context is not set');
    }
    return tenant;
  }

  tryGetTenant(): Tenant | undefined {
    return this.storage.getStore();
  }
}
