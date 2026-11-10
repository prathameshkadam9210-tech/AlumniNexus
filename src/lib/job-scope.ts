import type { Prisma } from '@prisma/client'
import { getDepartmentAliases } from '@/lib/departments'
import { db } from '@/lib/db'

export async function getDepartmentJobScope(department: string): Promise<Prisma.JobWhereInput> {
  const departmentAliases = getDepartmentAliases(department)
  const opportunities = await db.placementOpportunity.findMany({
    where: {
      department: { in: departmentAliases },
      status: 'PUBLISHED',
    },
    select: { title: true, company: true },
  })

  return {
    OR: [
      { postedBy: { is: { department: { in: departmentAliases } } } },
      ...opportunities.map((opportunity) => ({
        AND: [
          { title: opportunity.title },
          { company: opportunity.company },
        ],
      })),
    ],
  }
}
