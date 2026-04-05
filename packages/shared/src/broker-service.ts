import {
  Broker,
  BrokerFees,
  BrokerFeatures,
  BrokerReview,
  BrokerPerformance,
  BrokerComparison,
  BrokerFilters,
  FeeCalculation,
  BrokerRecommendationRequest,
  BrokerRecommendation,
  OjkLicenseStatus
} from './types';

// Database interface to avoid direct Prisma dependency
export interface DatabaseClient {
  broker: {
    findMany: (args: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
  };
  brokerReview: {
    findMany: (args: any) => Promise<any[]>;
    count: (args: any) => Promise<number>;
    create: (args: any) => Promise<any>;
  };
  brokerPerformance: {
    findFirst: (args: any) => Promise<any>;
  };
}

export class BrokerService {
  private db: DatabaseClient;

  constructor(databaseClient: DatabaseClient) {
    this.db = databaseClient;
  }

  async getBrokers(filters: BrokerFilters = {}): Promise<Broker[]> {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { legalName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.ojkStatus) {
      where.ojkLicenseStatus = filters.ojkStatus;
    }

    const brokers = await this.db.broker.findMany({
      where,
      include: {
        fees: true,
        features: true,
        reviews: {
          select: {
            overallRating: true
          }
        },
        performanceMetrics: {
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    });

    // Apply client-side filters for complex conditions
    return brokers.filter((broker: any) => {
      if (filters.hasApi && !broker.features?.apiAccess?.available) {
        return false;
      }
      if (filters.hasMobileApp && (!broker.features?.mobile?.ios && !broker.features?.mobile?.android)) {
        return false;
      }
      if (filters.minRating) {
        const avgRating = this.calculateAverageRating(broker.reviews);
        if (avgRating < filters.minRating) return false;
      }
      if (filters.maxBuyFee && broker.fees?.tradingFees?.equity?.buyFee > filters.maxBuyFee) {
        return false;
      }
      if (filters.features?.length) {
        const brokerFeatures = this.getAllFeatures(broker.features);
        if (!filters.features.every(feature => brokerFeatures.includes(feature))) {
          return false;
        }
      }
      if (filters.accountTypes?.length) {
        const brokerAccountTypes = this.getAccountTypes(broker.features);
        if (!filters.accountTypes.every(type => brokerAccountTypes.includes(type))) {
          return false;
        }
      }
      return true;
    }).map(this.transformBroker);
  }

  async getBrokerById(id: string): Promise<Broker | null> {
    const broker = await this.db.broker.findUnique({
      where: { id },
      include: {
        fees: true,
        features: true,
        reviews: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        performanceMetrics: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });

    return broker ? this.transformBroker(broker) : null;
  }

  async compareBrokers(brokerIds: string[]): Promise<BrokerComparison> {
    const brokers = await this.db.broker.findMany({
      where: { id: { in: brokerIds } },
      include: {
        fees: true,
        features: true,
        reviews: true,
        performanceMetrics: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    const transformedBrokers = brokers.map(this.transformBroker);
    const reviewsAggregated = this.aggregateReviews(brokers);
    const performanceMap = brokers.reduce((acc, broker) => {
      if (broker.performanceMetrics.length > 0) {
        acc[broker.id] = this.transformPerformance(broker.performanceMetrics[0]);
      }
      return acc;
    }, {} as any);

    return {
      brokers: transformedBrokers,
      fees: brokers.map((b: any) => b.fees).filter(Boolean).map(this.transformFees),
      features: brokers.map((b: any) => b.features).filter(Boolean).map(this.transformFeatures),
      reviews: reviewsAggregated,
      performance: performanceMap
    };
  }

  async calculateFees(brokerId: string, volume: number): Promise<FeeCalculation> {
    const broker = await this.db.broker.findUnique({
      where: { id: brokerId },
      include: { fees: true }
    });

    if (!broker || !broker.fees) {
      throw new Error('Broker or fee information not found');
    }

    const fees = broker.fees;
    const equityFees = fees.tradingFees as any;
    
    const buyFee = Math.max(
      volume * equityFees.equity.buyFee / 100,
      equityFees.equity.minimumFee
    );
    
    const sellFee = Math.max(
      volume * equityFees.equity.sellFee / 100,
      equityFees.equity.minimumFee
    );

    const totalFee = buyFee + sellFee;
    const effectiveRate = (totalFee / volume) * 100;

    return {
      brokerId,
      brokerName: broker.name,
      buyFee,
      sellFee,
      totalFee,
      effectiveRate,
      volume
    };
  }

  async getReviews(brokerId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.db.brokerReview.findMany({
        where: { brokerId },
        include: {
          user: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.db.brokerReview.count({ where: { brokerId } })
    ]);

    return {
      reviews: reviews.map(this.transformReview),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async submitReview(brokerId: string, userId: string, review: Partial<BrokerReview>): Promise<BrokerReview> {
    const newReview = await this.db.brokerReview.create({
      data: {
        brokerId,
        userId,
        userAccountType: review.userAccountType || 'individual',
        tradingExperience: review.tradingExperience || 'beginner',
        tradingFrequency: review.tradingFrequency || 'rarely',
        overallRating: review.overallRating || 0,
        criteriaRatings: review.criteriaRatings || {},
        pros: review.pros || [],
        cons: review.cons || [],
        detailedReview: review.detailedReview,
        wouldRecommend: review.wouldRecommend || false,
        verifiedAccount: review.verifiedAccount || false
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    return this.transformReview(newReview);
  }

  async getRecommendations(request: BrokerRecommendationRequest): Promise<BrokerRecommendation[]> {
    const brokers = await this.getBrokers();
    
    return brokers
      .map(broker => this.scoreBroker(broker, request))
      .filter(rec => rec.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  async getRealTimeStatus(brokerId: string): Promise<any> {
    const latestPerformance = await this.db.brokerPerformance.findFirst({
      where: { brokerId },
      orderBy: { date: 'desc' }
    });

    if (!latestPerformance) {
      return {
        status: 'unknown',
        uptime: null,
        lastUpdated: null
      };
    }

    const metrics = latestPerformance.systemMetrics as any;
    return {
      status: metrics.uptime > 99 ? 'healthy' : metrics.uptime > 95 ? 'degraded' : 'unhealthy',
      uptime: metrics.uptime,
      averageResponseTime: metrics.averageResponseTime,
      lastUpdated: latestPerformance.date
    };
  }

  private transformBroker(broker: any): Broker {
    return {
      id: broker.id,
      name: broker.name,
      legalName: broker.legalName,
      establishedYear: broker.establishedYear,
      ojkLicenseNumber: broker.ojkLicenseNumber,
      ojkLicenseStatus: broker.ojkLicenseStatus as OjkLicenseStatus,
      website: broker.website,
      logoUrl: broker.logoUrl,
      headquarters: broker.headquarters,
      regulatoryInfo: broker.regulatoryInfo,
      contactInfo: broker.contactInfo,
      createdAt: broker.createdAt.toISOString(),
      updatedAt: broker.updatedAt.toISOString()
    };
  }

  private transformFees(fees: any): BrokerFees {
    return {
      brokerId: fees.brokerId,
      tradingFees: fees.tradingFees,
      accountFees: fees.accountFees,
      otherFees: fees.otherFees,
      promotions: fees.promotions,
      effectiveDate: fees.effectiveDate.toISOString(),
      updatedAt: fees.updatedAt.toISOString()
    };
  }

  private transformFeatures(features: any): BrokerFeatures {
    return {
      brokerId: features.brokerId,
      tradingPlatforms: features.tradingPlatforms,
      researchTools: features.researchTools,
      orderTypes: features.orderTypes,
      accountTypes: features.accountTypes,
      apiAccess: features.apiAccess,
      education: features.education,
      lastUpdated: features.lastUpdated.toISOString()
    };
  }

  private transformReview(review: any): BrokerReview {
    return {
      id: review.id,
      brokerId: review.brokerId,
      userId: review.userId,
      userAccountType: review.userAccountType,
      tradingExperience: review.tradingExperience,
      tradingFrequency: review.tradingFrequency,
      overallRating: review.overallRating,
      criteriaRatings: review.criteriaRatings,
      pros: review.pros,
      cons: review.cons,
      detailedReview: review.detailedReview,
      wouldRecommend: review.wouldRecommend,
      verifiedAccount: review.verifiedAccount,
      helpfulVotes: review.helpfulVotes,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString()
    };
  }

  private transformPerformance(performance: any): BrokerPerformance {
    return {
      id: performance.id,
      brokerId: performance.brokerId,
      date: performance.date.toISOString(),
      systemMetrics: performance.systemMetrics,
      tradingMetrics: performance.tradingMetrics,
      customerServiceMetrics: performance.customerServiceMetrics,
      lastUpdated: performance.lastUpdated.toISOString()
    };
  }

  private calculateAverageRating(reviews: any[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.overallRating, 0);
    return sum / reviews.length;
  }

  private aggregateReviews(brokers: any[]) {
    return brokers.reduce((acc: any, broker: any) => {
      const reviews = broker.reviews || [];
      if (reviews.length > 0) {
        const averageRating = this.calculateAverageRating(reviews);
        const recommendationRate = reviews.filter((r: any) => r.wouldRecommend).length / reviews.length;
        
        acc[broker.id] = {
          averageRating,
          totalReviews: reviews.length,
          recommendationRate
        };
      }
      return acc;
    }, {} as any);
  }

  private getAllFeatures(features: any): string[] {
    const allFeatures: string[] = [];
    
    if (features.tradingPlatforms?.web?.features) {
      allFeatures.push(...features.tradingPlatforms.web.features);
    }
    if (features.tradingPlatforms?.desktop?.features) {
      allFeatures.push(...features.tradingPlatforms.desktop.features);
    }
    if (features.tradingPlatforms?.mobile?.features) {
      allFeatures.push(...features.tradingPlatforms.mobile.features);
    }
    
    Object.entries(features.researchTools || {}).forEach(([tool, available]) => {
      if (available) allFeatures.push(tool);
    });
    
    Object.entries(features.orderTypes || {}).forEach(([orderType, available]) => {
      if (available) allFeatures.push(orderType);
    });
    
    return allFeatures;
  }

  private getAccountTypes(features: any): string[] {
    const accountTypes = features.accountTypes || {};
    return Object.entries(accountTypes)
      .filter(([_, available]) => available)
      .map(([type]) => type);
  }

  private scoreBroker(broker: any, request: BrokerRecommendationRequest): BrokerRecommendation {
    let score = 50; // Base score
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const reasoning: string[] = [];

    // Fee scoring
    if (broker.fees) {
      const buyFee = (broker.fees as any).tradingFees.equity.buyFee;
      if (buyFee <= 0.15) {
        score += 20;
        strengths.push('Low trading fees');
      } else if (buyFee > 0.25) {
        score -= 10;
        weaknesses.push('High trading fees');
      }
    }

    // Feature scoring
    if (broker.features) {
      if ((broker.features as any).apiAccess.available && request.preferredFeatures.includes('api')) {
        score += 15;
        strengths.push('API access available');
      }
      
      if ((broker.features as any).mobile.ios || (broker.features as any).mobile.android) {
        score += 10;
        strengths.push('Mobile trading available');
      }
      
      if (request.preferredFeatures.includes('research') && (broker.features as any).researchTools.technicalAnalysis) {
        score += 10;
        strengths.push('Advanced research tools');
      }
    }

    // Experience level matching
    if (request.experienceLevel === 'beginner' && (broker.features as any).education.demoAccount) {
      score += 15;
      strengths.push('Demo account for beginners');
    } else if (request.experienceLevel === 'advanced' && (broker.features as any).apiAccess.available) {
      score += 10;
      strengths.push('Advanced trading features');
    }

    // Account type matching
    if ((broker.features as any).accountTypes[request.accountType]) {
      score += 10;
    } else {
      score -= 20;
      weaknesses.push(`Does not support ${request.accountType} accounts`);
    }

    // OJK compliance
    if (broker.ojkLicenseStatus === 'ACTIVE') {
      score += 20;
      strengths.push('Fully regulated by OJK');
    } else {
      score -= 30;
      weaknesses.push('Regulatory issues');
    }

    const bestFor = [];
    if (score >= 80) bestFor.push('Most traders');
    if ((broker.fees as any)?.tradingFees.equity.buyFee <= 0.15) bestFor.push('Cost-conscious investors');
    if ((broker.features as any)?.apiAccess.available) bestFor.push('Algorithmic traders');
    if ((broker.features as any)?.education.webinars) bestFor.push('Learning investors');

    return {
      broker,
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      strengths,
      weaknesses,
      bestFor
    };
  }
}
