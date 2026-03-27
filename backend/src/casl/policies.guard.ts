import { Injectable, CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from './casl-ability.factory';
import {
  CHECK_POLICIES_KEY,
  PolicyHandlerType,
} from './decorators/check-policies.decorator';
import { BusinessException } from '@common/exceptions/business.exception';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policyHandlers =
      this.reflector.getAllAndOverride<PolicyHandlerType[]>(CHECK_POLICIES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!policyHandlers || policyHandlers.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new BusinessException(
        'Bạn chưa đăng nhập',
        'UNAUTHORIZED',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const ability = this.caslAbilityFactory.createForUser(user);

    const isAllowed = policyHandlers.every((handler) => {
      if (typeof handler === 'function') {
        return handler(ability);
      }
      return handler.handle(ability);
    });

    if (!isAllowed) {
      throw new BusinessException(
        'Bạn không có quyền thực hiện thao tác này',
        'FORBIDDEN_ACTION',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
