import { db } from '@/lib/db'
import { getDonationPurposeLabel, IDEA_LAB_PURPOSE } from '@/lib/donation-purposes'
import { NextRequest, NextResponse } from 'next/server'

const IDEA_LAB_GOAL_KEY = 'IDEA_LAB'

function getDonationPurpose(purpose: string | null, description: string): string {
  if (purpose) return purpose
  const legacyPurpose = description.match(/^Donation for ([^:]+)/i)?.[1]?.trim()
  return legacyPurpose || 'Unspecified'
}

export async function GET() {
  try {
    const [goal, donations] = await Promise.all([
      db.fundraisingGoal.findUnique({ where: { key: IDEA_LAB_GOAL_KEY } }),
      db.payment.findMany({
        where: { type: 'DONATION', status: 'COMPLETED' },
        select: { amount: true, purpose: true, description: true },
      }),
    ])

    const purposeTotals = new Map<string, number>()
    for (const donation of donations) {
      const purpose = getDonationPurpose(donation.purpose, donation.description)
      purposeTotals.set(purpose, (purposeTotals.get(purpose) || 0) + donation.amount)
    }

    const ideaLabRaised = purposeTotals.get(IDEA_LAB_PURPOSE) || 0
    return NextResponse.json({
      targetAmount: goal?.targetAmount || 0,
      ideaLabRaised,
      totalRaised: donations.reduce((total, donation) => total + donation.amount, 0),
      purposeTotals: Array.from(purposeTotals, ([purpose, amount]) => ({
        purpose,
        label: getDonationPurposeLabel(purpose),
        amount,
      })).sort((a, b) => a.label.localeCompare(b.label)),
    })
  } catch (error) {
    console.error('Fundraising summary error:', error)
    return NextResponse.json({ error: 'Unable to load fundraising summary' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { actorId, targetAmount } = await req.json()
    if (typeof actorId !== 'string') {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    const actor = await db.user.findUnique({
      where: { id: actorId },
      select: { role: true, department: true },
    })
    if (actor?.role !== 'ADMIN' || actor.department !== 'Administration') {
      return NextResponse.json({ error: 'Only the main admin can change the Idea Lab target' }, { status: 403 })
    }

    const amount = Number(targetAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Enter a target amount greater than zero' }, { status: 400 })
    }

    const goal = await db.fundraisingGoal.upsert({
      where: { key: IDEA_LAB_GOAL_KEY },
      create: { key: IDEA_LAB_GOAL_KEY, targetAmount: amount },
      update: { targetAmount: amount },
    })
    return NextResponse.json({ targetAmount: goal.targetAmount, updatedAt: goal.updatedAt.toISOString() })
  } catch (error) {
    console.error('Fundraising target update error:', error)
    return NextResponse.json({ error: 'Unable to update Idea Lab target' }, { status: 500 })
  }
}
