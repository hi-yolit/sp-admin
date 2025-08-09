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

    // Quick connectivity probe
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again in a moment.', type: 'database_error' },
        { status: 503 }
      );
    }

    // Result typing for the raw query
    interface BusinessStatsRow {
      id: string;
      name: string;
      createdAt: Date;
      ownerId: string | null;
      ownerName: string | null;
      ownerEmail: string | null;
      subscriptionId: string | null;
      subscriptionStatus: string | null;
      startDate: Date | null;
      endDate: Date | null;
      cancelledAt: Date | null;
      lastPaymentDate: Date | null;
      nextBillingDate: Date | null;
      trialEndsAt: Date | null;
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

        -- Owner info (COALESCE email -> '' so the UI search .toLowerCase() won't crash)
        u.id                         AS "ownerId",
        u.name                       AS "ownerName", 
        COALESCE(u.email, '')        AS "ownerEmail",

        -- Subscription info
        s.id                         AS "subscriptionId",
        s.status                     AS "subscriptionStatus",
        s."startDate"                AS "startDate",
        s."endDate"                  AS "endDate",
        s."cancelledAt"              AS "cancelledAt",
        s."lastPaymentDate"          AS "lastPaymentDate",
        s."nextBillingDate"          AS "nextBillingDate",
        s."trialEndsAt"              AS "trialEndsAt",

        -- Plan info
        p.id                         AS "planId",
        p.name                       AS "planName",
        p."maxOffers",
        p.price                      AS "planPrice",

        -- Aggregated stats
        COUNT(CASE WHEN lo."isMonitored" = true THEN 1 END)::int AS "totalMonitoredOffers",

        COUNT(
          CASE
            WHEN lo."isMonitored" = true
             AND lo."minPrice" IS NOT NULL
             AND od."selling_price" <= lo."minPrice"
            THEN 1
          END
        )::int AS "reachedMinPrice",

        COUNT(
          CASE
            WHEN lo."isMonitored" = true
             AND (lo."minPrice" IS NULL OR od."selling_price" > lo."minPrice")
            THEN 1
          END
        )::int AS "currentlyMonitored",

        COUNT(
          CASE
            WHEN lo."isMonitored" = true
             AND (lo."minPrice" IS NULL OR od."selling_price" > lo."minPrice")
             AND od."inBuyBox" = true
            THEN 1
          END
        )::int AS "inBuyBox",

        MAX(lo."lastMonitored")      AS "lastActivity"

      FROM "Business" b
      LEFT JOIN "User" u
        ON b."ownerId" = u.id
      LEFT JOIN "Subscription" s
        ON b.id = s."businessId"
      LEFT JOIN "Plan" p
        ON s."planId" = p.id
      LEFT JOIN "LocalOffer" lo
        ON b.id = lo."businessId"
      LEFT JOIN "offers" od
        ON lo."offerDtoId" = od."offer_id"
       AND lo."businessId" = od."businessId"

      GROUP BY
        b.id, b.name, b."createdAt",
        u.id, u.name, u.email,
        s.id, s.status, s."startDate", s."endDate", s."cancelledAt",
        s."lastPaymentDate", s."nextBillingDate", s."trialEndsAt",
        p.id, p.name, p."maxOffers", p.price

      ORDER BY b."createdAt" DESC
    `;

    // Minimal mapping to the shape your page expects
    const processed = businessesWithStats.map((row) => {
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
          email: row.ownerEmail || '', // keep non-null for UI search
        },
        subscription: row.subscriptionId
          ? {
              id: row.subscriptionId,
              status: row.subscriptionStatus,
              startDate: row.startDate,
              endDate: row.endDate,
              cancelledAt: row.cancelledAt,
              lastPaymentDate: row.lastPaymentDate,
              nextBillingDate: row.nextBillingDate,
              trialEndsAt: row.trialEndsAt,
              plan: {
                id: row.planId,
                name: row.planName,
                maxOffers: row.maxOffers,
                price: row.planPrice,
              },
            }
          : null,
        _count: {
          monitoredOffers: row.totalMonitoredOffers || 0,
        },
        monitoringStats: {
          totalMonitored: row.currentlyMonitored || 0, // monitored & above min price
          inBuyBox: row.inBuyBox || 0,
          notInBuyBox: Math.max(notInBuyBox, 0),
          reachedMinPrice: row.reachedMinPrice || 0,
          planUtilization,
        },
        lastActivity: row.lastActivity,
      };
    });

    return NextResponse.json(processed);
  } catch (error: any) {
    console.error('Error fetching business monitoring data:', error);

    if (error?.code === 'P1001') {
      return NextResponse.json(
        { error: 'Cannot reach database server. Please check your connection.', type: 'connection_error' },
        { status: 503 }
      );
    }
    if (error?.code === 'P1008') {
      return NextResponse.json(
        { error: 'Database operation timed out. Please try again.', type: 'timeout_error' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch business monitoring data', type: 'server_error' },
      { status: 500 }
    );
  }
}
