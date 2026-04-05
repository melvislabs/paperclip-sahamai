import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcrypt'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting database seed...')

  // Seed stocks
  const stocks = await Promise.all([
    prisma.stock.upsert({
      where: { symbol: 'BBCA' },
      update: {},
      create: {
        symbol: 'BBCA',
        name: 'Bank Central Asia Tbk',
        exchange: 'IDX',
        sector: 'Financials',
        industry: 'Banks',
      },
    }),
    prisma.stock.upsert({
      where: { symbol: 'BBRI' },
      update: {},
      create: {
        symbol: 'BBRI',
        name: 'Bank Rakyat Indonesia Tbk',
        exchange: 'IDX',
        sector: 'Financials',
        industry: 'Banks',
      },
    }),
    prisma.stock.upsert({
      where: { symbol: 'TLKM' },
      update: {},
      create: {
        symbol: 'TLKM',
        name: 'Telkom Indonesia Tbk',
        exchange: 'IDX',
        sector: 'Telecommunications',
        industry: 'Telecom Services',
      },
    }),
    prisma.stock.upsert({
      where: { symbol: 'ASII' },
      update: {},
      create: {
        symbol: 'ASII',
        name: 'Astra International Tbk',
        exchange: 'IDX',
        sector: 'Consumer Cyclical',
        industry: 'Auto Manufacturers',
      },
    }),
    prisma.stock.upsert({
      where: { symbol: 'UNVR' },
      update: {},
      create: {
        symbol: 'UNVR',
        name: 'Unilever Indonesia Tbk',
        exchange: 'IDX',
        sector: 'Consumer Defensive',
        industry: 'Household & Personal Products',
      },
    }),
    prisma.stock.upsert({
      where: { symbol: 'BMRI' },
      update: {},
      create: {
        symbol: 'BMRI',
        name: 'Bank Mandiri Tbk',
        exchange: 'IDX',
        sector: 'Financials',
        industry: 'Banks',
      },
    }),
    prisma.stock.upsert({
      where: { symbol: 'BBNI' },
      update: {},
      create: {
        symbol: 'BBNI',
        name: 'Bank Negara Indonesia Tbk',
        exchange: 'IDX',
        sector: 'Financials',
        industry: 'Banks',
      },
    }),
    prisma.stock.upsert({
      where: { symbol: 'GOTO' },
      update: {},
      create: {
        symbol: 'GOTO',
        name: 'GoTo Gojek Tokopedia Tbk',
        exchange: 'IDX',
        sector: 'Technology',
        industry: 'Internet',
      },
    }),
    prisma.stock.upsert({
      where: { symbol: 'BUKA' },
      update: {},
      create: {
        symbol: 'BUKA',
        name: 'Bukalapak.com Tbk',
        exchange: 'IDX',
        sector: 'Consumer Cyclical',
        industry: 'Internet',
      },
    }),
    prisma.stock.upsert({
      where: { symbol: 'ANTM' },
      update: {},
      create: {
        symbol: 'ANTM',
        name: 'Aneka Tambang Tbk',
        exchange: 'IDX',
        sector: 'Basic Materials',
        industry: 'Mining',
      },
    }),
    prisma.stock.upsert({
      where: { symbol: 'PGAS' },
      update: {},
      create: {
        symbol: 'PGAS',
        name: 'Perusahaan Gas Negara Tbk',
        exchange: 'IDX',
        sector: 'Energy',
        industry: 'Oil & Gas',
      },
    }),
    prisma.stock.upsert({
      where: { symbol: 'INDF' },
      update: {},
      create: {
        symbol: 'INDF',
        name: 'Indofood Sukses Makmur Tbk',
        exchange: 'IDX',
        sector: 'Consumer Defensive',
        industry: 'Food Products',
      },
    }),
  ])

  console.log(`Seeded ${stocks.length} stocks`)

  // Seed stock prices
  const bbc = stocks.find((s) => s.symbol === 'BBCA')
  const bbri = stocks.find((s) => s.symbol === 'BBRI')
  const tlkm = stocks.find((s) => s.symbol === 'TLKM')
  const asii = stocks.find((s) => s.symbol === 'ASII')
  const unvr = stocks.find((s) => s.symbol === 'UNVR')
  const bmri = stocks.find((s) => s.symbol === 'BMRI')
  const bni = stocks.find((s) => s.symbol === 'BBNI')
  const goto = stocks.find((s) => s.symbol === 'GOTO')
  const buka = stocks.find((s) => s.symbol === 'BUKA')
  const antm = stocks.find((s) => s.symbol === 'ANTM')
  const pgas = stocks.find((s) => s.symbol === 'PGAS')
  const indf = stocks.find((s) => s.symbol === 'INDF')
  if (bbc) {
    await prisma.stockPrice.createMany({
      data: [
        {
          stockId: bbc.id,
          price: 9275,
          open: 9200,
          high: 9350,
          low: 9150,
          volume: 45000000n,
          timestamp: new Date('2026-04-01T09:00:00Z'),
        },
        {
          stockId: bbc.id,
          price: 9350,
          open: 9275,
          high: 9400,
          low: 9250,
          volume: 52000000n,
          timestamp: new Date('2026-04-02T09:00:00Z'),
        },
        {
          stockId: bbc.id,
          price: 9425,
          open: 9350,
          high: 9500,
          low: 9300,
          volume: 48000000n,
          timestamp: new Date('2026-04-03T09:00:00Z'),
        },
      ],
      skipDuplicates: true,
    })
  }

  if (bbri) {
    await prisma.stockPrice.createMany({
      data: [
        {
          stockId: bbri.id,
          price: 6150,
          open: 6100,
          high: 6200,
          low: 6050,
          volume: 78000000n,
          timestamp: new Date('2026-04-01T09:00:00Z'),
        },
        {
          stockId: bbri.id,
          price: 6225,
          open: 6150,
          high: 6275,
          low: 6125,
          volume: 82000000n,
          timestamp: new Date('2026-04-02T09:00:00Z'),
        },
        {
          stockId: bbri.id,
          price: 6300,
          open: 6225,
          high: 6350,
          low: 6200,
          volume: 75000000n,
          timestamp: new Date('2026-04-03T09:00:00Z'),
        },
      ],
      skipDuplicates: true,
    })
  }

  if (tlkm) {
    await prisma.stockPrice.createMany({
      data: [
        {
          stockId: tlkm.id,
          price: 3850,
          open: 3800,
          high: 3900,
          low: 3775,
          volume: 95000000n,
          timestamp: new Date('2026-04-01T09:00:00Z'),
        },
        {
          stockId: tlkm.id,
          price: 3900,
          open: 3850,
          high: 3950,
          low: 3825,
          volume: 88000000n,
          timestamp: new Date('2026-04-02T09:00:00Z'),
        },
        {
          stockId: tlkm.id,
          price: 3925,
          open: 3900,
          high: 3975,
          low: 3875,
          volume: 91000000n,
          timestamp: new Date('2026-04-03T09:00:00Z'),
        },
      ],
      skipDuplicates: true,
    })
  }

  if (bmri) {
    await prisma.stockPrice.createMany({
      data: [
        {
          stockId: bmri.id,
          price: 6450,
          open: 6400,
          high: 6500,
          low: 6375,
          volume: 65000000n,
          timestamp: new Date('2026-04-01T09:00:00Z'),
        },
        {
          stockId: bmri.id,
          price: 6525,
          open: 6450,
          high: 6575,
          low: 6425,
          volume: 70000000n,
          timestamp: new Date('2026-04-02T09:00:00Z'),
        },
        {
          stockId: bmri.id,
          price: 6600,
          open: 6525,
          high: 6650,
          low: 6500,
          volume: 68000000n,
          timestamp: new Date('2026-04-03T09:00:00Z'),
        },
      ],
      skipDuplicates: true,
    })
  }

  if (bni) {
    await prisma.stockPrice.createMany({
      data: [
        {
          stockId: bni.id,
          price: 5800,
          open: 5750,
          high: 5850,
          low: 5725,
          volume: 55000000n,
          timestamp: new Date('2026-04-01T09:00:00Z'),
        },
        {
          stockId: bni.id,
          price: 5875,
          open: 5800,
          high: 5925,
          low: 5775,
          volume: 60000000n,
          timestamp: new Date('2026-04-02T09:00:00Z'),
        },
        {
          stockId: bni.id,
          price: 5950,
          open: 5875,
          high: 6000,
          low: 5850,
          volume: 58000000n,
          timestamp: new Date('2026-04-03T09:00:00Z'),
        },
      ],
      skipDuplicates: true,
    })
  }

  if (goto) {
    await prisma.stockPrice.createMany({
      data: [
        {
          stockId: goto.id,
          price: 82,
          open: 80,
          high: 84,
          low: 79,
          volume: 450000000n,
          timestamp: new Date('2026-04-01T09:00:00Z'),
        },
        {
          stockId: goto.id,
          price: 86,
          open: 82,
          high: 88,
          low: 81,
          volume: 520000000n,
          timestamp: new Date('2026-04-02T09:00:00Z'),
        },
        {
          stockId: goto.id,
          price: 84,
          open: 86,
          high: 87,
          low: 82,
          volume: 480000000n,
          timestamp: new Date('2026-04-03T09:00:00Z'),
        },
      ],
      skipDuplicates: true,
    })
  }

  if (buka) {
    await prisma.stockPrice.createMany({
      data: [
        {
          stockId: buka.id,
          price: 128,
          open: 125,
          high: 132,
          low: 124,
          volume: 280000000n,
          timestamp: new Date('2026-04-01T09:00:00Z'),
        },
        {
          stockId: buka.id,
          price: 135,
          open: 128,
          high: 138,
          low: 126,
          volume: 310000000n,
          timestamp: new Date('2026-04-02T09:00:00Z'),
        },
        {
          stockId: buka.id,
          price: 132,
          open: 135,
          high: 137,
          low: 130,
          volume: 295000000n,
          timestamp: new Date('2026-04-03T09:00:00Z'),
        },
      ],
      skipDuplicates: true,
    })
  }

  if (antm) {
    await prisma.stockPrice.createMany({
      data: [
        {
          stockId: antm.id,
          price: 1650,
          open: 1625,
          high: 1675,
          low: 1600,
          volume: 42000000n,
          timestamp: new Date('2026-04-01T09:00:00Z'),
        },
        {
          stockId: antm.id,
          price: 1700,
          open: 1650,
          high: 1725,
          low: 1640,
          volume: 48000000n,
          timestamp: new Date('2026-04-02T09:00:00Z'),
        },
        {
          stockId: antm.id,
          price: 1725,
          open: 1700,
          high: 1750,
          low: 1675,
          volume: 45000000n,
          timestamp: new Date('2026-04-03T09:00:00Z'),
        },
      ],
      skipDuplicates: true,
    })
  }

  if (pgas) {
    await prisma.stockPrice.createMany({
      data: [
        {
          stockId: pgas.id,
          price: 1420,
          open: 1400,
          high: 1450,
          low: 1390,
          volume: 38000000n,
          timestamp: new Date('2026-04-01T09:00:00Z'),
        },
        {
          stockId: pgas.id,
          price: 1460,
          open: 1420,
          high: 1480,
          low: 1410,
          volume: 41000000n,
          timestamp: new Date('2026-04-02T09:00:00Z'),
        },
        {
          stockId: pgas.id,
          price: 1475,
          open: 1460,
          high: 1500,
          low: 1440,
          volume: 39000000n,
          timestamp: new Date('2026-04-03T09:00:00Z'),
        },
      ],
      skipDuplicates: true,
    })
  }

  if (indf) {
    await prisma.stockPrice.createMany({
      data: [
        {
          stockId: indf.id,
          price: 6800,
          open: 6750,
          high: 6850,
          low: 6725,
          volume: 25000000n,
          timestamp: new Date('2026-04-01T09:00:00Z'),
        },
        {
          stockId: indf.id,
          price: 6875,
          open: 6800,
          high: 6925,
          low: 6775,
          volume: 28000000n,
          timestamp: new Date('2026-04-02T09:00:00Z'),
        },
        {
          stockId: indf.id,
          price: 6900,
          open: 6875,
          high: 6950,
          low: 6850,
          volume: 26000000n,
          timestamp: new Date('2026-04-03T09:00:00Z'),
        },
      ],
      skipDuplicates: true,
    })
  }

  // Seed admin user
  const passwordHash = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sahamai.com' },
    update: {},
    create: {
      email: 'admin@sahamai.com',
      name: 'Admin Saham AI',
      passwordHash,
      role: 'ADMIN',
    },
  })

  // Create portfolio for admin
  await prisma.portfolio.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      totalValue: 150000000,
      cashBalance: 25000000,
      riskScore: 0.35,
    },
  })

  // Create holdings for admin
  if (bbc) {
    const adminPortfolio = await prisma.portfolio.findUnique({
      where: { userId: adminUser.id },
    })
    if (adminPortfolio) {
      await prisma.holding.upsert({
        where: {
          portfolioId_symbol: {
            portfolioId: adminPortfolio.id,
            symbol: 'BBCA',
          },
        },
        update: {},
        create: {
          portfolioId: adminPortfolio.id,
          symbol: 'BBCA',
          quantity: 1000,
          avgCostPrice: 9100,
        },
      })
    }
  }

  // Seed demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@sahamai.com' },
    update: {},
    create: {
      email: 'demo@sahamai.com',
      name: 'Demo User',
      passwordHash,
      role: 'USER',
    },
  })

  await prisma.portfolio.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      totalValue: 50000000,
      cashBalance: 10000000,
      riskScore: 0.5,
    },
  })

  // Seed digest preferences for admin
  await prisma.digestPreference.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      enabled: true,
      deliveryTime: '07:00',
      timezone: 'Asia/Jakarta',
      includeAlerts: true,
      includeAnalysis: true,
      includeMarketSummary: true,
    },
  })

  // Seed a price alert
  if (bbc) {
    await prisma.priceAlert.create({
      data: {
        userId: adminUser.id,
        stockId: bbc.id,
        targetPrice: 9500,
        condition: 'ABOVE',
        alertType: 'ONE_TIME',
        isActive: true,
        notificationChannels: ['in_app'],
      },
    })
  }

  // Seed a sample AI analysis
  if (bbc) {
    await prisma.aIAnalysis.create({
      data: {
        stockId: bbc.id,
        userId: adminUser.id,
        analysisType: 'TECHNICAL',
        summary: 'BBCA menunjukkan pola bullish dengan support kuat di level 9200. RSI menunjukkan momentum positif.',
        sentiment: 'BULLISH',
        confidence: 0.78,
        riskLevel: 'MEDIUM',
        priceTarget: 9800,
        reasoning: 'Analisis teknikal menunjukkan tren naik dengan volume yang meningkat. Support level di 9200 kuat dengan beberapa kali rejection.',
      },
    })
  }

  console.log('Seed completed successfully!')
  console.log('')
  console.log('Demo accounts:')
  console.log('  Admin: admin@sahamai.com / admin123')
  console.log('  User:  demo@sahamai.com / admin123')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
