export type SignalAction = 'buy' | 'sell' | 'hold';

export interface LatestSignal {
  symbol: string;
  action: SignalAction;
  confidence: number;
  generatedAt: string;
  expiresAt: string;
  version: string;
  reasonCodes: string[];
}

export interface SignalWithFreshness {
  signal: LatestSignal;
  stale: boolean;
}

// Broker Types
export type OjkLicenseStatus = 'ACTIVE' | 'SUSPENDED' | 'REVOKED';

export interface Broker {
  id: string;
  name: string;
  legalName: string;
  establishedYear: number;
  ojkLicenseNumber: string;
  ojkLicenseStatus: OjkLicenseStatus;
  website: string;
  logoUrl?: string;
  headquarters: {
    address: string;
    city: string;
    phone: string;
    email: string;
  };
  regulatoryInfo: {
    ojkRegistrationDate: string;
    lastComplianceCheck: string;
    capitalAdequacyRatio?: number;
    customerFundProtection: boolean;
  };
  contactInfo: {
    customerService: {
      phone: string;
      email: string;
      liveChat: boolean;
      workingHours: string;
    };
    complaints: {
      email: string;
      hotline: string;
      responseTimeSla: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface BrokerFees {
  brokerId: string;
  tradingFees: {
    equity: {
      buyFee: number;
      sellFee: number;
      minimumFee: number;
      maximumFee?: number;
    };
    mutualFund: {
      subscriptionFee: number;
      redemptionFee: number;
      switchingFee: number;
    };
    bonds: {
      buyFee: number;
      sellFee: number;
    };
  };
  accountFees: {
    accountMaintenance: number;
    inactivityFee: number;
    withdrawalFee: number;
    transferFee: number;
  };
  otherFees: {
    realTimeData: boolean;
    researchReports: boolean;
    platformUsage: number;
  };
  promotions: {
    description: string;
    validUntil: string;
    conditions: string;
  }[];
  effectiveDate: string;
  updatedAt: string;
}

export interface BrokerFeatures {
  brokerId: string;
  tradingPlatforms: {
    web: {
      available: boolean;
      features: string[];
      chartingTools: number;
      technicalIndicators: number;
    };
    desktop: {
      available: boolean;
      supportedOS: string[];
      features: string[];
    };
    mobile: {
      ios: boolean;
      android: boolean;
      features: string[];
      biometricLogin: boolean;
    };
  };
  researchTools: {
    dailyReports: boolean;
    technicalAnalysis: boolean;
    fundamentalAnalysis: boolean;
    marketNews: boolean;
    economicCalendar: boolean;
    stockScreener: boolean;
  };
  orderTypes: {
    market: boolean;
    limit: boolean;
    stop: boolean;
    stopLimit: boolean;
    conditional: boolean;
    algorithmic: boolean;
  };
  accountTypes: {
    individual: boolean;
    joint: boolean;
    corporate: boolean;
    foreign: boolean;
    syariah: boolean;
  };
  apiAccess: {
    available: boolean;
    restApi: boolean;
    websocket: boolean;
    rateLimit: string;
    documentation: boolean;
  };
  education: {
    webinars: boolean;
    tutorials: boolean;
    courses: boolean;
    demoAccount: boolean;
  };
  lastUpdated: string;
}

export interface BrokerReview {
  id: string;
  brokerId: string;
  userId: string;
  userAccountType: 'individual' | 'corporate' | 'foreign';
  tradingExperience: 'beginner' | 'intermediate' | 'advanced';
  tradingFrequency: 'rarely' | 'monthly' | 'weekly' | 'daily';
  overallRating: number;
  criteriaRatings: {
    fees: number;
    platform: number;
    customerService: number;
    research: number;
    reliability: number;
  };
  pros: string[];
  cons: string[];
  detailedReview: string;
  wouldRecommend: boolean;
  verifiedAccount: boolean;
  helpfulVotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrokerPerformance {
  id: string;
  brokerId: string;
  date: string;
  systemMetrics: {
    uptime: number;
    averageResponseTime: number;
    downtimeIncidents: number;
    maintenanceWindows: number;
  };
  tradingMetrics: {
    averageExecutionTime: number;
    orderSuccessRate: number;
    marketShare: number;
    activeAccounts: number;
    newAccounts: number;
  };
  customerServiceMetrics: {
    averageResponseTime: number;
    satisfactionScore: number;
    complaintsResolved: number;
    complaintsPending: number;
  };
  lastUpdated: string;
}

export interface BrokerComparison {
  brokers: Broker[];
  fees: BrokerFees[];
  features: BrokerFeatures[];
  reviews: {
    [brokerId: string]: {
      averageRating: number;
      totalReviews: number;
      recommendationRate: number;
    };
  };
  performance: {
    [brokerId: string]: BrokerPerformance;
  };
}

export interface BrokerFilters {
  search?: string;
  ojkStatus?: OjkLicenseStatus;
  hasApi?: boolean;
  hasMobileApp?: boolean;
  minRating?: number;
  maxBuyFee?: number;
  features?: string[];
  accountTypes?: string[];
}

export interface FeeCalculation {
  brokerId: string;
  brokerName: string;
  buyFee: number;
  sellFee: number;
  totalFee: number;
  effectiveRate: number;
  volume: number;
}

export interface BrokerRecommendationRequest {
  tradingVolume: number;
  tradingFrequency: 'rarely' | 'monthly' | 'weekly' | 'daily';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  accountType: 'individual' | 'corporate' | 'foreign';
  preferredFeatures: string[];
  maxFeeRate?: number;
}

export interface BrokerRecommendation {
  broker: Broker;
  score: number;
  reasoning: string[];
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
}
