export const DONATION_PURPOSES = [
  { value: 'scholarship', label: 'Student Scholarship' },
  { value: 'event', label: 'Event Sponsorship' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'welfare', label: 'Student Welfare' },
  { value: 'general', label: 'General Fund' },
  { value: 'idea_lab', label: 'Idea Lab' },
] as const

export const IDEA_LAB_PURPOSE = 'idea_lab'

export function getDonationPurposeLabel(value: string): string {
  return DONATION_PURPOSES.find((purpose) => purpose.value === value)?.label || value
}
