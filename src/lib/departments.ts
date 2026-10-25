export const DEPARTMENTS = [
  'Computer Science and Engineering (CSE)',
  'Information Technology (IT)',
  'Artificial Intelligence and Data Science (AIDS)',
  'Electronics and Telecommunication (ENTC)',
  'Mechanical Engineering (MECH)',
  'Civil Engineering (CE)',
  'Master in Computer Application (MCA)',
] as const

export type Department = (typeof DEPARTMENTS)[number]

const DEPARTMENT_ALIASES: Record<Department, readonly string[]> = {
  'Computer Science and Engineering (CSE)': [
    'Computer Science and Engineering',
    'Computer Science',
  ],
  'Information Technology (IT)': ['Information Technology'],
  'Artificial Intelligence and Data Science (AIDS)': [
    'Artificial Intelligence and Data Science',
    'Artificial Intelligence and Machine Learning (AILM)',
    'Artificial Intelligence and Machine Learning ((AILM)',
  ],
  'Electronics and Telecommunication (ENTC)': ['Electronics and Telecommunication'],
  'Mechanical Engineering (MECH)': ['Mechanical Engineering'],
  'Civil Engineering (CE)': ['Civil Engineering'],
  'Master in Computer Application (MCA)': [
    'Master in Computer Application',
    'Master of Computer Applications',
  ],
}

const CANONICAL_DEPARTMENT_BY_NAME = new Map<string, Department>(
  DEPARTMENTS.flatMap((department) =>
    [department, ...DEPARTMENT_ALIASES[department]].map((name) => [name.trim().toLowerCase(), department])
  )
)

function isDepartment(department: string): department is Department {
  return DEPARTMENTS.some((candidate) => candidate === department)
}

export function getCanonicalDepartment(department: string | null | undefined): string | null {
  if (!department) return null
  const trimmedDepartment = department.trim()
  return CANONICAL_DEPARTMENT_BY_NAME.get(trimmedDepartment.toLowerCase()) ?? trimmedDepartment
}

export function getDepartmentAliases(department: string): string[] {
  const canonicalDepartment = getCanonicalDepartment(department)
  if (!canonicalDepartment || !isDepartment(canonicalDepartment)) {
    return [department]
  }

  return [canonicalDepartment, ...DEPARTMENT_ALIASES[canonicalDepartment]]
}