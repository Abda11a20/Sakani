import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import * as os from 'os';

@ApiTags('Health')
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

    const memory = process.memoryUsage();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      process: {
        uptime: Math.floor(process.uptime()),
        pid: process.pid,
        memoryUsage: {
          rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
          heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
          heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
          externalMb: Math.round((memory.external / 1024 / 1024) * 100) / 100,
        },
      },
      system: {
        platform: os.platform(),
        cpuCount: os.cpus().length,
        loadAverage: os.loadavg(),
        freeMemoryGb: Math.round((freeMem / 1024 / 1024 / 1024) * 100) / 100,
        totalMemoryGb: Math.round((totalMem / 1024 / 1024 / 1024) * 100) / 100,
      },
      version: process.env.npm_package_version ?? '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
