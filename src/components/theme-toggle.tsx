'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function subscribeToTheme(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener('alumninexus-theme-change', onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener('alumninexus-theme-change', onChange)
  }
}

function getThemeSnapshot() {
  const storedTheme = window.localStorage.getItem('theme')
  return storedTheme ? storedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getServerThemeSnapshot() {
  return false
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    window.localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggleTheme = () => {
    const nextDark = !dark
    document.documentElement.classList.toggle('dark', nextDark)
    window.localStorage.setItem('theme', nextDark ? 'dark' : 'light')
    window.dispatchEvent(new Event('alumninexus-theme-change'))
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{dark ? 'Light mode' : 'Dark mode'}</TooltipContent>
    </Tooltip>
  )
}