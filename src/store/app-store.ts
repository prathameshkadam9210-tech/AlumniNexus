import { create } from 'zustand'

// Types
export type UserRole = 'STUDENT' | 'ALUMNI' | 'RECRUITER' | 'ADMIN' | 'PLACEMENT_CELL'
export type ViewName = 'landing' | 'dashboard' | 'jobs' | 'job-detail' | 'mentorship' | 'events' | 'profile' | 'analytics' | 'ai-assistant' | 'applications' | 'alumni-directory' | 'resume-builder' | 'post-job' | 'manage-jobs' | 'candidate-search' | 'user-management' | 'notifications' | 'payments' | 'certificates'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string | null
  phone?: string | null
  bio?: string | null
  department?: string | null
  batch?: string | null
  graduationYear?: number | null
  company?: string | null
  designation?: string | null
  experience?: string | null
  location?: string | null
  skills?: string | null
  resumeUrl?: string | null
  linkedinUrl?: string | null
  gpa?: number | null
  isVerified: boolean
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  isOnline: boolean
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  code: string
  logo?: string | null
  website?: string | null
  city: string
  state: string
  isActive: boolean
  createdAt: string
}

export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salaryMin?: number | null
  salaryMax?: number | null
  currency: string
  description: string
  requirements: string
  skills?: string | null
  experienceRequired?: string | null
  postedById: string
  postedByName?: string
  status: string
  deadline?: string | null
  applicantsCount: number
  createdAt: string
}

export interface Application {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  jobId: string
  jobTitle?: string
  companyName?: string
  status: string
  coverLetter?: string | null
  createdAt: string
}

export interface Mentorship {
  id: string
  mentorId: string
  mentorName?: string
  menteeId: string
  menteeName?: string
  date: string
  timeSlot: string
  duration: number
  status: string
  topic?: string | null
  meetingLink?: string | null
  notes?: string | null
  createdAt: string
}

export interface EventItem {
  id: string
  title: string
  description: string
  date: string
  registrationDeadline?: string | null
  endTime?: string | null
  time?: string | null
  location?: string | null
  type: string
  organizerId: string
  organizerName?: string
  maxAttendees?: number | null
  currentAttendees: number
  image?: string | null
  isFeatured: boolean
  createdAt: string
}

export interface NotificationItem {
  id: string
  userId: string
  title: string
  message: string
  type: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

export interface AnalyticsData {
  id: string
  metric: string
  value: number
  label?: string | null
  period?: string | null
  year?: number | null
  month?: number | null
}

export interface Payment {
  id: string
  userId: string
  amount: number
  currency: string
  type: string
  status: string
  razorpayId?: string | null
  razorpayOrderId?: string | null
  description: string
  purpose?: string | null
  referenceId?: string | null
  createdAt: string
}

export interface Certificate {
  id: string
  userId: string
  title: string
  type: string
  description: string
  certificateHash: string
  txHash?: string | null
  issuedBy?: string | null
  issuedAt: string
  expiresAt?: string | null
  isVerified: boolean
  createdAt: string
}

export interface EventRegistration {
  id: string
  userId: string
  eventId: string
  status: string
  createdAt: string
  event?: EventItem
}

interface AppState {
  // Auth
  currentUser: User | null
  isAuthenticated: boolean
  users: User[]

  // Navigation
  currentView: ViewName
  selectedJobId: string | null
  selectedUserId: string | null

  // Data
  jobs: Job[]
  applications: Application[]
  mentorships: Mentorship[]
  events: EventItem[]
  notifications: NotificationItem[]
  analytics: AnalyticsData[]
  organizations: Organization[]
  payments: Payment[]
  certificates: Certificate[]
  registrations: EventRegistration[]

  // UI
  sidebarOpen: boolean
  searchQuery: string
  isLoading: boolean
  authError: string | null
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[]

  // Actions - Auth
  login: (email: string, password: string) => Promise<boolean>
  signup: (data: Partial<User> & { password: string }) => Promise<boolean>
  loadDataForUser?: (user: User) => Promise<void>
  logout: () => void
  setCurrentUser: (user: User | null) => void

  // Actions - Navigation
  setCurrentView: (view: ViewName) => void
  setSelectedJobId: (id: string | null) => void
  setSelectedUserId: (id: string | null) => void

  // Actions - Data
  setJobs: (jobs: Job[]) => void
  addJob: (job: Job) => void
  setApplications: (apps: Application[]) => void
  addApplication: (app: Application) => void
  updateApplication: (id: string, data: Partial<Application>) => void
  setMentorships: (m: Mentorship[]) => void
  addMentorship: (m: Mentorship) => void
  updateMentorship: (id: string, data: Partial<Mentorship>) => void
  setEvents: (e: EventItem[]) => void
  addEvent: (e: EventItem) => void
  setNotifications: (n: NotificationItem[]) => void
  addNotification: (n: NotificationItem) => void
  markNotificationRead: (id: string) => void
  setAnalytics: (a: AnalyticsData[]) => void
  setUsers: (u: User[]) => void
  updateUser: (id: string, data: Partial<User>) => void
  setOrganizations: (o: Organization[]) => void
  setPayments: (p: Payment[]) => void
  addPayment: (p: Payment) => void
  setCertificates: (c: Certificate[]) => void
  addCertificate: (c: Certificate) => void
  setRegistrations: (r: EventRegistration[]) => void

  // Actions - UI
  toggleSidebar: () => void
  setSearchQuery: (q: string) => void
  setLoading: (l: boolean) => void
  setAuthError: (message: string | null) => void
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  currentUser: null,
  isAuthenticated: false,
  users: [],
  currentView: 'landing',
  selectedJobId: null,
  selectedUserId: null,
  jobs: [],
  applications: [],
  mentorships: [],
  events: [],
  notifications: [],
  analytics: [],
  organizations: [],
  payments: [],
  certificates: [],
  registrations: [],
  sidebarOpen: false,
  searchQuery: '',
  isLoading: false,
  authError: null,
  toasts: [],

  // Auth Actions
  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })
      if (!res.ok) {
        const err = await res.json()
        const message = err.rejected
          ? 'Your account verification was rejected. Please contact your department admin.'
          : err.pendingApproval
            ? 'You cannot log in until your department admin or main admin verifies your account.'
          : err.notRegistered
            ? 'You are not registered. Please register first, then log in.'
            : err.needsVerification
              ? 'Please verify your email before logging in.'
              : err.error || 'Login failed'
        set({ authError: message })
        if (err.pendingApproval) {
          get().addToast(message, 'error')
        } else if (err.notRegistered) {
          get().addToast(message, 'error')
        } else if (err.needsVerification) {
          get().addToast(message, 'error')
        } else {
          get().addToast(message, 'error')
        }
        return false
      }
      const user = await res.json()
      set({ currentUser: user, isAuthenticated: true, currentView: 'dashboard', authError: null })
      // Load role-specific data
      get().loadDataForUser?.(user)
      get().addToast(`Welcome back, ${user.name}!`, 'success')
      return true
    } catch {
      set({ authError: 'Unable to reach the server. Please try again.' })
      get().addToast('Unable to reach the server. Please try again.', 'error')
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  signup: async (data) => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', ...data }),
      })
      if (!res.ok) {
        const err = await res.json()
        get().addToast(err.error || 'Signup failed', 'error')
        return false
      }
      const user = await res.json()
      set({ currentUser: user, isAuthenticated: true, currentView: 'dashboard' })
      get().addToast(`Welcome, ${user.name}! Account created.`, 'success')
      return true
    } catch {
      get().addToast('Signup failed', 'error')
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    set({
      currentUser: null,
      isAuthenticated: false,
      currentView: 'landing',
      jobs: [],
      applications: [],
      mentorships: [],
      events: [],
      notifications: [],
      analytics: [],
      organizations: [],
      payments: [],
      certificates: [],
      registrations: [],
    })
    get().addToast('Logged out successfully', 'info')
  },

  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),

  // Navigation Actions
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedJobId: (id) => set({ selectedJobId: id }),
  setSelectedUserId: (id) => set({ selectedUserId: id }),

  // Data Actions
  setJobs: (jobs) => set({ jobs }),
  addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs] })),
  setApplications: (apps) => set({ applications: apps }),
  addApplication: (app) => set((s) => ({ applications: [app, ...s.applications] })),
  updateApplication: (id, data) =>
    set((s) => ({
      applications: s.applications.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),
  setMentorships: (m) => set({ mentorships: m }),
  addMentorship: (m) => set((s) => ({ mentorships: [m, ...s.mentorships] })),
  updateMentorship: (id, data) =>
    set((s) => ({
      mentorships: s.mentorships.map((ms) => (ms.id === id ? { ...ms, ...data } : ms)),
    })),
  setEvents: (e) => set({ events: e }),
  addEvent: (e) => set((s) => ({ events: [e, ...s.events] })),
  setNotifications: (n) => set({ notifications: n }),
  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    })),
  setAnalytics: (a) => set({ analytics: a }),
  setUsers: (u) => set({ users: u }),
  updateUser: (id, data) =>
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
      currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...data } : s.currentUser,
    })),

  // New Data Actions
  setOrganizations: (o) => set({ organizations: o }),
  setPayments: (p) => set({ payments: p }),
  addPayment: (p) => set((s) => ({ payments: [p, ...s.payments] })),
  setCertificates: (c) => set({ certificates: c }),
  addCertificate: (c) => set((s) => ({ certificates: [c, ...s.certificates] })),
  setRegistrations: (r) => set({ registrations: r }),

  // UI Actions
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setLoading: (l) => set({ isLoading: l }),
  setAuthError: (message) => set({ authError: message }),
  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: Date.now().toString(), message, type }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Helper to load data for a user - defined outside create to avoid circular reference
declare module 'zustand' {
  interface StoreApi<T> {
    loadDataForUser: (user: User) => Promise<void>
  }
}

// We'll add loadDataForUser to the actions directly
(() => {
  const loadDataForUser = async (user: User) => {
    const state = useAppStore.getState()
    try {
      // Load jobs
      const jobsRes = await fetch('/api/jobs')
      if (jobsRes.ok) {
        const jobs = await jobsRes.json()
        state.setJobs(jobs)
      }

      // Load events
      const eventsRes = await fetch('/api/events')
      if (eventsRes.ok) {
        const events = await eventsRes.json()
        state.setEvents(events)
      }

      // Load notifications
      const notifRes = await fetch(`/api/events?action=notifications&userId=${user.id}`)
      if (notifRes.ok) {
        const notifs = await notifRes.json()
        state.setNotifications(notifs)
      }

      // Load payments for ALL roles
      const paymentsRes = await fetch(`/api/payments?userId=${user.id}`)
      if (paymentsRes.ok) {
        const payments = await paymentsRes.json()
        state.setPayments(payments)
      }

      // Load certificates for ALL roles
      const certsRes = await fetch(`/api/certificates?userId=${user.id}`)
      if (certsRes.ok) {
        const certs = await certsRes.json()
        state.setCertificates(certs)
      }

      // Load registrations for ALL roles
      const regsRes = await fetch(`/api/registrations?userId=${user.id}`)
      if (regsRes.ok) {
        const regs = await regsRes.json()
        state.setRegistrations(regs)
      }

      // Role-specific data
      if (user.role === 'STUDENT') {
        const appsRes = await fetch(`/api/applications?userId=${user.id}`)
        if (appsRes.ok) state.setApplications(await appsRes.json())

        const mentorRes = await fetch(`/api/mentorships?menteeId=${user.id}`)
        if (mentorRes.ok) state.setMentorships(await mentorRes.json())
      }

      if (user.role === 'ALUMNI') {
        const mentorRes = await fetch(`/api/mentorships?mentorId=${user.id}`)
        if (mentorRes.ok) state.setMentorships(await mentorRes.json())
      }

      if (user.role === 'RECRUITER') {
        const jobsRes2 = await fetch(`/api/jobs?postedById=${user.id}`)
        if (jobsRes2.ok) state.setJobs(await jobsRes2.json())

        const appsRes = await fetch(`/api/applications?recruiterId=${user.id}`)
        if (appsRes.ok) state.setApplications(await appsRes.json())

        const studentsRes = await fetch(`/api/auth?action=users&actorId=${encodeURIComponent(user.id)}`)
        if (studentsRes.ok) state.setUsers(await studentsRes.json())
      }

      if (user.role === 'ADMIN' || user.role === 'PLACEMENT_CELL') {
        const usersRes = await fetch(`/api/auth?action=users&actorId=${encodeURIComponent(user.id)}`)
        if (usersRes.ok) state.setUsers(await usersRes.json())

        const analyticsQuery = user.role === 'ADMIN' && user.department && user.department !== 'Administration'
          ? `?department=${encodeURIComponent(user.department)}`
          : ''
        const analyticsRes = await fetch(`/api/analytics${analyticsQuery}`)
        if (analyticsRes.ok) state.setAnalytics(await analyticsRes.json())

        // Load organizations for ADMIN/PLACEMENT_CELL
        const orgsRes = await fetch('/api/organizations')
        if (orgsRes.ok) state.setOrganizations(await orgsRes.json())
      }
    } catch (e) {
      console.error('Error loading data:', e)
    }
  }

  // Monkey-patch the login to also call loadDataForUser
  const origLogin = useAppStore.getState().login
  useAppStore.setState({
    login: async (email: string, password: string) => {
      const result = await origLogin(email, password)
      const user = useAppStore.getState().currentUser
      if (user && result) {
        await loadDataForUser(user)
      }
      return result
    },
    loadDataForUser,
  } as Partial<AppState>)
})()
