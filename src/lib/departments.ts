export const DEPARTMENTS = [
  'Computer Science and Engineering(CSE)',
  'Information Technology(IT)',
  'Artificial Intelligence and Data Science (AIDS)',
  'Electronics and Telecommunication (ENTC)',
  'Mechanical Engineering (MECH)',
  'Civil Engineering (CE)',
  'Master in Computer Application (MCA)',
] as const

export type Department = (typeof DEPARTMENTS)[number]

const DEPARTMENT_ALIASES: Record<Department, string[]> = {
  'Computer Science and Engineering(CSE)': [
    'Computer Science and Engineering(CSE)',
    'Computer Science and Engineering (CSE)',
    'Computer Science and Engineering',
    'Computer Science (CSE)',
    'Computer Science',
    'CSE',
  ],
  'Information Technology(IT)': [
    'Information Technology(IT)',
    'Information Technology (IT)',
    'Information Technology',
    'IT',
  ],
  'Artificial Intelligence and Data Science (AIDS)': [
    'Artificial Intelligence and Data Science (AIDS)',
    'Artificial Intelligence and Data Science(AIDS)',
    'Artificial Intelligence and Data Science',
    'Artificial Intelligence and Machine Learning',
    'Artificial Intelligence & Data Science',
    'AI and ML',
    'AI & ML',
    'AIML',
    'ALDS',
    'AIDS',
  ],
  'Electronics and Telecommunication (ENTC)': [
    'Electronics and Telecommunication (ENTC)',
    'Electronics and Telecommunication(ENTC)',
    'Electronics and Telecommunication',
    'ENTC',
  ],
  'Mechanical Engineering (MECH)': [
    'Mechanical Engineering (MECH)',
    'Mechanical Engineering(MECH)',
    'Mechanical Engineering',
    'MECH',
  ],
  'Civil Engineering (CE)': [
    'Civil Engineering (CE)',
    'Civil Engineering(CE)',
    'Civil Engineering',
    'CE',
  ],
  'Master in Computer Application (MCA)': [
    'Master in Computer Application (MCA)',
    'Master in Computer Application(MCA)',
    'Master in Computer Application',
    'MCA',
  ],
}

const aliasToDepartment = new Map<string, Department>(
  Object.entries(DEPARTMENT_ALIASES).flatMap(([department, aliases]) =>
    aliases.map((alias) => [alias.trim().toLowerCase(), department as Department] as const),
  ),
)

export function normalizeDepartment(department: string | null | undefined): string | null | undefined {
  if (department == null) return department
  const trimmedDepartment = department.trim()
  return aliasToDepartment.get(trimmedDepartment.toLowerCase()) ?? trimmedDepartment
}

export function getDepartmentChartLabel(department: string | null | undefined): string {
  const normalizedDepartment = normalizeDepartment(department)
  if (!normalizedDepartment) return 'Unspecified'

  const abbreviation = normalizedDepartment.match(/\(([^)]+)\)\s*$/)?.[1]
  if (abbreviation) return abbreviation

  const initials = normalizedDepartment
    .split(/[\s&-]+/)
    .filter((word) => word && !['and', 'of', 'in', 'for'].includes(word.toLowerCase()))
    .map((word) => word[0].toUpperCase())
    .join('')
  return initials || normalizedDepartment
}

export function getDepartmentAliases(department: string): string[] {
  const normalizedDepartment = normalizeDepartment(department)
  if (!normalizedDepartment) return [department]
  const canonicalDepartment = normalizedDepartment as Department
  return DEPARTMENT_ALIASES[canonicalDepartment] ?? [normalizedDepartment]
}