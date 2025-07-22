// app/api/admin/businesses/monitoring/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    // Fetch businesses with related data
    const businesses = await prisma.business.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                maxOffers: true,
              },
            },
          },
        },
        _count: {
          select: {
            monitoredOffers: {
              where: {
                isMonitored: true,  // Only count actively monitored offers
              },
            },
          },
        },
        monitoredOffers: {
          where: {
            isMonitored: true,  // Only count actively monitored offers
          },
          select: {
            id: true,
            minPrice: true,
            lastMonitored: true,
            offerDto: {
              select: {
                inBuyBox: true,
                sellingPrice: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Process the data to calculate monitoring stats
    const businessesWithStats = businesses.map(business => {
      const allOffers = business.monitoredOffers;
      
      // Separate offers at minimum price (successful but no longer optimizable)
      const atMinPrice = allOffers.filter(offer => {
        if (!offer.minPrice || !offer.offerDto.sellingPrice) return false;
        return offer.offerDto.sellingPrice <= offer.minPrice;
      }).length;

      // Currently monitored offers = those we can still optimize (above min price)
      const currentlyMonitored = allOffers.filter(offer => {
        if (!offer.minPrice || !offer.offerDto.sellingPrice) return true;
        return offer.offerDto.sellingPrice > offer.minPrice;
      });

      // Calculate stats from currently monitored offers only
      const totalMonitored = currentlyMonitored.length;
      const inBuyBox = currentlyMonitored.filter(offer => offer.offerDto.inBuyBox).length;
      const notInBuyBox = totalMonitored - inBuyBox;

      // Plan utilization based on all tracked offers
      const planLimit = business.subscription?.plan.maxOffers || 0;
      const planUtilization = planLimit > 0 ? (allOffers.length / planLimit) * 100 : 0;

      // Last activity from currently monitored offers
      const lastMonitoredDates = currentlyMonitored
        .map(offer => offer.lastMonitored)
        .filter(date => date !== null)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());
      
      const lastActivity = lastMonitoredDates.length > 0 ? lastMonitoredDates[0] : null;

      return {
        id: business.id,
        name: business.name,
        owner: business.owner,
        subscription: business.subscription,
        createdAt: business.createdAt,
        _count: business._count,
        monitoringStats: {
          totalMonitored,        // 454 - offers we can still optimize
          inBuyBox,             // from currently monitored offers
          notInBuyBox,          // from currently monitored offers  
          reachedMinPrice: atMinPrice,  // 393 - offers at minimum price
          planUtilization: Math.min(planUtilization, 100),
        },
        lastActivity,
      };
    });

    return NextResponse.json(businessesWithStats);

  } catch (error: any) {
    console.error('Error fetching business monitoring data:', error);
    
    // Handle specific Prisma errors
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

    return NextResponse.json(
      { 
        error: 'Failed to fetch business monitoring data',
        type: 'server_error'
      },
      { status: 500 }
    );
  }
}