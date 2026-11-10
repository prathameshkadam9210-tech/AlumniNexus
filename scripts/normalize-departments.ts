import { PrismaClient } from '@prisma/client'
import { DEPARTMENTS, getDepartmentAliases } from '../src/lib/departments'

const db = new PrismaClient()

async function normalizeDepartments() {
  let updatedUsers = 0

  for (const department of DEPARTMENTS) {
    const aliases = getDepartmentAliases(department).filter((alias) => alias !== department)
    if (aliases.length === 0) continue

    const result = await db.user.updateMany({
      where: { department: { in: aliases } },
      data: { department },
    })
    updatedUsers += result.count
  }

  const aidsAdminEmail = 'aidsadmin@jjmcoe.ac.in'
  const oldAIMLAdminEmail = 'aimladmin@jjmcoe.ac.in'
  const aidsAdmin = await db.user.findUnique({ where: { email: aidsAdminEmail } })
  const oldAIMLAdmin = aidsAdmin
    ? null
    : await db.user.findUnique({ where: { email: oldAIMLAdminEmail } })
  const aidsAdminData = {
    email: aidsAdminEmail,
    name: 'AIDS Department Admin',
    role: 'ADMIN',
    department: 'Artificial Intelligence and Data Science (AIDS)',
    isVerified: true,
    emailVerified: true,
  }

  if (aidsAdmin) {
    await db.user.update({ where: { id: aidsAdmin.id }, data: aidsAdminData })
  } else if (oldAIMLAdmin) {
    await db.user.update({ where: { id: oldAIMLAdmin.id }, data: { ...aidsAdminData, password: 'aids123' } })
  } else {
    await db.user.create({ data: { ...aidsAdminData, password: 'aids123' } })
  }

  console.log(`Normalized department names for ${updatedUsers} user records.`)
  console.log(`AIDS department admin is ready: ${aidsAdminEmail}`)
}

normalizeDepartments()
  .catch((error: unknown) => {
    console.error('Department normalization failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
