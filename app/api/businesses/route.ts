// app/api/businesses/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const businesses = await prisma.business.findMany({
            select: {
                id: true,
                name: true,
                subscription: {
                    select: {
                        status: true
                    }
                },
                owner: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(businesses);
    } catch (error) {
        console.error('Error fetching businesses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch businesses' },
            { status: 500 }
        );
    }
}
