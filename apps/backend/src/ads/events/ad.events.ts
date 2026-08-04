import { DeviceTarget } from '@prisma/client';

export class AdImpressionEvent {
  constructor(
    public readonly adId: string,
    public readonly userId?: string,
    public readonly referrer?: string,
    public readonly deviceType: DeviceTarget = DeviceTarget.ALL,
    public readonly userIp?: string,
    public readonly userAgent?: string,
  ) {}
}

export class AdClickEvent {
  constructor(
    public readonly adId: string,
    public readonly userId?: string,
    public readonly referrer?: string,
    public readonly deviceType: DeviceTarget = DeviceTarget.ALL,
    public readonly userIp?: string,
    public readonly userAgent?: string,
  ) {}
}
