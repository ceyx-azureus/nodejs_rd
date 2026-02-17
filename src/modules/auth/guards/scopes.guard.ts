import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '../decorators/scopes.decorator';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScopes?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    const userScopes: string[] = user.scopes || [];

    return requiredScopes.every((scope) => {
      if (userScopes.includes(scope)) {
        return true;
      }
      const [resource] = scope.split(':');
      return userScopes.includes(`${resource}:manage`);
    });
  }
}
