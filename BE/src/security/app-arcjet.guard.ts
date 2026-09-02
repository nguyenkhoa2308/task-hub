import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { SSE_METADATA } from '@nestjs/common/constants';
import { ARCJET, ArcjetGuard, type ArcjetNest } from '@arcjet/nest';

@Injectable()
export class AppArcjetGuard implements CanActivate {
  private readonly arcjetGuard: InstanceType<typeof ArcjetGuard>;

  constructor(@Inject(ARCJET) arcjet: ArcjetNest) {
    this.arcjetGuard = new ArcjetGuard(arcjet);
  }

  canActivate(context: ExecutionContext) {
    if (Reflect.getMetadata(SSE_METADATA, context.getHandler()) === true) {
      return true;
    }
    return this.arcjetGuard.canActivate(context);
  }
}
