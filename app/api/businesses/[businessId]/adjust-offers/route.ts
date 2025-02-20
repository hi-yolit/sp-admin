// app/api/businesses/[businessId]/adjust-offers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId } = params;
    const { maxOffers } = await request.json();

    // Get all monitored offers for the business, ordered by createdAt
    const monitoredOffers = await prisma.localOffer.findMany({
      where: {
        businessId,
        isMonitored: true
      },
      orderBy: {
        createdAt: 'asc' // Get oldest first so we can remove them
      }
    });

    // If we need to remove offers
    if (monitoredOffers.length > maxOffers) {
      const offersToUnmonitor = monitoredOffers.slice(0, monitoredOffers.length - maxOffers);
      
      // Update offers to not be monitored
      await prisma.localOffer.updateMany({
        where: {
          id: {
            in: offersToUnmonitor.map(offer => offer.id)
          }
        },
        data: {
          isMonitored: false
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      adjustedCount: monitoredOffers.length - maxOffers 
    });
  } catch (error) {
    console.error('Adjust offers error:', error);
    return NextResponse.json(
      { error: 'Failed to adjust monitored offers' },
      { status: 500 }
    );
  }
}