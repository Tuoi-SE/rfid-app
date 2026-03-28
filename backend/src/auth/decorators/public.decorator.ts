import { SetMetadata } from '@nestjs/common';

export class PublicRouteDecorator {
  static readonly IS_PUBLIC_KEY = 'isPublic';

  static mark() {
    return SetMetadata(PublicRouteDecorator.IS_PUBLIC_KEY, true);
  }
}
