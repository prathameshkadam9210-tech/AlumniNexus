import { create } from 'zustand'

// Types
export type UserRole = 'STUDENT' | 'ALUMNI' | 'RECRUITER' | 'ADMIN' | 'PLACEMENT_CELL'
export type UserGender = 'FEMALE' | 'MALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY'
export type ViewName = 'landing' | 'dashboard' | 'jobs' | 'job-detail' | 'mentorship' | 'events' | 'profile' | 'analytics' | 'ai-assistant' | 'applications' | 'alumni-directory' | 'resume-builder' | 'post-job' | 'manage-jobs' | 'candidate-search' | 'user-management' | 'notifications' | 'payments' | 'certificates' | 'opportunities' | 'placements'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string | null
  gender?: UserGender | null
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
  finalYearResultUrl?: string | null
  alumniChoice?: string | null
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
  setJobs: (jobs) => {
    if (!Array.isArray(jobs)) {
      console.error('Invalid jobs response: expected an array')
      return
    }
    set({ jobs })
  },
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
      const load = async <T,>(url: string, setData: (data: T[]) => void) => {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Request failed for ${url}: ${response.status}`)
        const data = await response.json()
        if (!Array.isArray(data)) throw new Error(`Invalid response for ${url}: expected an array`)
        setData(data)
      }

      const jobsParams = new URLSearchParams({ actorId: user.id })
      if (user.role === 'RECRUITER') jobsParams.set('postedById', user.id)
      const tasks = [
        load(`/api/jobs?${jobsParams.toString()}`, state.setJobs),
        load('/api/events', state.setEvents),
        load(`/api/events?action=notifications&userId=${encodeURIComponent(user.id)}`, state.setNotifications),
        load(`/api/payments?userId=${encodeURIComponent(user.id)}`, state.setPayments),
        load(`/api/certificates?userId=${encodeURIComponent(user.id)}`, state.setCertificates),
        load(`/api/registrations?userId=${encodeURIComponent(user.id)}`, state.setRegistrations),
      ]

      if (user.role === 'STUDENT') {
        tasks.push(
          load(`/api/applications?actorId=${encodeURIComponent(user.id)}`, state.setApplications),
          load(`/api/mentorships?menteeId=${encodeURIComponent(user.id)}`, state.setMentorships),
        )
      }

      if (user.role === 'ALUMNI') {
        tasks.push(load(`/api/mentorships?mentorId=${encodeURIComponent(user.id)}`, state.setMentorships))
      }

      if (user.role === 'ADMIN' || user.role === 'PLACEMENT_CELL') {
        const analyticsParams = new URLSearchParams({ actorId: user.id })
        if (user.role === 'ADMIN' && user.department && user.department !== 'Administration') {
          analyticsParams.set('department', user.department)
        }
        tasks.push(
          load(`/api/applications?actorId=${encodeURIComponent(user.id)}`, state.setApplications),
          load(`/api/auth?action=users&actorId=${encodeURIComponent(user.id)}`, state.setUsers),
          load(`/api/analytics?${analyticsParams}`, state.setAnalytics),
          load('/api/organizations', state.setOrganizations),
        )
      }

      await Promise.all(tasks)
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
