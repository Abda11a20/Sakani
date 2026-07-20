// apps/backend/src/rental-contracts/rental-contracts.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ContractStatus,
  PaymentCycle,
  TerminationReason,
  ContractCreatedBy,
  Prisma,
  RentalContract,
  NotificationType,
} from '@prisma/client';
import { ListingsService } from '../listings/listings.service';
import { BedsService } from '../beds/beds.service';
import { NotificationService } from '../notifications/notifications.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { TerminateContractDto } from './dto/terminate-contract.dto';
import { RenewContractDto } from './dto/renew-contract.dto';

@Injectable()
export class RentalContractsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ListingsService))
    private readonly listingsService: ListingsService,
    @Inject(forwardRef(() => BedsService))
    private readonly bedsService: BedsService,
    private readonly notificationService: NotificationService,
  ) {}

  private async generateContractNumber(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    // Ensure the sequence exists dynamically
    await tx.$executeRawUnsafe(
      'CREATE SEQUENCE IF NOT EXISTS contract_number_seq START 1;',
    );
    const result = await tx.$queryRawUnsafe<any[]>(
      "SELECT nextval('contract_number_seq')",
    );
    const nextval = result[0]?.nextval;
    const seq = String(nextval || 1).padStart(6, '0');
    return `SKN-CNT-${year}-${seq}`;
  }

  async createContract(
    dto: CreateContractDto,
    tx: Prisma.TransactionClient,
  ): Promise<RentalContract> {
    const contractNumber = await this.generateContractNumber(tx);
    return tx.rentalContract.create({
      data: {
        contractNumber,
        listingId: dto.listingId,
        landlordId: dto.landlordId,
        tenantId: dto.tenantId,
        bedId: dto.bedId || null,
        viewingRequestId: dto.viewingRequestId || null,
        createdByType: dto.createdByType || ContractCreatedBy.VIEWING_REQUEST,
        monthlyRent: dto.monthlyRent,
        securityDeposit: dto.securityDeposit || 0,
        paymentCycle: dto.paymentCycle || PaymentCycle.monthly,
        currency: dto.currency || 'EGP',
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isAutoRenew: dto.isAutoRenew || false,
        notes: dto.notes || null,
        status: ContractStatus.active,
      },
    });
  }

  async terminateContract(
    contractId: string,
    landlordId: string,
    dto: TerminateContractDto,
  ): Promise<RentalContract> {
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.rentalContract.findUnique({
        where: { id: contractId },
        include: { listing: true },
      });

      if (!contract) {
        throw new NotFoundException('العقد غير موجود');
      }
      if (contract.landlordId !== landlordId) {
        throw new ForbiddenException('ليس لديك صلاحية لإنهاء هذا العقد');
      }
      if (contract.status !== ContractStatus.active) {
        throw new BadRequestException('العقد ليس نشطاً ليتم إنهاؤه');
      }

      const updatedContract = await tx.rentalContract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.terminated,
          actualCheckout: dto.checkoutDate || new Date(),
          terminationReason: dto.reason,
          terminationNotes: dto.notes || null,
        },
      });

      // Vacate cache inside Listing/Bed via services
      if (contract.bedId) {
        // Direct bed vacate
        await this.bedsService.vacateBed(contract.bedId, landlordId, tx);
      } else {
        // Full listing vacate
        await this.listingsService.vacateListing(contract.listingId, tx);
      }

      // Notifications
      await this.notificationService.createUnique(
        {
          userId: contract.tenantId,
          type: NotificationType.ALERT,
          title: 'إنهاء عقد الإيجار',
          body: `تم إنهاء عقد الإيجار رقم ${contract.contractNumber} مبكراً.`,
          entityType: 'contract.terminated',
          entityId: contract.id,
        },
        tx,
      );

      await this.notificationService.createUnique(
        {
          userId: contract.landlordId,
          type: NotificationType.ALERT,
          title: 'تم إنهاء عقد الإيجار',
          body: `تم تسجيل إنهاء عقد الإيجار رقم ${contract.contractNumber} للمستأجر بنجاح.`,
          entityType: 'contract.terminated',
          entityId: contract.id,
        },
        tx,
      );

      return updatedContract;
    });
  }

  async renewContract(
    contractId: string,
    landlordId: string,
    dto: RenewContractDto,
  ): Promise<RentalContract> {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.rentalContract.findUnique({
        where: { id: contractId },
      });

      if (!old) {
        throw new NotFoundException('العقد غير موجود');
      }
      if (old.landlordId !== landlordId) {
        throw new ForbiddenException('ليس لديك صلاحية لتجديد هذا العقد');
      }
      if (
        old.status !== ContractStatus.active &&
        old.status !== ContractStatus.expired
      ) {
        throw new BadRequestException(
          'لا يمكن تجديد هذا العقد لأن حالته غير قابلة للتجديد',
        );
      }

      // Mark old as renewed
      await tx.rentalContract.update({
        where: { id: contractId },
        data: { status: ContractStatus.renewed },
      });

      // Create new contract
      const newContract = await this.createContract(
        {
          listingId: old.listingId,
          landlordId: old.landlordId,
          tenantId: old.tenantId,
          bedId: old.bedId || undefined,
          viewingRequestId: old.viewingRequestId || undefined,
          createdByType: dto.createdByType || ContractCreatedBy.MANUAL,
          startDate: old.endDate,
          endDate: new Date(dto.newEndDate),
          monthlyRent:
            dto.newMonthlyRent !== undefined
              ? dto.newMonthlyRent
              : old.monthlyRent,
          securityDeposit: old.securityDeposit,
          paymentCycle: old.paymentCycle,
          currency: old.currency,
          isAutoRenew:
            dto.isAutoRenew !== undefined ? dto.isAutoRenew : old.isAutoRenew,
          notes: dto.notes,
        },
        tx,
      );

      // Update Listing rentedUntil Cache
      await tx.listing.update({
        where: { id: old.listingId },
        data: { rentedUntil: new Date(dto.newEndDate) },
      });

      // Notify tenant
      await this.notificationService.createUnique(
        {
          userId: old.tenantId,
          type: NotificationType.ALERT,
          title: 'تجديد عقد الإيجار',
          body: `تم تجديد عقد الإيجار رقم ${old.contractNumber} بعقد جديد رقم ${newContract.contractNumber} حتى ${newContract.endDate.toLocaleDateString('ar-EG')}.`,
          entityType: 'contract.renewed',
          entityId: newContract.id,
        },
        tx,
      );

      return newContract;
    });
  }

  async getListingContractAnalytics(listingId: string, landlordId: string) {
    const contracts = await this.prisma.rentalContract.findMany({
      where: { listingId, landlordId },
      orderBy: { startDate: 'desc' },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            phone: true,
          },
        },
      },
    });

    const totalRevenue = contracts.reduce((acc, c) => {
      // Calculate active days/months or sum monthly rent
      const start = new Date(c.startDate).getTime();
      const end = (
        c.actualCheckout ? new Date(c.actualCheckout) : new Date(c.endDate)
      ).getTime();
      const months = Math.max(
        1,
        Math.ceil((end - start) / (30 * 24 * 60 * 60 * 1000)),
      );
      return acc + c.monthlyRent * months;
    }, 0);

    return {
      totalContracts: contracts.length,
      activeContracts: contracts.filter(
        (c) => c.status === ContractStatus.active,
      ).length,
      expectedRevenue: totalRevenue,
      contracts,
    };
  }

  async terminateExpiredContract(
    contractId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const contract = await tx.rentalContract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.status !== ContractStatus.active) {
      return;
    }

    // 1. Mark contract as expired
    await tx.rentalContract.update({
      where: { id: contractId },
      data: { status: ContractStatus.expired },
    });

    // 2. Vacate Listing / Bed & Pause the listing
    if (contract.bedId) {
      await this.bedsService.vacateBedBySystem(contract.bedId, tx);
    } else {
      await this.listingsService.vacateListing(contract.listingId, tx, true); // true = force Listing status to 'paused'
    }

    // 3. Notify parties
    await this.notificationService.createUnique(
      {
        userId: contract.landlordId,
        type: NotificationType.ALERT,
        title: 'انتهاء عقد الإيجار',
        body: `انتهى عقد الإيجار رقم ${contract.contractNumber}. تم إخلاء العقار وتغيير حالته إلى "موقف مؤقتاً" بانتظار قرارك.`,
        entityType: 'contract.expired',
        entityId: contract.id,
      },
      tx,
    );

    await this.notificationService.createUnique(
      {
        userId: contract.tenantId,
        type: NotificationType.ALERT,
        title: 'انتهاء عقد إيجارك',
        body: `انتهت مدة عقد الإيجار رقم ${contract.contractNumber} للمسكن.`,
        entityType: 'contract.expired',
        entityId: contract.id,
      },
      tx,
    );
  }
}
