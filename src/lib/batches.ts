export interface BatchRecord {
  batch?: string | null
  graduationYear?: number | null
}

export const STUDY_YEAR_LABELS = ['F.Y.', 'S.Y.', 'T.Y.', 'B.Tech', 'Alumni', 'Year not recorded'] as const

function getBatchYears(batch: string | null | undefined): number[] {
  if (!batch) return []
  return (batch.match(/(?:19|20)\d{2}/g) || []).map(Number)
}

export function getStartYear(batch: string | null | undefined): number | null {
  return getBatchYears(batch)[0] ?? null
}

export function getGraduationYear(batch: string | null | undefined, graduationYear?: number | null): number | null {
  if (Number.isInteger(graduationYear) && graduationYear) return graduationYear
  const years = getBatchYears(batch)
  return years[years.length - 1] ?? null
}

export function getStudyYearLabel(
  record: BatchRecord & { role?: string | null },
  academicYearStart = new Date().getFullYear() - (new Date().getMonth() < 5 ? 1 : 0),
): typeof STUDY_YEAR_LABELS[number] | null {
  if (record.role === 'ALUMNI') return 'Alumni'
  if (record.role !== 'STUDENT') return null

  const intakeYear = getStartYear(record.batch)
  if (intakeYear === null) return 'Year not recorded'
  const yearOfStudy = academicYearStart - intakeYear
  if (yearOfStudy < 0) return 'Year not recorded'
  if (yearOfStudy === 0) return 'F.Y.'
  if (yearOfStudy === 1) return 'S.Y.'
  if (yearOfStudy === 2) return 'T.Y.'
  return 'B.Tech'
}

function getYearOptions(records: BatchRecord[], getRecordYear: (record: BatchRecord) => number | null, futureYears: number): number[] {
  const currentYear = new Date().getFullYear()
  const latestRecordYear = records.reduce((latest, record) => {
    const year = getRecordYear(record)
    return year ? Math.max(latest, year) : latest
  }, currentYear + futureYears)

  return Array.from({ length: latestRecordYear - 1992 + 1 }, (_, index) => 1992 + index)
}

export function getStartYearOptions(records: BatchRecord[] = []): number[] {
  return getYearOptions(records, (record) => getStartYear(record.batch), 4)
}

export function getGraduationYearOptions(records: BatchRecord[] = []): number[] {
  return getYearOptions(records, (record) => getGraduationYear(record.batch, record.graduationYear), 10)
}

export function matchesStartYear(record: BatchRecord, year: number): boolean {
  return getStartYear(record.batch) === year
}

export function matchesGraduationYear(record: BatchRecord, year: number): boolean {
  return getGraduationYear(record.batch, record.graduationYear) === year
}

type BatchFilter = {
  startYear?: number
  graduationYear?: number
}

type BatchYearClause =
  | { graduationYear: number }
  | { batch: string }
  | { batch: { contains: string } }

export function getBatchWhereFilter({ startYear, graduationYear }: BatchFilter): {
  AND: Array<{ OR: BatchYearClause[] }>
} {
  const clauses: Array<{ OR: BatchYearClause[] }> = []
  if (startYear) {
    clauses.push({
      OR: [
        { batch: `${startYear}` },
        { batch: { contains: `${startYear}-` } },
      ],
    })
  }
  if (graduationYear) {
    clauses.push({
      OR: [
        { graduationYear },
        { batch: `${graduationYear}` },
        { batch: { contains: `-${graduationYear}` } },
      ],
    })
  }
  return { AND: clauses }
}
