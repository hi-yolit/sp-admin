import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { emailService } from '@/lib/email-service';
import { authOptions } from '@/lib/authOptions';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, recipientIds, subject, body } = await request.json();

        if (type === "users") {
            const users = await prisma.user.findMany({
                where: {
                    id: { in: recipientIds }
                },
                include: {
                    ownedBusinesses: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            for (const user of users) {
                const businessNames = user.ownedBusinesses.map(b => b.name).join(', ');
                const personalizedBody = body
                    .replace(/{{name}}/g, user.name ?? 'there')
                    .replace(/{{businessNames}}/g, businessNames || 'your business');

                await emailService.sendCustomEmail(
                    user.email,
                    subject,
                    personalizedBody
                );
            }
        } else {
            const businesses = await prisma.business.findMany({
                where: {
                    id: { in: recipientIds }
                },
                include: {
                    owner: true,
                    subscription: true
                }
            });

            for (const business of businesses) {
                
                const personalizedSubject = subject
                    .replace(/{{name}}/g, business.owner.name ?? 'there')
                    .replace(/{{businessName}}/g, business.name)
                    .replace(/{{status}}/g, business.subscription?.status ?? 'no subscription');

                const personalizedBody = body
                    .replace(/{{name}}/g, business.owner.name ?? 'there')
                    .replace(/{{businessName}}/g, business.name)
                    .replace(/{{status}}/g, business.subscription?.status ?? 'no subscription');

                await emailService.sendCustomEmail(
                    business.owner.email,
                    personalizedSubject,
                    personalizedBody
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending emails:', error);
        return NextResponse.json(
            { error: 'Failed to send emails' },
            { status: 500 }
        );
    }
}