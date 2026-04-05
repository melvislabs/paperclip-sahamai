import type { Broker, BrokerFees, BrokerFeatures, BrokerPerformance } from './types';

export interface BrokerDataIngestionConfig {
  ojkApiUrl?: string;
  scrapingInterval?: number; // hours
  enableWebScraping?: boolean;
  enableOjkVerification?: boolean;
}

export class BrokerDataIngestionService {
  private config: BrokerDataIngestionConfig;
  private db: any; // Database client interface

  constructor(config: BrokerDataIngestionConfig = {}, databaseClient: any) {
    this.config = {
      ojkApiUrl: 'https://api.ojk.go.id',
      scrapingInterval: 24,
      enableWebScraping: true,
      enableOjkVerification: true,
      ...config
    };
    this.db = databaseClient;
  }

  /**
   * Main ingestion pipeline - orchestrates all data collection
   */
  async runFullIngestion(): Promise<void> {
    console.log('Starting broker data ingestion...');
    
    try {
      // Step 1: Verify OJK licenses
      if (this.config.enableOjkVerification) {
        await this.verifyOjkLicenses();
      }

      // Step 2: Scrape broker websites for data
      if (this.config.enableWebScraping) {
        await this.scrapeBrokerWebsites();
      }

      // Step 3: Collect performance metrics
      await this.collectPerformanceMetrics();

      // Step 4: Validate data quality
      await this.validateDataQuality();

      console.log('Broker data ingestion completed successfully');
    } catch (error) {
      console.error('Broker data ingestion failed:', error);
      throw error;
    }
  }

  /**
   * Verify OJK license status for all brokers
   */
  async verifyOjkLicenses(): Promise<void> {
    console.log('Verifying OJK licenses...');
    
    try {
      // Get all brokers from database
      const brokers = await this.db.broker.findMany();
      
      for (const broker of brokers) {
        try {
          const licenseStatus = await this.checkOjkLicenseStatus(broker.ojkLicenseNumber);
          
          if (licenseStatus !== broker.ojkLicenseStatus) {
            // Update broker license status
            await this.db.broker.update({
              where: { id: broker.id },
              data: { 
                ojkLicenseStatus: licenseStatus,
                updatedAt: new Date()
              }
            });
            
            console.log(`Updated ${broker.name} license status to ${licenseStatus}`);
          }
        } catch (error) {
          console.error(`Failed to verify license for ${broker.name}:`, error);
        }
      }
    } catch (error) {
      console.error('OJK license verification failed:', error);
      throw error;
    }
  }

  /**
   * Check OJK license status from OJK API
   */
  private async checkOjkLicenseStatus(licenseNumber: string): Promise<string> {
    try {
      // In a real implementation, this would call the OJK API
      // For now, we'll simulate the API call
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mock response - in reality this would be from OJK API
      const mockStatuses = ['ACTIVE', 'SUSPENDED', 'REVOKED'];
      const weights = [0.85, 0.10, 0.05]; // Most brokers are active
      
      const random = Math.random();
      let cumulative = 0;
      
      for (let i = 0; i < mockStatuses.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) {
          return mockStatuses[i];
        }
      }
      
      return 'ACTIVE';
    } catch (error) {
      console.error(`Failed to check OJK license ${licenseNumber}:`, error);
      throw error;
    }
  }

  /**
   * Scrape broker websites for updated information
   */
  async scrapeBrokerWebsites(): Promise<void> {
    console.log('Scraping broker websites...');
    
    try {
      const brokers = await this.db.broker.findMany({
        where: { ojkLicenseStatus: 'ACTIVE' }
      });

      for (const broker of brokers) {
        try {
          // Scrape basic broker info
          await this.scrapeBrokerBasicInfo(broker);
          
          // Scrape fee information
          await this.scrapeBrokerFees(broker);
          
          // Scrape features
          await this.scrapeBrokerFeatures(broker);
          
          // Add delay to be respectful to broker websites
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Failed to scrape ${broker.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Broker website scraping failed:', error);
      throw error;
    }
  }

  /**
   * Scrape basic broker information
   */
  private async scrapeBrokerBasicInfo(broker: any): Promise<void> {
    // In a real implementation, this would use a web scraping library
    // like Puppeteer, Playwright, or Cheerio
    
    // Mock scraping logic
    const mockUpdates = {
      logoUrl: broker.logoUrl || `https://example.com/logos/${broker.id}.png`,
      contactInfo: {
        customerService: {
          phone: broker.contactInfo?.customerService?.phone || '+62-21-1234567',
          email: broker.contactInfo?.customerService?.email || `support@${broker.name.toLowerCase().replace(/\s+/g, '')}.co.id`,
          liveChat: broker.contactInfo?.customerService?.liveChat ?? true,
          workingHours: broker.contactInfo?.customerService?.workingHours || 'Mon-Fri 08:00-17:00'
        },
        complaints: {
          email: broker.contactInfo?.complaints?.email || `complaints@${broker.name.toLowerCase().replace(/\s+/g, '')}.co.id`,
          hotline: broker.contactInfo?.complaints?.hotline || '+62-800-1234567',
          responseTimeSla: broker.contactInfo?.complaints?.responseTimeSla || '24 hours'
        }
      }
    };

    await this.db.broker.update({
      where: { id: broker.id },
      data: {
        ...mockUpdates,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Scrape broker fee information
   */
  private async scrapeBrokerFees(broker: any): Promise<void> {
    // Mock fee data - in reality this would be scraped from broker websites
    const mockFees = {
      brokerId: broker.id,
      tradingFees: {
        equity: {
          buyFee: 0.15 + Math.random() * 0.15, // 0.15% - 0.30%
          sellFee: 0.25 + Math.random() * 0.15, // 0.25% - 0.40%
          minimumFee: 5000,
          maximumFee: 25000
        },
        mutualFund: {
          subscriptionFee: 0.0,
          redemptionFee: 0.01,
          switchingFee: 0.005
        },
        bonds: {
          buyFee: 0.1,
          sellFee: 0.1
        }
      },
      accountFees: {
        accountMaintenance: 0,
        inactivityFee: 50000,
        withdrawalFee: 5000,
        transferFee: 2500
      },
      otherFees: {
        realTimeData: true,
        researchReports: false,
        platformUsage: 0
      },
      promotions: [
        {
          description: 'Free trading for first month',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          conditions: 'New accounts only, minimum deposit IDR 10M'
        }
      ],
      effectiveDate: new Date().toISOString()
    };

    // Update or insert fees
    await this.db.brokerFees.upsert({
      where: { brokerId: broker.id },
      update: mockFees,
      create: mockFees
    });
  }

  /**
   * Scrape broker features
   */
  private async scrapeBrokerFeatures(broker: any): Promise<void> {
    // Mock feature data - in reality this would be scraped from broker websites
    const mockFeatures = {
      brokerId: broker.id,
      tradingPlatforms: {
        web: {
          available: true,
          features: ['Real-time quotes', 'Charting', 'Order management', 'Portfolio tracking'],
          chartingTools: 50,
          technicalIndicators: 30
        },
        desktop: {
          available: Math.random() > 0.3,
          supportedOS: ['Windows', 'macOS'],
          features: ['Advanced charting', 'Algorithmic trading', 'Backtesting']
        },
        mobile: {
          ios: Math.random() > 0.2,
          android: Math.random() > 0.1,
          features: ['Mobile trading', 'Price alerts', 'Biometric login'],
          biometricLogin: Math.random() > 0.5
        }
      },
      researchTools: {
        dailyReports: true,
        technicalAnalysis: Math.random() > 0.2,
        fundamentalAnalysis: Math.random() > 0.3,
        marketNews: true,
        economicCalendar: Math.random() > 0.4,
        stockScreener: Math.random() > 0.3
      },
      orderTypes: {
        market: true,
        limit: true,
        stop: Math.random() > 0.2,
        stopLimit: Math.random() > 0.3,
        conditional: Math.random() > 0.6,
        algorithmic: Math.random() > 0.7
      },
      accountTypes: {
        individual: true,
        joint: Math.random() > 0.5,
        corporate: Math.random() > 0.3,
        foreign: Math.random() > 0.4,
        syariah: Math.random() > 0.6
      },
      apiAccess: {
        available: Math.random() > 0.5,
        restApi: Math.random() > 0.6,
        websocket: Math.random() > 0.7,
        rateLimit: '1000 requests/hour',
        documentation: Math.random() > 0.4
      },
      education: {
        webinars: Math.random() > 0.4,
        tutorials: Math.random() > 0.3,
        courses: Math.random() > 0.6,
        demoAccount: Math.random() > 0.2
      }
    };

    // Update or insert features
    await this.db.brokerFeatures.upsert({
      where: { brokerId: broker.id },
      update: mockFeatures,
      create: mockFeatures
    });
  }

  /**
   * Collect performance metrics for brokers
   */
  async collectPerformanceMetrics(): Promise<void> {
    console.log('Collecting broker performance metrics...');
    
    try {
      const brokers = await this.db.broker.findMany({
        where: { ojkLicenseStatus: 'ACTIVE' }
      });

      for (const broker of brokers) {
        try {
          const metrics = await this.generateMockPerformanceMetrics(broker.id);
          
          await this.db.brokerPerformance.create({
            data: {
              brokerId: broker.id,
              date: new Date(),
              ...metrics
            }
          });
          
        } catch (error) {
          console.error(`Failed to collect metrics for ${broker.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Performance metrics collection failed:', error);
      throw error;
    }
  }

  /**
   * Generate mock performance metrics
   */
  private async generateMockPerformanceMetrics(brokerId: string): Promise<any> {
    // In a real implementation, this would collect actual metrics
    // from monitoring systems, broker APIs, etc.
    
    return {
      systemMetrics: {
        uptime: 99.5 + Math.random() * 0.4, // 99.5% - 99.9%
        averageResponseTime: 200 + Math.random() * 300, // 200-500ms
        downtimeIncidents: Math.random() > 0.8 ? 1 : 0,
        maintenanceWindows: Math.random() > 0.9 ? 1 : 0
      },
      tradingMetrics: {
        averageExecutionTime: 50 + Math.random() * 100, // 50-150ms
        orderSuccessRate: 99.0 + Math.random(), // 99% - 100%
        marketShare: 1 + Math.random() * 15, // 1% - 16%
        activeAccounts: 10000 + Math.floor(Math.random() * 100000), // 10K - 110K
        newAccounts: Math.floor(Math.random() * 1000) // 0 - 1000
      },
      customerServiceMetrics: {
        averageResponseTime: 5 + Math.random() * 55, // 5-60 minutes
        satisfactionScore: 3.5 + Math.random() * 1.5, // 3.5 - 5.0
        complaintsResolved: Math.floor(Math.random() * 100),
        complaintsPending: Math.floor(Math.random() * 10)
      }
    };
  }

  /**
   * Validate data quality and consistency
   */
  async validateDataQuality(): Promise<void> {
    console.log('Validating data quality...');
    
    try {
      const validationResults = {
        brokersWithoutFees: 0,
        brokersWithoutFeatures: 0,
        invalidLicenseNumbers: 0,
        missingRequiredFields: 0,
        totalBrokers: 0
      };

      const brokers = await this.db.broker.findMany();
      validationResults.totalBrokers = brokers.length;

      for (const broker of brokers) {
        // Check for missing fees
        const fees = await this.db.brokerFees.findUnique({
          where: { brokerId: broker.id }
        });
        if (!fees) validationResults.brokersWithoutFees++;

        // Check for missing features
        const features = await this.db.brokerFeatures.findUnique({
          where: { brokerId: broker.id }
        });
        if (!features) validationResults.brokersWithoutFeatures++;

        // Validate license number format
        if (!/^[A-Z]{2}\/\d{4}\/[A-Z]{3}\/\d{8}\/[A-Z]{3}$/.test(broker.ojkLicenseNumber)) {
          validationResults.invalidLicenseNumbers++;
        }

        // Check required fields
        const requiredFields = ['name', 'legalName', 'website', 'ojkLicenseNumber'];
        for (const field of requiredFields) {
          if (!broker[field]) {
            validationResults.missingRequiredFields++;
            break;
          }
        }
      }

      console.log('Data validation results:', validationResults);

      // Log warnings for data quality issues
      if (validationResults.brokersWithoutFees > 0) {
        console.warn(`${validationResults.brokersWithoutFees} brokers missing fee data`);
      }
      if (validationResults.brokersWithoutFeatures > 0) {
        console.warn(`${validationResults.brokersWithoutFeatures} brokers missing feature data`);
      }
      if (validationResults.invalidLicenseNumbers > 0) {
        console.warn(`${validationResults.invalidLicenseNumbers} brokers have invalid license numbers`);
      }

    } catch (error) {
      console.error('Data quality validation failed:', error);
      throw error;
    }
  }

  /**
   * Start scheduled ingestion
   */
  startScheduledIngestion(): void {
    const intervalMs = (this.config.scrapingInterval || 24) * 60 * 60 * 1000;
    
    console.log(`Starting scheduled broker ingestion every ${this.config.scrapingInterval} hours`);
    
    // Run immediately on start
    this.runFullIngestion().catch(error => {
      console.error('Initial ingestion failed:', error);
    });

    // Schedule recurring ingestion
    setInterval(() => {
      console.log('Running scheduled broker ingestion...');
      this.runFullIngestion().catch(error => {
        console.error('Scheduled ingestion failed:', error);
      });
    }, intervalMs);
  }

  /**
   * Add a new broker to the system
   */
  async addBroker(brokerData: Partial<Broker>): Promise<Broker> {
    try {
      // Validate required fields
      const requiredFields: (keyof Partial<Broker>)[] = ['name', 'legalName', 'ojkLicenseNumber', 'website'];
      for (const field of requiredFields) {
        if (!brokerData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Check if broker already exists
      const existing = await this.db.broker.findFirst({
        where: {
          OR: [
            { name: brokerData.name },
            { ojkLicenseNumber: brokerData.ojkLicenseNumber }
          ]
        }
      });

      if (existing) {
        throw new Error('Broker already exists with same name or license number');
      }

      // Verify OJK license
      const licenseStatus = await this.checkOjkLicenseStatus(brokerData.ojkLicenseNumber!);

      // Create broker with default values
      const newBroker = await this.db.broker.create({
        data: {
          ...brokerData,
          ojkLicenseStatus: licenseStatus,
          establishedYear: brokerData.establishedYear || new Date().getFullYear(),
          headquarters: brokerData.headquarters || {
            address: 'TBD',
            city: 'Jakarta',
            phone: '+62-21-0000000',
            email: 'info@example.com'
          },
          regulatoryInfo: brokerData.regulatoryInfo || {
            ojkRegistrationDate: new Date().toISOString().split('T')[0],
            lastComplianceCheck: new Date().toISOString().split('T')[0],
            customerFundProtection: true
          },
          contactInfo: brokerData.contactInfo || {
            customerService: {
              phone: '+62-21-0000000',
              email: 'support@example.com',
              liveChat: false,
              workingHours: 'Mon-Fri 08:00-17:00'
            },
            complaints: {
              email: 'complaints@example.com',
              hotline: '+62-800-0000000',
              responseTimeSla: '24 hours'
            }
          }
        }
      });

      console.log(`Added new broker: ${newBroker.name}`);
      return newBroker;

    } catch (error) {
      console.error('Failed to add broker:', error);
      throw error;
    }
  }

  /**
   * Get ingestion statistics
   */
  async getIngestionStats(): Promise<any> {
    try {
      const stats = {
        totalBrokers: 0,
        activeBrokers: 0,
        brokersWithFees: 0,
        brokersWithFeatures: 0,
        lastIngestion: null,
        nextScheduledIngestion: null
      };

      stats.totalBrokers = await this.db.broker.count();
      stats.activeBrokers = await this.db.broker.count({
        where: { ojkLicenseStatus: 'ACTIVE' }
      });
      stats.brokersWithFees = await this.db.brokerFees.count();
      stats.brokersWithFeatures = await this.db.brokerFeatures.count();

      return stats;
    } catch (error) {
      console.error('Failed to get ingestion stats:', error);
      throw error;
    }
  }
}
