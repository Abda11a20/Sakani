// apps/backend/src/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let dbStatus = 'disconnected';
    let dbLatencyMs: number | null = null;

    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
