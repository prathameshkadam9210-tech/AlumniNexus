import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { UserGender } from '@/store/app-store'

interface UserAvatarProps {
  name: string
  avatar?: string | null
  gender?: UserGender | null
  className?: string
}

export function UserAvatar({ name, avatar, gender, className }: UserAvatarProps) {
  const isFemale = gender === 'FEMALE'
  const isMale = gender === 'MALE'
  const background = isFemale ? '#fce7f3' : isMale ? '#dbeafe' : '#d1fae5'
  const foreground = isFemale ? '#9d174d' : isMale ? '#1e40af' : '#047857'

  return (
    <Avatar className={className}>
      {avatar && <AvatarImage src={avatar} alt={`${name}'s profile`} />}
      <AvatarFallback aria-label={`${name}'s avatar`} className="overflow-hidden">
        <svg aria-hidden="true" viewBox="0 0 40 40" className="h-full w-full">
          <circle cx="20" cy="20" r="20" fill={background} />
          {isFemale && <path d="M9 35v-8c0-7 4-12 11-12s11 5 11 12v8h-4l-2-7H15l-2 7z" fill={foreground} />}
          {isMale && <path d="M11 17c0-7 3-11 9-11s9 4 9 11v4H11z" fill={foreground} />}
          <circle cx="20" cy="17" r="7" fill="#f0c7a5" />
          <path d="M8 40c1-8 5-12 12-12s11 4 12 12" fill={foreground} />
          {gender === 'NON_BINARY' && <circle cx="20" cy="17" r="9" fill="none" stroke={foreground} strokeWidth="1.5" />}
        </svg>
      </AvatarFallback>
    </Avatar>
  )
}
