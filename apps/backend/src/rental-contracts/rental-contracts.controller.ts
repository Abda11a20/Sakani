// apps/backend/src/rental-contracts/rental-contracts.controller.ts

import { Controller, Post, Body, Patch, Param, Get, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RentalContractsService } from './rental-contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';
import { CreateContractDto } from './dto/create-contract.dto';
import { TerminateContractDto } from './dto/terminate-contract.dto';
import { RenewContractDto } from './dto/renew-contract.dto';
import { PrismaService } from '../prisma/prisma.service';

type SafeUser = Omit<User, 'passwordHash'>;

@ApiTags('Rental Contracts')
@ApiBearerAuth()
@Controller('rental-contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RentalContractsController {
  constructor(
    private readonly contractsService: RentalContractsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(UserRole.landlord)
  @ApiOperation({ summary: 'Create a rental contract manually' })
  async createManualContract(
    @CurrentUser() user: SafeUser,
    @Body() dto: CreateContractDto,
  ) {
    if (dto.landlordId !== user.id) {
      throw new ForbiddenException('لا يمكنك إنشاء عقد إيجار لمالك آخر');
    }
    return this.prisma.$transaction(async (tx) => {
      return this.contractsService.createContract(dto, tx);
    });
  }

  @Patch(':id/terminate')
  @Roles(UserRole.landlord)
  @ApiOperation({ summary: 'Terminate a rental contract early' })
  async terminateContract(
    @CurrentUser() user: SafeUser,
    @Param('id') id: string,
    @Body() dto: TerminateContractDto,
  ) {
    return this.contractsService.terminateContract(id, user.id, dto);
  }

  @Patch(':id/renew')
  @Roles(UserRole.landlord)
  @ApiOperation({ summary: 'Renew a rental contract' })
  async renewContract(
    @CurrentUser() user: SafeUser,
    @Param('id') id: string,
    @Body() dto: RenewContractDto,
  ) {
    return this.contractsService.renewContract(id, user.id, dto);
  }

  @Get('listing/:listingId/analytics')
  @Roles(UserRole.landlord)
  @ApiOperation({ summary: 'Get lease history and expected revenue analytics for a listing' })
  async getListingAnalytics(
    @CurrentUser() user: SafeUser,
    @Param('listingId') listingId: string,
  ) {
    // Basic authorization check: verify listing belongs to landlord
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      throw new ForbiddenException('الإعلان غير موجود');
    }
    if (listing.landlordId !== user.id) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض إحصائيات هذا الإعلان');
    }

    return this.contractsService.getListingContractAnalytics(listingId, user.id);
  }
}
