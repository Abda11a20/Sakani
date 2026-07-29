// apps/backend/src/rental-contracts/lease-expiry.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RentalContractsService } from './rental-contracts.service';
import { ContractStatus } from '@prisma/client';

@Injectable()
export class LeaseExpiryService {
  private readonly logger = new Logger(LeaseExpiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contractsService: RentalContractsService,
  ) {}

  // Run hourly to check for expired contracts
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredContracts(): Promise<void> {
    this.logger.log('Starting check for expired rental contracts...');
    const now = new Date();

    try {
      const expiredContracts = await this.prisma.rentalContract.findMany({
        where: {
          status: ContractStatus.active,
          endDate: { lte: now },
        },
      });

      if (expiredContracts.length === 0) {
        this.logger.log('No expired contracts to process.');
        return;
      }

      this.logger.log(
        `Found ${expiredContracts.length} expired contracts to process.`,
      );

      for (const contract of expiredContracts) {
        try {
          await this.prisma.$transaction(async (tx) => {
            // Re-verify contract state inside transaction for idempotency & race-condition safety
            const fresh = await tx.rentalContract.findFirst({
              where: {
                id: contract.id,
                status: ContractStatus.active,
                endDate: { lte: now },
              },
            });

            if (!fresh) {
              this.logger.log(
                `Contract ${contract.contractNumber} was updated concurrently, skipping.`,
              );
              return;
            }

            if (fresh.isAutoRenew) {
              // Auto renew contract: calculate duration and renew
              const duration =
                fresh.endDate.getTime() - fresh.startDate.getTime();
              const newEndDate = new Date(fresh.endDate.getTime() + duration);

              this.logger.log(
                `Auto-renewing contract ${fresh.contractNumber} to ${newEndDate}`,
              );
              await this.contractsService.renewContract(
                fresh.id,
                fresh.landlordId,
                {
                  newEndDate,
                  createdByType: 'AUTO_RENEW',
                },
              );
            } else {
              // Terminate naturally as expired
              this.logger.log(
                `Expiring contract ${fresh.contractNumber} naturally.`,
              );
              await this.contractsService.terminateExpiredContract(
                fresh.id,
                tx,
              );
            }
          });
        } catch (err: any) {
          this.logger.error(
            `Failed to process lease expiry/renewal for contract ${contract.contractNumber}: ${err?.message || err}`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(
        `Error querying expired rental contracts: ${error?.message || error}`,
      );
    }

    this.logger.log('Finished check for expired rental contracts.');
  }
}
