'use client'

import { useState, useRef } from 'react'
import { useAppStore, type UserRole } from '@/store/app-store'
import { DEPARTMENTS } from '@/lib/departments'
import { ThemeToggle } from '@/components/theme-toggle'
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
  Mail,
  Key,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react'

const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: 'Student',
  ALUMNI: 'Alumni',
  RECRUITER: 'Recruiter',
  ADMIN: 'Admin',
  PLACEMENT_CELL: 'Placement Cell',
}

const VALID_DOMAIN = '@jjmcoe.ac.in'

const FEATURES = [
  { icon: Briefcase, title: 'Jobs & Internships', description: 'Discover curated job opportunities and internships from top companies.', gradient: 'from-emerald-500 to-teal-600' },
  { icon: Users, title: 'Mentorship', description: 'Connect with experienced alumni mentors for career guidance.', gradient: 'from-teal-500 to-cyan-600' },
  { icon: Brain, title: 'AI Career Guidance', description: 'Get personalized career recommendations powered by AI.', gradient: 'from-cyan-500 to-emerald-600' },
  { icon: Network, title: 'Alumni Network', description: 'Build lasting connections with graduates worldwide.', gradient: 'from-emerald-600 to-cyan-500' },
]

const DEMO_ACCOUNTS = [
  { role: 'STUDENT' as UserRole, email: 'aditya.shinde@jjmcoe.ac.in', password: 'demo123', label: 'Student', color: 'bg-emerald-600 hover:bg-emerald-500' },
  { role: 'ALUMNI' as UserRole, email: 'rahul.pawar@jjmcoe.ac.in', password: 'demo123', label: 'Alumni', color: 'bg-teal-600 hover:bg-teal-500' },
  { role: 'RECRUITER' as UserRole, email: 'hr@tcs.com', password: 'demo123', label: 'Recruiter', color: 'bg-cyan-600 hover:bg-cyan-500' },
  { role: 'ADMIN' as UserRole, email: 'admin@jjmcoe.ac.in', password: 'admin123', label: 'Admin', color: 'bg-emerald-700 hover:bg-emerald-600' },
]

type AuthView = 'main' | 'verify-email' | 'forgot-password' | 'reset-password' | 'verification-success'

export function LandingPage() {
  const login = useAppStore((s) => s.login)
  const signup = useAppStore((s) => s.signup)
  const isLoading = useAppStore((s) => s.isLoading)
  const authError = useAppStore((s) => s.authError)
  const setAuthError = useAppStore((s) => s.setAuthError)
  const addToast = useAppStore((s) => s.addToast)

  const [authOpen, setAuthOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [authView, setAuthView] = useState<AuthView>('main')

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<UserRole>('STUDENT')
  const [regDepartment, setRegDepartment] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regSkills, setRegSkills] = useState('')

  // OTP Verification
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [verifyEmail, setVerifyEmail] = useState('')
  const [pendingUser, setPendingUser] = useState<{ name: string; email: string; password: string; role: string } | null>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtpDigits, setForgotOtpDigits] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const forgotRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleOtpChange = (index: number, value: string, isForgot = false) => {
    const setter = isForgot ? setForgotOtpDigits : setOtpDigits
    const digits = isForgot ? [...forgotOtpDigits] : [...otpDigits]

    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('')
      for (let i = 0; i < pasted.length && index + i < 6; i++) {
        digits[index + i] = pasted[i]
      }
      setter(digits)
      const nextIdx = Math.min(index + pasted.length, 5)
      const refs = isForgot ? forgotRefs : otpRefs
      refs.current[nextIdx]?.focus()
      return
    }

    if (/\d/.test(value) || value === '') {
      digits[index] = value
      setter(digits)
      if (value && index < 5) {
        const refs = isForgot ? forgotRefs : otpRefs
        refs.current[index + 1]?.focus()
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent, isForgot = false) => {
    if (e.key === 'Backspace' && !isForgot ? !otpDigits[index] : !forgotOtpDigits[index]) {
      if (index > 0) {
        const refs = isForgot ? forgotRefs : otpRefs
        refs.current[index - 1]?.focus()
      }
    }
  }

  const needsCollegeEmail = (role: UserRole) => role === 'STUDENT' || role === 'ALUMNI'

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      addToast('Please fill in all fields', 'error')
      return
    }
    setAuthError(null)
    const ok = await login(loginEmail, loginPassword)
    if (ok) setAuthOpen(false)
  }

  const handleRegister = async () => {
    if (!regName || !regEmail || !regPassword) {
      addToast('Please fill in required fields (Name, Email, Password)', 'error')
      return
    }
    if (needsCollegeEmail(regRole) && !regEmail.toLowerCase().endsWith(VALID_DOMAIN)) {
      addToast(`Students and Alumni must use college email ending with ${VALID_DOMAIN}`, 'error')
      return
    }
    if (regPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error')
      return
    }

    // If college email, show OTP verification after registration
    if (needsCollegeEmail(regRole)) {
      // First create account (backend sends OTP)
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', name: regName, email: regEmail, password: regPassword, role: regRole, department: regDepartment, phone: regPhone, skills: regSkills }),
      })
      if (res.ok) {
        const data = await res.json()
        setPendingUser({ name: regName, email: regEmail, password: regPassword, role: regRole })
        setVerifyEmail(regEmail)
        setOtpDigits(['', '', '', '', '', ''])
        setOtpError('')
        setAuthView('verify-email')
        if (data.demoOTP) {
          addToast(`Demo OTP: ${data.demoOTP}`, 'info')
        }
      } else {
        const err = await res.json()
        addToast(err.error || 'Registration failed', 'error')
        setAuthView('main')
      }
      return
    }

    const ok = await signup({
      name: regName, email: regEmail, password: regPassword, role: regRole,
      department: regDepartment || undefined, phone: regPhone || undefined, skills: regSkills || undefined,
    })
    if (ok) setAuthOpen(false)
  }

  const handleVerifyOtp = async (isForgot = false) => {
    const digits = isForgot ? forgotOtpDigits : otpDigits
    const otp = digits.join('')
    if (otp.length !== 6) {
      setOtpError('Please enter all 6 digits')
      return
    }

    setOtpLoading(true)
    setOtpError('')

    try {
      if (isForgot) {
        if (!newPassword || newPassword.length < 6) {
          setOtpError('Password must be at least 6 characters')
          setOtpLoading(false)
          return
        }
        if (newPassword !== confirmPassword) {
          setOtpError('Passwords do not match')
          setOtpLoading(false)
          return
        }
        const res = await fetch('/api/auth/forgot-password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail, otp, newPassword }),
        })
        if (res.ok) {
          addToast('Password reset successfully! You can now login.', 'success')
          setAuthView('main')
          setActiveTab('login')
        } else {
          const err = await res.json()
          setOtpError(err.error || 'Verification failed')
        }
      } else {
        const res = await fetch('/api/auth/verify-email', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: verifyEmail, otp }),
        })
        if (res.ok) {
          if (pendingUser) {
            setAuthView('verification-success')
          } else {
            setAuthView('verification-success')
          }
        } else {
          const err = await res.json()
          setOtpError(err.error || 'Invalid OTP')
        }
      }
    } catch {
      setOtpError('Network error. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleSendOtp = async (email: string, isForgot = false) => {
    setOtpLoading(true)
    setOtpError('')
    try {
      const endpoint = isForgot ? '/api/auth/forgot-password' : '/api/auth/verify-email'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        const data = await res.json()
        addToast(
          data.demoOTP ? `Demo OTP: ${data.demoOTP}` : data.message || 'OTP sent to your email.',
          'info'
        )
      } else {
        const err = await res.json()
        setOtpError(err.error || 'Failed to send OTP')
      }
    } catch {
      setOtpError('Network error')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      addToast('Please enter your email', 'error')
      return
    }
    setAuthView('reset-password')
    setForgotOtpDigits(['', '', '', '', '', ''])
    setNewPassword('')
    setConfirmPassword('')
    setOtpError('')
    await handleSendOtp(forgotEmail, true)
  }

  const handleDemoLogin = async (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    setAuthOpen(false)
    await login(demo.email, demo.password)
  }

  const resetToMain = () => {
    setAuthView('main')
    setOtpError('')
    setOtpDigits(['', '', '', '', '', ''])
    setForgotOtpDigits(['', '', '', '', '', ''])
    setPendingUser(null)
  }

  const renderOtpInputs = (digits: string[], isForgot: boolean) => (
    <div className="flex justify-center gap-2 my-4">
      {digits.map((digit, i) => (
        <Input
          key={i}
          ref={(el) => { (isForgot ? forgotRefs : otpRefs).current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          className="w-11 h-12 text-center text-xl font-bold border-2 border-emerald-200 focus:border-emerald-500"
          value={digit}
          onChange={(e) => handleOtpChange(i, e.target.value, isForgot)}
          onKeyDown={(e) => handleOtpKeyDown(i, e, isForgot)}
          onPaste={(e) => {
            e.preventDefault()
            const paste = e.clipboardData.getData('text')
            handleOtpChange(i, paste, isForgot)
          }}
        />
      ))}
    </div>
  )

  const renderAuthContent = () => {
    if (authView === 'verify-email') {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold">Verify Your Email</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit OTP sent to<br />
              <span className="font-medium text-foreground">{verifyEmail}</span>
            </p>
          </div>

          {renderOtpInputs(otpDigits, false)}

          {otpError && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-950/30 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {otpError}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            OTP expires in 10 minutes
          </div>

          <div className="flex flex-col gap-2">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500" onClick={() => handleVerifyOtp(false)} disabled={otpLoading}>
              {otpLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Verify OTP
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => handleSendOtp(verifyEmail, false)} disabled={otpLoading}>
                Resend OTP
              </Button>
              <Button variant="ghost" className="flex-1" onClick={resetToMain}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </div>
          </div>
        </div>
      )
    }

    if (authView === 'forgot-password') {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <Key className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold">Forgot Password</h3>
            <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset OTP</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email Address</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@jjmcoe.ac.in"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
            />
          </div>
          {otpError && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />{otpError}
            </div>
          )}
          <Button className="w-full bg-emerald-600 hover:bg-emerald-500" onClick={handleForgotPassword} disabled={otpLoading}>
            {otpLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send Reset OTP
          </Button>
          <Button variant="ghost" className="w-full" onClick={resetToMain}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
          </Button>
        </div>
      )
    }

    if (authView === 'reset-password') {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <Key className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold">Reset Password</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Enter OTP sent to <span className="font-medium">{forgotEmail}</span>
            </p>
          </div>

          {renderOtpInputs(forgotOtpDigits, true)}

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          {otpError && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />{otpError}
            </div>
          )}

          <Button className="w-full bg-emerald-600 hover:bg-emerald-500" onClick={() => handleVerifyOtp(true)} disabled={otpLoading}>
            {otpLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Reset Password
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setAuthView('forgot-password')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      )
    }

    if (authView === 'verification-success') {
      return (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold">Registration Submitted!</h3>
          <p className="text-sm text-muted-foreground">Your email is verified. A department admin and the main admin must approve your account before you can log in.</p>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-500" onClick={() => { setAuthView('main'); setActiveTab('login'); setPendingUser(null) }}>
            Go to Login
          </Button>
        </div>
      )
    }

    // Main auth view
    return (
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'login' | 'register'); setAuthView('main') }}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" placeholder="you@jjmcoe.ac.in" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" type="password" placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          </div>
          <div className="flex justify-end">
            <Button variant="link" className="text-emerald-600 p-0 h-auto text-sm" onClick={() => { setForgotEmail(loginEmail); setAuthView('forgot-password') }}>
              Forgot Password?
            </Button>
          </div>
            {authError && (
              <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {authError}
              </div>
            )}
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500" onClick={handleLogin} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Login
          </Button>
          <div className="text-center text-xs text-muted-foreground">
            Use your <span className="font-medium text-emerald-600">{VALID_DOMAIN}</span> college email for Students/Alumni
          </div>
        </TabsContent>

        <TabsContent value="register" className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="reg-role">Role *</Label>
            <Select value={regRole} onValueChange={(v) => setRegRole(v as UserRole)}>
              <SelectTrigger id="reg-role"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {needsCollegeEmail(regRole) && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Requires college email ({VALID_DOMAIN})
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-name">Full Name *</Label>
            <Input id="reg-name" placeholder="John Doe" value={regName} onChange={(e) => setRegName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email *</Label>
            <Input id="reg-email" type="email" placeholder={needsCollegeEmail(regRole) ? `you${VALID_DOMAIN}` : 'you@company.com'} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            {regEmail && needsCollegeEmail(regRole) && !regEmail.toLowerCase().endsWith(VALID_DOMAIN) && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Must end with {VALID_DOMAIN}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Password *</Label>
            <Input id="reg-password" type="password" placeholder="Min 6 characters" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-department">Department</Label>
            <Select value={regDepartment} onValueChange={setRegDepartment}>
              <SelectTrigger id="reg-department"><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-phone">Phone</Label>
            <Input id="reg-phone" type="tel" placeholder="+91 98765 43210" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-skills">Skills</Label>
            <Textarea id="reg-skills" placeholder="React, Python, ML..." value={regSkills} onChange={(e) => setRegSkills(e.target.value)} rows={2} />
          </div>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-500" onClick={handleRegister} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Register
          </Button>
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-4 right-4 z-50 rounded-full bg-black/20 backdrop-blur-sm text-white">
        <ThemeToggle />
      </div>
      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 px-4 py-20 md:py-28">
        <iframe
          className="absolute inset-0 z-0 h-full w-full scale-150 pointer-events-none"
          src="https://www.youtube.com/embed/c7ytQAkTDJw?autoplay=1&mute=1&controls=0&loop=1&playlist=c7ytQAkTDJw&rel=0&modestbranding=1"
          title="JJMCOE campus background video"
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-emerald-950/85 via-teal-900/75 to-cyan-950/85" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-100 text-sm font-medium">
            <Sparkles className="w-4 h-4" /> AI-Powered Career Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            Alumni<span className="text-emerald-300">Nexus</span>
          </h1>
          <p className="text-lg md:text-xl text-emerald-100/80 max-w-2xl mx-auto mb-8">Connecting Students, Alumni, Industry, and Opportunities Through AI</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 mb-10">
            <GraduationCap className="w-5 h-5 text-emerald-300" />
            <span className="text-emerald-100/90 text-sm md:text-base font-medium">Dr. J. J. Magdum College of Engineering, Jaysingpur</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-6 shadow-lg shadow-emerald-500/25" onClick={() => { setActiveTab('login'); setAuthView('main'); setAuthOpen(true) }}>
              Get Started <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white px-8 py-6 backdrop-blur-sm dark:border-slate-500/70 dark:bg-slate-900/50 dark:text-slate-100 dark:hover:bg-slate-800/80 dark:hover:text-white" onClick={() => { setActiveTab('register'); setAuthView('main'); setAuthOpen(true) }}>
              Create Account
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">A comprehensive platform designed to bridge the gap between academia and industry.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <Card key={f.title} className="group border-border/50 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{f.title}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      

      {/* Footer */}
      <footer className="bg-foreground text-muted-foreground py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <p>&copy; {new Date().getFullYear()} AlumniNexus &mdash; JJMCOE, Jaysingpur</p>
        </div>
      </footer>

      {/* Auth Dialog */}
      <Dialog open={authOpen} onOpenChange={(open) => { setAuthOpen(open); if (!open) resetToMain() }}>
        <DialogContent className="sm:max-w-md">
          {authView === 'main' ? (
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
              </DialogTitle>
              <DialogDescription className="text-center">
                {activeTab === 'login' ? 'Sign in to your AlumniNexus account' : 'Join the AlumniNexus community'}
              </DialogDescription>
            </DialogHeader>
          ) : (
            <DialogHeader>
              <DialogTitle className="sr-only">{authView}</DialogTitle>
            </DialogHeader>
          )}
          {renderAuthContent()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
