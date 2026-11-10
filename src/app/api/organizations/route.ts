import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const organizations = await db.organization.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(organizations)
  } catch (error) {
    console.error('Organizations API error:', error)
    return NextResponse.json({ error: 'Unable to load organizations' }, { status: 500 })
  }
}
