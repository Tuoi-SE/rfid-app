import { SetMetadata } from '@nestjs/common';
import { AppAbility } from '../casl-ability.factory';

export interface PolicyHandler {
  handle(ability: AppAbility): boolean;
}

export type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandlerType = PolicyHandler | PolicyHandlerCallback;

export class PolicyDecorator {
  static readonly CHECK_POLICIES_KEY = 'check_policy';

  static check(...handlers: PolicyHandlerType[]) {
    return SetMetadata(PolicyDecorator.CHECK_POLICIES_KEY, handlers);
  }
}
