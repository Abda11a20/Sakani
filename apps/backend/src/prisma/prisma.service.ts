import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AsyncLocalStorage } from 'async_hooks';

export const transactionStorage = new AsyncLocalStorage<Array<() => void>>();

@Injectable()
// PrismaService extends PrismaClient to provide database access
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL ?? '',
    });
    super({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  override async $transaction(arg: any, options?: any): Promise<any> {
    if (typeof arg === 'function') {
      const pendingDispatches: Array<() => void> = [];
      try {
        const result = await transactionStorage.run(pendingDispatches, () => {
          return super.$transaction(arg, options);
        });

        // Run post-commit dispatches
        for (const dispatch of pendingDispatches) {
          try {
            dispatch();
          } catch {
            // ignore dispatch error
          }
        }

        return result;
      } catch (error) {
        throw error;
      }
    }
    return super.$transaction(arg, options);
  }
}
