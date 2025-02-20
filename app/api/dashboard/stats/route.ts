// app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [
            userCount,
            businessCount,
            offerCount,
            monitoredOfferCount,
            businessStats,
            recentChanges
        ] = await Promise.all([
            prisma.user.count(),
            prisma.business.count(),
            prisma.offerDTO.count(),
            prisma.localOffer.count({
                where: { isMonitored: true }
            }),
            prisma.subscription.groupBy({
                by: ['status'],
                _count: {
                    _all: true
                }
            }),
            prisma.subscription.findMany({
                take: 5,
                orderBy: {
                    updatedAt: 'desc'
                },
                include: {
                    business: {
                        select: {
                            name: true
                        }
                    }
                }
            })
        ]);

        const activeBusinessCount = businessStats.find(stat => stat.status === 'ACTIVE')?._count?._all ?? 0;
        const trialBusinessCount = businessStats.find(stat => stat.status === 'TRIAL')?._count?._all ?? 0;
        const inactiveBusinessCount = businessStats.reduce((acc, stat) => {
            if (['EXPIRED', 'CANCELLED', 'PAST_DUE'].includes(stat?.status ?? '')) {
                return acc + (stat._count?._all ?? 0);
            }
            return acc;
        }, 0);

        return NextResponse.json({
            stats: {
                userCount,
                businessCount,
                offerCount,
                monitoredOfferCount,
                activeBusinessCount,
                trialBusinessCount,
                inactiveBusinessCount,
                recentSubscriptionChanges: recentChanges.map(change => ({
                    business: change.business,
                    status: change.status,
                    updatedAt: change.updatedAt
                }))
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}