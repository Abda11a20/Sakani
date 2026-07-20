// apps/backend/src/rental-contracts/lease-expiry.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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

  // Run at 01:00 AM every day
  @Cron('0 1 * * *')
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

      this.logger.log(
        `Found ${expiredContracts.length} expired contracts to process.`,
      );

      for (const contract of expiredContracts) {
        try {
          if (contract.isAutoRenew) {
            // Auto renew contract: calculate duration and renew
            const duration =
              contract.endDate.getTime() - contract.startDate.getTime();
            const newEndDate = new Date(contract.endDate.getTime() + duration);

            this.logger.log(
              `Auto-renewing contract ${contract.contractNumber} to ${newEndDate}`,
            );
            await this.contractsService.renewContract(
              contract.id,
              contract.landlordId,
              {
                newEndDate,
                createdByType: 'AUTO_RENEW',
              },
            );
          } else {
            // Terminate naturally as expired
            this.logger.log(
              `Expiring contract ${contract.contractNumber} naturally.`,
            );
            await this.prisma.$transaction(async (tx) => {
              await this.contractsService.terminateExpiredContract(
                contract.id,
                tx,
              );
            });
          }
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
