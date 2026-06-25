import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    let identifier = '';

    if (req.body) {
      if (req.body.email) identifier = `-${req.body.email}`;
      else if (req.body.phone) identifier = `-${req.body.phone}`;
      else if (req.body.identifier) identifier = `-${req.body.identifier}`;
    }

    // Key format: IP-email/phone
    return `${ip}${identifier}`;
  }
}
