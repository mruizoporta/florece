import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const SKIP_TENANT_KEY = 'skipTenant';
export const SkipTenant = () => SetMetadata(SKIP_TENANT_KEY, true);
