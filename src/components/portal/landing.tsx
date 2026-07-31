'use client'

import { useState } from 'react'
import { useAppStore, type UserRole } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
  import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Briefcase,
  Users,
  Brain,
  Network,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Loader2,
  BookOpen,
} from 'lucide-react'

const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: 'Student',
  ALUMNI: 'Alumni',
  RECRUITER: 'Recruiter',
  ADMIN: 'Admin',
  PLACEMENT_CELL: 'Placement Cell',
}

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Jobs & Internships',
    description:
      'Discover curated job opportunities and internships from top companies, filtered by your skills and interests.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Users,
    title: 'Mentorship',
    description:
      'Connect with experienced alumni mentors who guide you through career decisions, interview prep, and more.',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    icon: Brain,
    title: 'AI Career Guidance',
    description:
      'Get personalized career recommendations, resume feedback, and interview coaching powered by AI.',
    gradient: 'from-cyan-500 to-emerald-600',
  },
  {
    icon: Network,
    title: 'Alumni Network',
    description:
      'Build lasting connections with a thriving community of graduates across industries worldwide.',
    gradient: 'from-emerald-600 to-cyan-500',
  },
]

const DEMO_ACCOUNTS = [
  { role: 'STUDENT' as UserRole, email: 'aditya@student.edu', password: 'demo', label: 'Student', color: 'bg-emerald-600 hover:bg-emerald-500' },
  { role: 'ALUMNI' as UserRole, email: 'rahul@alumni.edu', password: 'demo', label: 'Alumni', color: 'bg-teal-600 hover:bg-teal-500' },
  { role: 'RECRUITER' as UserRole, email: 'hr@tcs.com', password: 'demo', label: 'Recruiter', color: 'bg-cyan-600 hover:bg-cyan-500' },
  { role: 'ADMIN' as UserRole, email: 'admin@alumniportal.com', password: 'admin', label: 'Admin', color: 'bg-emerald-700 hover:bg-emerald-600' },
]

export function LandingPage() {
  const login = useAppStore((s) => s.login)
  const signup = useAppStore((s) => s.signup)
  const isLoading = useAppStore((s) => s.isLoading)

  const [authOpen, setAuthOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginRole, setLoginRole] = useState<UserRole>('STUDENT')

  // Register form state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<UserRole>('STUDENT')
  const [regDepartment, setRegDepartment] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regSkills, setRegSkills] = useState('')

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      useAppStore.getState().addToast('Please fill in all fields', 'error')
      return
    }
    const ok = await login(loginEmail, loginPassword)
    if (ok) setAuthOpen(false)
  }

  const handleRegister = async () => {
    if (!regName || !regEmail || !regPassword) {
      useAppStore.getState().addToast('Please fill in required fields', 'error')
      return
    }
    const ok = await signup({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      department: regDepartment || undefined,
      phone: regPhone || undefined,
      skills: regSkills || undefined,
    })
    if (ok) setAuthOpen(false)
  }

  const handleDemoLogin = async (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    setAuthOpen(false)
    await login(demo.email, demo.password)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 px-4 py-20 md:py-28">
        {/* Decorative background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-400/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-100 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Career Platform
          </div>

          {/* Portal Name */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            Alumni<span className="text-emerald-300">Portal</span>
          </h1>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-emerald-100/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            Connecting Students, Alumni, Industry, and Opportunities Through AI
          </p>

          {/* College Name */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 mb-10">
            <GraduationCap className="w-5 h-5 text-emerald-300" />
            <span className="text-emerald-100/90 text-sm md:text-base font-medium">
              Dr. J. J. Magdum College of Engineering, Jaysingpur
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-6 text-base shadow-lg shadow-emerald-500/25 transition-all"
              onClick={() => {
                setActiveTab('login')
                setAuthOpen(true)
              }}
            >
              Get Started
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white px-8 py-6 text-base backdrop-blur-sm transition-all"
              onClick={() => {
                setActiveTab('register')
                setAuthOpen(true)
              }}
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A comprehensive platform designed to bridge the gap between academia and industry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                className="group border-border/50 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
              >
                <CardHeader className="pb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="bg-muted/40 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-600 uppercase tracking-wider">
              Quick Demo
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Try It Out Instantly
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Click any button below to log in as a demo user and explore the portal.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {DEMO_ACCOUNTS.map((demo) => (
              <Button
                key={demo.role}
                variant="outline"
                className={`${demo.color} text-white border-0 font-medium px-6`}
                onClick={() => handleDemoLogin(demo)}
              >
                {demo.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-muted-foreground py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <p>&copy; {new Date().getFullYear()} AlumniPortal &mdash; Dr. J. J. Magdum College of Engineering, Jaysingpur</p>
          <p>Built with AI</p>
        </div>
      </footer>

      {/* Auth Dialog */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {activeTab === 'login'
                ? 'Sign in to your AlumniPortal account'
                : 'Join the AlumniPortal community today'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-role">Role</Label>
                <Select value={loginRole} onValueChange={(v) => setLoginRole(v as UserRole)}>
                  <SelectTrigger id="login-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-500"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Login
              </Button>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register" className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Full Name *</Label>
                <Input
                  id="reg-name"
                  placeholder="John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password *</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Create a password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-role">Role</Label>
                <Select value={regRole} onValueChange={(v) => setRegRole(v as UserRole)}>
                  <SelectTrigger id="reg-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-department">Department</Label>
                <Input
                  id="reg-department"
                  placeholder="Computer Science"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-phone">Phone</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-skills">Skills</Label>
                <Textarea
                  id="reg-skills"
                  placeholder="React, Python, Machine Learning..."
                  value={regSkills}
                  onChange={(e) => setRegSkills(e.target.value)}
                  rows={2}
                />
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-500"
                onClick={handleRegister}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Register
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
