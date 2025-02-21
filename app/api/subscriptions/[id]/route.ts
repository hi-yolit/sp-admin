import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { SubscriptionStatus, Prisma } from '@prisma/client';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract and validate ID
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Log the incoming request data
    const body = await request.json();
    console.log('Request body:', body);
    const { status, nextBillingDate, planId } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Validate status enum
    if (!Object.values(SubscriptionStatus).includes(status)) {
      return NextResponse.json(
        { 
          error: 'Invalid subscription status',
          validStatuses: Object.values(SubscriptionStatus),
          receivedStatus: status
        },
        { status: 400 }
      );
    }

    // Verify subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: `Subscription not found with ID: ${id}` },
        { status: 404 }
      );
    }

    // Prepare update data with proper typing
    const updateData: Prisma.SubscriptionUpdateInput = {
      status: status as SubscriptionStatus,
    };

    // Only include nextBillingDate if provided
    if (nextBillingDate) {
      updateData.nextBillingDate = new Date(nextBillingDate);
    }

    // Only include planId if provided
    if (planId) {
      updateData.plan = {
        connect: { id: planId }
      };
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        business: {
          select: {
            name: true,
          },
        },
        plan: {
          select: {
            name: true,
            id: true,
            maxOffers: true,
            price: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}