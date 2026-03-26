import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from './casl-ability.factory';
import {
  CHECK_POLICIES_KEY,
  PolicyHandlerType,
} from './decorators/check-policies.decorator';

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
    if (!user) return false;

    const ability = this.caslAbilityFactory.createForUser(user);

    return policyHandlers.every((handler) => {
      if (typeof handler === 'function') {
        return handler(ability);
      }
      return handler.handle(ability);
    });
  }
}
