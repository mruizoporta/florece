import { SetMetadata } from '@nestjs/common';
import type { FeatureKey } from '@florece/shared';

export const FEATURE_KEY = 'requiredFeature';
export const RequireFeature = (feature: FeatureKey) =>
  SetMetadata(FEATURE_KEY, feature);
