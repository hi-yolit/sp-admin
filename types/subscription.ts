// types/subscription.ts

import { SubscriptionStatus } from "@prisma/client";


export interface Subscription {
    id: string;
    businessId: string;
    business: {
        name: string;
    };
    plan: {
        id: string;
        name: string;
        maxOffers: number;
    };
    status: SubscriptionStatus;
    startDate: string;
    nextBillingDate: string | null;
    trialEndsAt: string | null;
}