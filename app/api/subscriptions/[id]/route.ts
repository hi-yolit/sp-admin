// app/api/subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { SubscriptionStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
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