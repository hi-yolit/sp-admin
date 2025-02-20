import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { SubscriptionStatus } from '@prisma/client';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract ID from the request URL
    const url = new URL(request.url);
    const id = url.pathname.split('/')[4]; // Adjust index based on route depth

    if (!id) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    const { status, nextBillingDate } = await request.json();

    // Validate status
    if (!Object.values(SubscriptionStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid subscription status' },
        { status: 400 }
      );
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: status as SubscriptionStatus,
        nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null,
      },
      include: {
        business: {
          select: {
            name: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
