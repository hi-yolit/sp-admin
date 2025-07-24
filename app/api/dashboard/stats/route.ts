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
            totalBusinessCount,
            totalOfferCount,
            businessStats,
            activeBusinessesWithMonitoring,
            recentChanges
        ] = await Promise.all([
            // Total users
            prisma.user.count(),
            
            // Total businesses (all)
            prisma.business.count(),
            
            // Total offers (all)
            prisma.offerDTO.count(),
            
            // Subscription status breakdown
            prisma.subscription.groupBy({
                by: ['status'],
                _count: {
                    _all: true
                }
            }),
            
            // Get businesses with active subscriptions and their monitored offers
            prisma.business.findMany({
                where: {
                    subscription: {
                        status: {
                            in: ['ACTIVE', 'TRIAL']
                        }
                    }
                },
                include: {
                    _count: {
                        select: {
                            monitoredOffers: {
                                where: {
                                    isMonitored: true
                                }
                            }
                        }
                    },
                    subscription: {
                        select: {
                            status: true
                        }
                    }
                }
            }),
            
            // Recent subscription changes
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

        // Calculate stats from businesses with active subscriptions only
        const activeBusinessCount = businessStats.find(stat => stat.status === 'ACTIVE')?._count?._all ?? 0;
        const trialBusinessCount = businessStats.find(stat => stat.status === 'TRIAL')?._count?._all ?? 0;
        const totalActiveSubscriptions = activeBusinessCount + trialBusinessCount;
        
        const inactiveBusinessCount = businessStats.reduce((acc, stat) => {
            if (['EXPIRED', 'CANCELLED', 'PAST_DUE'].includes(stat?.status ?? '')) {
                return acc + (stat._count?._all ?? 0);
            }
            return acc;
        }, 0);

        // Only count monitored offers from businesses with active subscriptions
        const actuallyMonitoredOfferCount = activeBusinessesWithMonitoring.reduce((total, business) => {
            return total + business._count.monitoredOffers;
        }, 0);

        // Count businesses that are actively monitoring (have active subscription + monitored offers > 0)
        const activelyMonitoringBusinessCount = activeBusinessesWithMonitoring.filter(
            business => business._count.monitoredOffers > 0
        ).length;

        return NextResponse.json({
            stats: {
                userCount,
                totalBusinessCount, // All businesses
                activeSubscriptions: totalActiveSubscriptions, // Only active/trial
                activelyMonitoringBusinessCount, // Active subscriptions with monitored offers
                totalOfferCount, // All offers in system
                actuallyMonitoredOfferCount, // Only offers from active subscriptions
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