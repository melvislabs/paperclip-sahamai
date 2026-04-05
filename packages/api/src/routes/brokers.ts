import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../auth/middleware.js';
import { getPrismaClient } from '../db/index.js';
import { BrokerService, type DatabaseClient } from '@sahamai/shared';
import {
  Type,
  type Static
} from '@sinclair/typebox';

// Schema definitions
const BrokerFiltersSchema = Type.Object({
  search: Type.Optional(Type.String()),
  ojkStatus: Type.Optional(Type.Union([
    Type.Literal('ACTIVE'),
    Type.Literal('SUSPENDED'),
    Type.Literal('REVOKED')
  ])),
  hasApi: Type.Optional(Type.Boolean()),
  hasMobileApp: Type.Optional(Type.Boolean()),
  minRating: Type.Optional(Type.Number({ minimum: 1, maximum: 5 })),
  maxBuyFee: Type.Optional(Type.Number({ minimum: 0 })),
  features: Type.Optional(Type.Array(Type.String())),
  accountTypes: Type.Optional(Type.Array(Type.String()))
});

const BrokerComparisonRequestSchema = Type.Object({
  brokerIds: Type.Array(Type.String(), { minItems: 2, maxItems: 5 })
});

const FeeCalculatorRequestSchema = Type.Object({
  brokerId: Type.String(),
  volume: Type.Number({ minimum: 1000000 }) // Minimum 1M IDR
});

const ReviewSubmissionSchema = Type.Object({
  userAccountType: Type.Union([
    Type.Literal('individual'),
    Type.Literal('corporate'),
    Type.Literal('foreign')
  ]),
  tradingExperience: Type.Union([
    Type.Literal('beginner'),
    Type.Literal('intermediate'),
    Type.Literal('advanced')
  ]),
  tradingFrequency: Type.Union([
    Type.Literal('rarely'),
    Type.Literal('monthly'),
    Type.Literal('weekly'),
    Type.Literal('daily')
  ]),
  overallRating: Type.Number({ minimum: 1, maximum: 5 }),
  criteriaRatings: Type.Object({
    fees: Type.Number({ minimum: 1, maximum: 5 }),
    platform: Type.Number({ minimum: 1, maximum: 5 }),
    customerService: Type.Number({ minimum: 1, maximum: 5 }),
    research: Type.Number({ minimum: 1, maximum: 5 }),
    reliability: Type.Number({ minimum: 1, maximum: 5 })
  }),
  pros: Type.Array(Type.String()),
  cons: Type.Array(Type.String()),
  detailedReview: Type.Optional(Type.String()),
  wouldRecommend: Type.Boolean()
});

const BrokerRecommendationRequestSchema = Type.Object({
  tradingVolume: Type.Number({ minimum: 1000000 }),
  tradingFrequency: Type.Union([
    Type.Literal('rarely'),
    Type.Literal('monthly'),
    Type.Literal('weekly'),
    Type.Literal('daily')
  ]),
  experienceLevel: Type.Union([
    Type.Literal('beginner'),
    Type.Literal('intermediate'),
    Type.Literal('advanced')
  ]),
  accountType: Type.Union([
    Type.Literal('individual'),
    Type.Literal('corporate'),
    Type.Literal('foreign')
  ]),
  preferredFeatures: Type.Array(Type.String()),
  maxFeeRate: Type.Optional(Type.Number({ minimum: 0, maximum: 1 }))
});

type BrokerFilters = Static<typeof BrokerFiltersSchema>;
type BrokerComparisonRequest = Static<typeof BrokerComparisonRequestSchema>;
type FeeCalculatorRequest = Static<typeof FeeCalculatorRequestSchema>;
type ReviewSubmission = Static<typeof ReviewSubmissionSchema>;
type BrokerRecommendationRequest = Static<typeof BrokerRecommendationRequestSchema>;

export function registerBrokerRoutes(app: FastifyInstance) {
  // Create database client adapter for BrokerService
  const createDatabaseClient = (): DatabaseClient => {
    const prisma = getPrismaClient();
    return {
      broker: prisma.broker,
      brokerReview: prisma.brokerReview,
      brokerPerformance: prisma.brokerPerformance
    };
  };

  const brokerService = new BrokerService(createDatabaseClient());

  // GET /v1/brokers - List all brokers with optional filtering
  app.get('/v1/brokers', {
    schema: {
      tags: ['Brokers'],
      description: 'List all brokers with optional filtering',
      querystring: BrokerFiltersSchema,
      response: {
        200: Type.Array(Type.Object({
          id: Type.String(),
          name: Type.String(),
          legalName: Type.String(),
          establishedYear: Type.Number(),
          ojkLicenseNumber: Type.String(),
          ojkLicenseStatus: Type.Union([
            Type.Literal('ACTIVE'),
            Type.Literal('SUSPENDED'),
            Type.Literal('REVOKED')
          ]),
          website: Type.String(),
          logoUrl: Type.Optional(Type.String()),
          headquarters: Type.Object({
            address: Type.String(),
            city: Type.String(),
            phone: Type.String(),
            email: Type.String()
          }),
          regulatoryInfo: Type.Object({
            ojkRegistrationDate: Type.String(),
            lastComplianceCheck: Type.String(),
            capitalAdequacyRatio: Type.Optional(Type.Number()),
            customerFundProtection: Type.Boolean()
          }),
          contactInfo: Type.Object({
            customerService: Type.Object({
              phone: Type.String(),
              email: Type.String(),
              liveChat: Type.Boolean(),
              workingHours: Type.String()
            }),
            complaints: Type.Object({
              email: Type.String(),
              hotline: Type.String(),
              responseTimeSla: Type.String()
            })
          }),
          createdAt: Type.String(),
          updatedAt: Type.String()
        })),
        400: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() })
      }
    }
  }, async (request, reply) => {
    try {
      const filters = request.query as BrokerFilters;
      const brokers = await brokerService.getBrokers(filters);
      return brokers;
    } catch (error) {
      app.log.error(error, 'Error fetching brokers');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch brokers'
      });
    }
  });

  // GET /v1/brokers/:id - Get detailed broker information
  app.get('/v1/brokers/:id', {
    schema: {
      tags: ['Brokers'],
      description: 'Get detailed broker information',
      params: Type.Object({
        id: Type.String()
      }),
      response: {
        200: Type.Object({
          id: Type.String(),
          name: Type.String(),
          legalName: Type.String(),
          establishedYear: Type.Number(),
          ojkLicenseNumber: Type.String(),
          ojkLicenseStatus: Type.Union([
            Type.Literal('ACTIVE'),
            Type.Literal('SUSPENDED'),
            Type.Literal('REVOKED')
          ]),
          website: Type.String(),
          logoUrl: Type.Optional(Type.String()),
          headquarters: Type.Object({
            address: Type.String(),
            city: Type.String(),
            phone: Type.String(),
            email: Type.String()
          }),
          regulatoryInfo: Type.Object({
            ojkRegistrationDate: Type.String(),
            lastComplianceCheck: Type.String(),
            capitalAdequacyRatio: Type.Optional(Type.Number()),
            customerFundProtection: Type.Boolean()
          }),
          contactInfo: Type.Object({
            customerService: Type.Object({
              phone: Type.String(),
              email: Type.String(),
              liveChat: Type.Boolean(),
              workingHours: Type.String()
            }),
            complaints: Type.Object({
              email: Type.String(),
              hotline: Type.String(),
              responseTimeSla: Type.String()
            })
          }),
          createdAt: Type.String(),
          updatedAt: Type.String()
        }),
        404: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const broker = await brokerService.getBrokerById(id);
      
      if (!broker) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Broker not found'
        });
      }
      
      return broker;
    } catch (error) {
      app.log.error(error, 'Error fetching broker details');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch broker details'
      });
    }
  });

  // GET /v1/brokers/search - Search brokers by name
  app.get('/v1/brokers/search', {
    schema: {
      tags: ['Brokers'],
      description: 'Search brokers by name',
      querystring: Type.Object({
        q: Type.String({ minLength: 2 })
      }),
      response: {
        200: Type.Array(Type.Object({
          id: Type.String(),
          name: Type.String(),
          legalName: Type.String(),
          ojkLicenseStatus: Type.Union([
            Type.Literal('ACTIVE'),
            Type.Literal('SUSPENDED'),
            Type.Literal('REVOKED')
          ]),
          website: Type.String()
        })),
        400: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() })
      }
    }
  }, async (request, reply) => {
    try {
      const { q } = request.query as { q: string };
      const brokers = await brokerService.getBrokers({ search: q });
      
      // Return simplified search results
      return brokers.map(broker => ({
        id: broker.id,
        name: broker.name,
        legalName: broker.legalName,
        ojkLicenseStatus: broker.ojkLicenseStatus,
        website: broker.website
      }));
    } catch (error) {
      app.log.error(error, 'Error searching brokers');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to search brokers'
      });
    }
  });

  // POST /v1/brokers/compare - Compare multiple brokers
  app.post('/v1/brokers/compare', {
    schema: {
      tags: ['Brokers'],
      description: 'Compare multiple brokers',
      body: BrokerComparisonRequestSchema,
      response: {
        200: Type.Object({
          brokers: Type.Array(Type.Object({
            id: Type.String(),
            name: Type.String(),
            legalName: Type.String(),
            ojkLicenseStatus: Type.Union([
              Type.Literal('ACTIVE'),
              Type.Literal('SUSPENDED'),
              Type.Literal('REVOKED')
            ])
          })),
          fees: Type.Array(Type.Object({
            brokerId: Type.String(),
            tradingFees: Type.Object({
              equity: Type.Object({
                buyFee: Type.Number(),
                sellFee: Type.Number(),
                minimumFee: Type.Number(),
                maximumFee: Type.Optional(Type.Number())
              })
            })
          })),
          features: Type.Array(Type.Object({
            brokerId: Type.String(),
            tradingPlatforms: Type.Object({
              web: Type.Object({ available: Type.Boolean() }),
              mobile: Type.Object({ ios: Type.Boolean(), android: Type.Boolean() })
            }),
            apiAccess: Type.Object({ available: Type.Boolean() })
          })),
          reviews: Type.Record(Type.String(), Type.Object({
            averageRating: Type.Number(),
            totalReviews: Type.Number(),
            recommendationRate: Type.Number()
          }))
        }),
        400: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() })
      }
    }
  }, async (request, reply) => {
    try {
      const { brokerIds } = request.body as BrokerComparisonRequest;
      
      if (brokerIds.length < 2) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'At least 2 brokers are required for comparison'
        });
      }
      
      const comparison = await brokerService.compareBrokers(brokerIds);
      return comparison;
    } catch (error) {
      app.log.error(error, 'Error comparing brokers');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to compare brokers'
      });
    }
  });

  // POST /v1/brokers/fees/calculator - Calculate trading fees
  app.post('/v1/brokers/fees/calculator', {
    schema: {
      tags: ['Brokers'],
      description: 'Calculate trading fees for a specific broker and volume',
      body: FeeCalculatorRequestSchema,
      response: {
        200: Type.Object({
          brokerId: Type.String(),
          brokerName: Type.String(),
          buyFee: Type.Number(),
          sellFee: Type.Number(),
          totalFee: Type.Number(),
          effectiveRate: Type.Number(),
          volume: Type.Number()
        }),
        400: Type.Object({ error: Type.String(), message: Type.String() }),
        404: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() })
      }
    }
  }, async (request, reply) => {
    try {
      const { brokerId, volume } = request.body as FeeCalculatorRequest;
      const calculation = await brokerService.calculateFees(brokerId, volume);
      return calculation;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.code(404).send({
          error: 'Not Found',
          message: error.message
        });
      }
      
      app.log.error(error, 'Error calculating fees');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to calculate fees'
      });
    }
  });

  // GET /v1/brokers/:id/reviews - Get broker reviews
  app.get('/v1/brokers/:id/reviews', {
    schema: {
      tags: ['Brokers'],
      description: 'Get broker reviews with pagination',
      params: Type.Object({
        id: Type.String()
      }),
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 10 }))
      }),
      response: {
        200: Type.Object({
          reviews: Type.Array(Type.Object({
            id: Type.String(),
            userId: Type.String(),
            userAccountType: Type.Union([
              Type.Literal('individual'),
              Type.Literal('corporate'),
              Type.Literal('foreign')
            ]),
            tradingExperience: Type.Union([
              Type.Literal('beginner'),
              Type.Literal('intermediate'),
              Type.Literal('advanced')
            ]),
            overallRating: Type.Number(),
            criteriaRatings: Type.Object({
              fees: Type.Number(),
              platform: Type.Number(),
              customerService: Type.Number(),
              research: Type.Number(),
              reliability: Type.Number()
            }),
            pros: Type.Array(Type.String()),
            cons: Type.Array(Type.String()),
            detailedReview: Type.Optional(Type.String()),
            wouldRecommend: Type.Boolean(),
            verifiedAccount: Type.Boolean(),
            helpfulVotes: Type.Number(),
            createdAt: Type.String()
          })),
          pagination: Type.Object({
            page: Type.Number(),
            limit: Type.Number(),
            total: Type.Number(),
            totalPages: Type.Number()
          })
        }),
        404: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { page = 1, limit = 10 } = request.query as { page?: number, limit?: number };
      
      const reviews = await brokerService.getReviews(id, page, limit);
      return reviews;
    } catch (error) {
      app.log.error(error, 'Error fetching broker reviews');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch broker reviews'
      });
    }
  });

  // POST /v1/brokers/:id/reviews - Submit a broker review (requires authentication)
  app.post('/v1/brokers/:id/reviews', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Brokers'],
      description: 'Submit a broker review',
      params: Type.Object({
        id: Type.String()
      }),
      body: ReviewSubmissionSchema,
      security: [{ bearerAuth: [] }, { apiKey: [] }],
      response: {
        201: Type.Object({
          id: Type.String(),
          brokerId: Type.String(),
          userId: Type.String(),
          overallRating: Type.Number(),
          createdAt: Type.String()
        }),
        400: Type.Object({ error: Type.String(), message: Type.String() }),
        401: Type.Object({ error: Type.String(), message: Type.String() }),
        404: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() })
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const { id } = request.params as { id: string };
      const reviewData = request.body as ReviewSubmission;
      
      const review = await brokerService.submitReview(id, request.user.userId, reviewData);
      return reply.code(201).send(review);
    } catch (error) {
      app.log.error(error, 'Error submitting broker review');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to submit review'
      });
    }
  });

  // POST /v1/brokers/recommend - Get personalized broker recommendations (requires authentication)
  app.post('/v1/brokers/recommend', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Brokers'],
      description: 'Get personalized broker recommendations',
      body: BrokerRecommendationRequestSchema,
      security: [{ bearerAuth: [] }, { apiKey: [] }],
      response: {
        200: Type.Array(Type.Object({
          broker: Type.Object({
            id: Type.String(),
            name: Type.String(),
            legalName: Type.String(),
            ojkLicenseStatus: Type.Union([
              Type.Literal('ACTIVE'),
              Type.Literal('SUSPENDED'),
              Type.Literal('REVOKED')
            ])
          }),
          score: Type.Number(),
          reasoning: Type.Array(Type.String()),
          strengths: Type.Array(Type.String()),
          weaknesses: Type.Array(Type.String()),
          bestFor: Type.Array(Type.String())
        })),
        400: Type.Object({ error: Type.String(), message: Type.String() }),
        401: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() })
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const requestData = request.body as BrokerRecommendationRequest;
      const recommendations = await brokerService.getRecommendations(requestData);
      return recommendations;
    } catch (error) {
      app.log.error(error, 'Error generating broker recommendations');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to generate recommendations'
      });
    }
  });

  // GET /v1/brokers/:id/real-time-status - Get real-time broker status
  app.get('/v1/brokers/:id/real-time-status', {
    schema: {
      tags: ['Brokers'],
      description: 'Get real-time broker operational status',
      params: Type.Object({
        id: Type.String()
      }),
      response: {
        200: Type.Object({
          status: Type.Union([
            Type.Literal('healthy'),
            Type.Literal('degraded'),
            Type.Literal('unhealthy'),
            Type.Literal('unknown')
          ]),
          uptime: Type.Optional(Type.Number()),
          averageResponseTime: Type.Optional(Type.Number()),
          lastUpdated: Type.Optional(Type.String())
        }),
        404: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const status = await brokerService.getRealTimeStatus(id);
      return status;
    } catch (error) {
      app.log.error(error, 'Error fetching broker status');
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch broker status'
      });
    }
  });
}
