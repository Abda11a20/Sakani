// apps/backend/src/dashboard/providers/recommendation.provider.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListingStatus, UserRole } from '@prisma/client';

export interface RecommendationItem {
  id: string;
  priority: number;
  type: string;
  title: string;
  description: string;
  route: string;
  dismissable: boolean;
}

@Injectable()
export class DashboardRecommendationProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getRecommendations(userId: string, role: string): Promise<RecommendationItem[]> {
    if (role === UserRole.landlord) {
      return this.getLandlordRecommendations(userId);
    } else if (role === UserRole.tenant) {
      return this.getTenantRecommendations(userId);
    }
    return [];
  }

  private async getLandlordRecommendations(landlordId: string): Promise<RecommendationItem[]> {
    const list: RecommendationItem[] = [];

    const listingsCount = await this.prisma.listing.count({ where: { landlordId } });
    if (listingsCount === 0) {
      list.push({
        id: 'rec-create-first-listing',
        priority: 1,
        type: 'ONBOARDING',
        title: 'أنشئ إعلانك الأول على سكني',
        description: 'ابدأ بنشر وحدتك السكنية أو الأسرة المتاحة للايجار وجذب المستأجرين بسهولة.',
        route: '/dashboard/landlord/advertisements/new',
        dismissable: false,
      });
    } else {
      // Check listings without photos or low view count
      const lowViewListings = await this.prisma.listing.findFirst({
        where: { landlordId, status: ListingStatus.active, viewCount: { lte: 5 } },
      });

      if (lowViewListings) {
        list.push({
          id: `rec-enhance-${lowViewListings.id}`,
          priority: 2,
          type: 'OPTIMIZATION',
          title: 'حسّن إعلانك لجذب مشاهدات أكثر',
          description: `إعلانك "${lowViewListings.title}" يتلقى مشاهدات قليلة. ننصح بإضافة صور عالية الجودة وتفاصيل أوضح.`,
          route: `/dashboard/landlord/advertisements/${lowViewListings.id}`,
          dismissable: true,
        });
      }
    }

    return list;
  }

  private async getTenantRecommendations(tenantId: string): Promise<RecommendationItem[]> {
    const list: RecommendationItem[] = [];

    const alertsCount = await this.prisma.alert.count({ where: { tenantId, isActive: true } });
    if (alertsCount === 0) {
      list.push({
        id: 'rec-create-alert',
        priority: 1,
        type: 'ALERT',
        title: 'فعّل التنبيهات الذكية للسكن',
        description: 'حدد محافظتك وميزانيتك ليصلك إشعار فوري فور إضافة أي شقة أو سرير يناسب رغبتك.',
        route: '/dashboard/tenant',
        dismissable: true,
      });
    }

    return list;
  }
}
