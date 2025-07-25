// app/api/admin/businesses/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type Params = { id: string }
type Context = { params: Promise<Params> }

// PATCH — update business
export async function PATCH(
  request: Request,
  { params }: Context
) {
  const { id: businessId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, ownerEmail } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }
    if (!ownerEmail?.trim()) {
      return NextResponse.json({ error: 'Owner email is required' }, { status: 400 })
    }

    const existing = await prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: { select: { id: true, email: true } } }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    let ownerId = existing.ownerId
    if (ownerEmail.toLowerCase() !== existing.owner.email.toLowerCase()) {
      const newOwner = await prisma.user.findUnique({
        where: { email: ownerEmail.toLowerCase() }
      })
      if (!newOwner) {
        return NextResponse.json(
          { error: `User with email ${ownerEmail} not found` },
          { status: 400 }
        )
      }
      ownerId = newOwner.id
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: { name: name.trim(), ownerId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        subscription: { include: { plan: true } }
      }
    })

    return NextResponse.json({ message: 'Business updated successfully', business: updated })

  } catch (error: unknown) {
    console.error('Error updating business:', error)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A business with this name already exists for this owner' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 })
  }
}

// DELETE — remove business
export async function DELETE(
  request: Request,
  { params }: Context
) {
  const { id: businessId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const existing = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        _count: {
          select: {
            monitoredOffers: true,
            payments: true,
            priceAdjustments: true,
            Feedback: true,
            offerDTOs: true
          }
        }
      }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    await prisma.business.delete({ where: { id: businessId } })

    return NextResponse.json({
      message: 'Business deleted successfully',
      deletedCounts: existing._count
    })

  } catch (error: unknown) {
    console.error('Error deleting business:', error)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      return NextResponse.json(
        { error: 'Cannot delete business due to existing references. Please contact support.' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 })
  }
}

// GET — fetch single business
export async function GET(
  request: Request,
  { params }: Context
) {
  const { id: businessId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        subscription: { include: { plan: true } },
        _count: {
          select: {
            monitoredOffers: true,
            payments: true,
            priceAdjustments: true,
            Feedback: true,
            offerDTOs: true
          }
        }
      }
    })
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json(business)

  } catch (error) {
    console.error('Error fetching business:', error)
    return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 })
  }
}
