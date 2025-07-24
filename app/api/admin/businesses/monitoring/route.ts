// app/api/admin/businesses/monitoring/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please try again in a moment.',
          type: 'database_error'
        }, 
        { status: 503 }
      );
    }

    // 🚀 OPTIMIZED: Use raw SQL for better performance with proper typing
    interface BusinessStatsRow {
      id: string;
      name: string;
      createdAt: Date;
      ownerId: string | null;
      ownerName: string | null;
      ownerEmail: string | null;
      subscriptionId: string | null;
      subscriptionStatus: string | null;
      nextBillingDate: Date | null;
      planId: string | null;
      planName: string | null;
      maxOffers: number | null;
      planPrice: number | null;
      totalMonitoredOffers: number;
      reachedMinPrice: number;
      currentlyMonitored: number;
      inBuyBox: number;
      lastActivity: Date | null;
    }

    const businessesWithStats = await prisma.$queryRaw<BusinessStatsRow[]>`
      SELECT 
        b.id,
        b.name,
        b."createdAt",
        -- Owner info
        u.id as "ownerId",
        u.name as "ownerName", 
        u.email as "ownerEmail",
        -- Subscription info
        s.id as "subscriptionId",
        s.status as "subscriptionStatus",
        s."nextBillingDate",
        p.id as "planId",
        p.name as "planName",
        p."maxOffers",
        p.price as "planPrice",
        -- Aggregated stats (calculated in DB, not client)
        COUNT(CASE WHEN lo."isMonitored" = true THEN 1 END)::int as "totalMonitoredOffers",
        COUNT(CASE WHEN lo."isMonitored" = true AND lo."minPrice" IS NOT NULL 
                   AND od."sellingPrice" <= lo."minPrice" THEN 1 END)::int as "reachedMinPrice",
        COUNT(CASE WHEN lo."isMonitored" = true AND (lo."minPrice" IS NULL 
                   OR od."sellingPrice" > lo."minPrice") THEN 1 END)::int as "currentlyMonitored",
        COUNT(CASE WHEN lo."isMonitored" = true AND (lo."minPrice" IS NULL 
                   OR od."sellingPrice" > lo."minPrice") AND od."inBuyBox" = true THEN 1 END)::int as "inBuyBox",
        MAX(lo."lastMonitored") as "lastActivity"
      FROM "Business" b
      LEFT JOIN "User" u ON b."ownerId" = u.id
      LEFT JOIN "Subscription" s ON b.id = s."businessId"
      LEFT JOIN "Plan" p ON s."planId" = p.id
      LEFT JOIN "LocalOffer" lo ON b.id = lo."businessId"
      LEFT JOIN "OfferDTO" od ON lo."offerDtoId" = od.id
      GROUP BY b.id, b.name, b."createdAt", u.id, u.name, u.email, 
               s.id, s.status, s."nextBillingDate", p.id, p.name, p."maxOffers", p.price
      ORDER BY b."createdAt" DESC
    `;

    // 🚀 OPTIMIZED: Minimal client-side processing
    const processedBusinesses = businessesWithStats.map((row) => {
      const totalOffers = (row.currentlyMonitored || 0) + (row.reachedMinPrice || 0);
      const planLimit = row.maxOffers || 0;
      const planUtilization = planLimit > 0 ? Math.min((totalOffers / planLimit) * 100, 100) : 0;
      const notInBuyBox = (row.currentlyMonitored || 0) - (row.inBuyBox || 0);

      return {
        id: row.id,
        name: row.name,
        createdAt: row.createdAt,
        owner: {
          id: row.ownerId,
          name: row.ownerName,
          email: row.ownerEmail,
        },
        subscription: row.subscriptionId ? {
          id: row.subscriptionId,
          status: row.subscriptionStatus,
          nextBillingDate: row.nextBillingDate,
          plan: {
            id: row.planId,
            name: row.planName,
            maxOffers: row.maxOffers,
            price: row.planPrice,
          },
        } : null,
        _count: {
          monitoredOffers: row.totalMonitoredOffers || 0,
        },
        monitoringStats: {
          totalMonitored: row.currentlyMonitored || 0,
          inBuyBox: row.inBuyBox || 0,
          notInBuyBox: Math.max(notInBuyBox, 0),
          reachedMinPrice: row.reachedMinPrice || 0,
          planUtilization,
        },
        lastActivity: row.lastActivity,
      };
    });

    return NextResponse.json(processedBusinesses);

  } catch (error) {
    console.error('Error fetching business monitoring data:', error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P1001') {
        return NextResponse.json(
          { 
            error: 'Cannot reach database server. Please check your connection.',
            type: 'connection_error'
          },
          { status: 503 }
        );
      }

      if (error.code === 'P1008') {
        return NextResponse.json(
          { 
            error: 'Database operation timed out. Please try again.',
            type: 'timeout_error'
          },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch business monitoring data',
        type: 'server_error'
      },
      { status: 500 }
    );
  }
}