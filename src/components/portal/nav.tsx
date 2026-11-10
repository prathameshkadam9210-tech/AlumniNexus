'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAppStore, type ViewName, type UserRole } from '@/store/app-store'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/portal/user-avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  Briefcase,
  Users,
  GraduationCap,
  Brain,
  Calendar,
  FileText,
  UserPlus,
  BarChart3,
  Building,
  CreditCard,
  Award,
  Lightbulb,
  ClipboardCheck,
} from 'lucide-react'
import {
  UserManagementView,
  AnalyticsView,
  PaymentsView,
  CertificatesView,
  NotificationsView,
} from '@/components/portal/admin-views'
import { OpportunityView } from '@/components/portal/opportunities'
import { PlacementsView } from '@/components/portal/placements'
interface NavItem {
  label: string
  view: ViewName
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard, roles: ['STUDENT', 'ALUMNI', 'RECRUITER', 'ADMIN', 'PLACEMENT_CELL'] },
  { label: 'Jobs & Internships', view: 'jobs', icon: Briefcase, roles: ['STUDENT', 'ALUMNI', 'RECRUITER', 'ADMIN', 'PLACEMENT_CELL'] },
  { label: 'Events', view: 'events', icon: Calendar, roles: ['STUDENT', 'ALUMNI', 'RECRUITER', 'ADMIN', 'PLACEMENT_CELL'] },
  { label: 'Profile', view: 'profile', icon: User, roles: ['STUDENT', 'ALUMNI', 'RECRUITER', 'ADMIN', 'PLACEMENT_CELL'] },
  { label: 'My Applications', view: 'applications', icon: FileText, roles: ['STUDENT'] },
  { label: 'Manage Applications', view: 'applications', icon: FileText, roles: ['PLACEMENT_CELL'] },
  { label: 'Mentorship', view: 'mentorship', icon: Users, roles: ['STUDENT', 'ALUMNI'] },
  { label: 'Career Opportunities', view: 'opportunities', icon: Lightbulb, roles: ['ALUMNI', 'RECRUITER', 'PLACEMENT_CELL'] },
  { label: 'Placement Outcomes', view: 'placements', icon: ClipboardCheck, roles: ['ADMIN', 'PLACEMENT_CELL'] },
  { label: 'Resume Builder', view: 'resume-builder', icon: GraduationCap, roles: ['STUDENT'] },
  { label: 'AI Assistant', view: 'ai-assistant', icon: Brain, roles: ['STUDENT'] },
  { label: 'Alumni Directory', view: 'alumni-directory', icon: Building, roles: ['ALUMNI', 'PLACEMENT_CELL'] },
  { label: 'Post Job', view: 'post-job', icon: UserPlus, roles: ['PLACEMENT_CELL'] },
  { label: 'Manage Jobs', view: 'manage-jobs', icon: Briefcase, roles: ['PLACEMENT_CELL'] },
  { label: 'Payments', view: 'payments', icon: CreditCard, roles: ['STUDENT', 'ALUMNI', 'ADMIN'] },
  { label: 'Certificates', view: 'certificates', icon: Award, roles: ['STUDENT', 'ALUMNI', 'ADMIN', 'PLACEMENT_CELL'] },
  { label: 'Notifications', view: 'notifications', icon: Bell, roles: ['STUDENT', 'ALUMNI', 'RECRUITER', 'ADMIN', 'PLACEMENT_CELL'] },
  { label: 'User Management', view: 'user-management', icon: Users, roles: ['ADMIN'] },
  { label: 'Analytics', view: 'analytics', icon: BarChart3, roles: ['ADMIN', 'PLACEMENT_CELL'] },
]

const VIEW_LABELS: Record<ViewName, string> = {
  landing: 'Landing',
  dashboard: 'Dashboard',
  jobs: 'Jobs & Internships',
  'job-detail': 'Job Detail',
  mentorship: 'Mentorship',
  events: 'Events',
  profile: 'Profile',
  analytics: 'Analytics',
  'ai-assistant': 'AI Assistant',
  applications: 'My Applications',
  'alumni-directory': 'Alumni Directory',
  'resume-builder': 'Resume Builder',
  'post-job': 'Post Job',
  'manage-jobs': 'Manage Jobs',
  'candidate-search': 'Candidate Search',
  'user-management': 'User Management',
  notifications: 'Notifications',
  payments: 'Payments',
  certificates: 'Certificates',
  opportunities: 'Career Opportunities',
  placements: 'Placement Outcomes',
}

// Dynamic view component that loads the real module or shows a loading spinner
type DynamicViewRenderer = (view?: ViewName) => React.ReactNode

function DynamicView({ name, importFn, view }: { name: string; importFn: () => Promise<DynamicViewRenderer>; view?: ViewName }) {
  const [renderView, setRenderView] = useState<DynamicViewRenderer | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    importFn()
      .then((renderer) => setRenderView(() => renderer))
      .catch((error: unknown) => console.error(`Unable to load ${name}:`, error))
      .finally(() => setLoaded(true))
  }, [importFn, name])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!renderView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold">Unable to load module</h3>
            <p className="text-muted-foreground">
              The <span className="font-medium text-foreground">{name}</span> module could not be loaded. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return renderView(view)
}

function ViewRouter() {
  const currentView = useAppStore((s) => s.currentView)

  switch (currentView) {
    case 'dashboard':
      return <DynamicView name="Dashboard" importFn={() => import('@/components/portal/dashboard').then(({ DashboardView }) => () => <DashboardView />)} />
    case 'jobs':
      return <DynamicView name="Jobs & Internships" importFn={() => import('@/components/portal/jobs').then(({ JobsView }) => () => <JobsView />)} />
    case 'mentorship':
      return <DynamicView name="Mentorship" importFn={() => import('@/components/portal/mentorship').then(({ MentorshipView }) => () => <MentorshipView />)} />
    case 'profile':
      return <DynamicView name="Profile" importFn={() => import('@/components/portal/profile').then(({ ProfileView }) => (selectedView) => <ProfileView view={selectedView === 'resume-builder' ? 'resume-builder' : 'profile'} />)} />
    case 'ai-assistant':
      return <DynamicView name="AI Assistant" importFn={() => import('@/components/portal/ai-assistant').then(({ AIAssistantView }) => () => <AIAssistantView />)} />
    case 'events':
      return <DynamicView name="Events" importFn={() => import('@/components/portal/events').then(({ EventsView }) => (selectedView) => <EventsView view={selectedView === 'notifications' ? 'notifications' : 'events'} />)} />
    case 'user-management':
      return <UserManagementView />
    case 'analytics':
      return <AnalyticsView />
    case 'payments':
      return <PaymentsView />
    case 'certificates':
      return <CertificatesView />
    case 'opportunities':
      return <OpportunityView />
    case 'placements':
      return <PlacementsView />
    case 'notifications':
      return <NotificationsView />
    case 'job-detail':
      return <DynamicView name="Job Detail" importFn={() => import('@/components/portal/jobs').then(({ JobsView }) => () => <JobsView />)} />
    case 'applications':
      return <DynamicView name="Applications" importFn={() => import('@/components/portal/jobs').then(({ JobsView }) => () => <JobsView />)} />
    case 'post-job':
      return <DynamicView name="Post Job" importFn={() => import('@/components/portal/jobs').then(({ JobsView }) => () => <JobsView />)} />
    case 'manage-jobs':
      return <DynamicView name="Manage Jobs" importFn={() => import('@/components/portal/jobs').then(({ JobsView }) => () => <JobsView />)} />
    case 'candidate-search':
      return <DynamicView name="Candidate Search" importFn={() => import('@/components/portal/jobs').then(({ JobsView }) => () => <JobsView />)} />
    case 'alumni-directory':
      return <DynamicView name="Alumni Directory" importFn={() => import('@/components/portal/mentorship').then(({ MentorshipView }) => () => <MentorshipView />)} />
    case 'resume-builder':
      return <DynamicView name="Resume Builder" importFn={() => import('@/components/portal/profile').then(({ ProfileView }) => (selectedView) => <ProfileView view={selectedView === 'resume-builder' ? 'resume-builder' : 'profile'} />)} view="resume-builder" />
    default:
      return <DynamicView name={VIEW_LABELS[currentView] || currentView} importFn={() => import('@/components/portal/dashboard').then(({ DashboardView }) => () => <DashboardView />)} />
  }
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const currentUser = useAppStore((s) => s.currentUser)
  const currentView = useAppStore((s) => s.currentView)
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  if (!currentUser) return null

  const role = currentUser.role
  const filteredItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  const handleNav = (view: ViewName) => {
    setCurrentView(view)
    onNavigate?.()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-sm text-foreground truncate">AlumniNexus</h2>
          <p className="text-xs text-muted-foreground truncate">JJMCOE, Jaysingpur</p>
        </div>
      </div>

      <Separator />

      {/* Nav Items */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const isActive = currentView === item.view
            const Icon = item.icon
            return (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                  ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User Info at bottom */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={currentUser.name}
            avatar={currentUser.avatar}
            gender={currentUser.gender}
            className="h-8 w-8"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppShell() {
  const currentUser = useAppStore((s) => s.currentUser)
  const notifications = useAppStore((s) => s.notifications)
  const currentView = useAppStore((s) => s.currentView)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const setCurrentView = useAppStore((s) => s.setCurrentView)
  const logout = useAppStore((s) => s.logout)

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const navigateAndClose = useCallback((view: ViewName) => {
    setCurrentView(view)
    setMobileSheetOpen(false)
  }, [setCurrentView])

  const handleNotificationClick = () => {
    navigateAndClose('notifications')
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center h-full px-4 gap-3">
          {/* Mobile Hamburger */}
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent onNavigate={() => setMobileSheetOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Logo (mobile only) */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">AlumniNexus</span>
          </div>

          {/* Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs, events, people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="flex-1 sm:hidden" />

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={handleNotificationClick}
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <UserAvatar
                    name={currentUser.name}
                    avatar={currentUser.avatar}
                    gender={currentUser.gender}
                    className="h-8 w-8"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigateAndClose('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateAndClose('profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:border-r bg-background">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            <ViewRouter />
          </div>
        </main>
      </div>
    </div>
  )
}