'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Bot,
  Send,
  Plus,
  MessageSquare,
  Sparkles,
  Target,
  Map,
  HelpCircle,
  Building2,
  PanelLeftClose,
  PanelLeft,
  RotateCcw,
  X,
  FileText,
  BarChart3,
  AlertCircle,
} from 'lucide-react'

// ============================================================
// Types
// ============================================================

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatHistory {
  id: string
  title: string
  preview: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// Markdown-like Renderer
// ============================================================

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeLines: string[] = []
  let codeKey = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${codeKey++}`} className="bg-muted rounded-md p-3 my-2 overflow-x-auto text-sm">
            <code>{codeLines.join('\n')}</code>
          </pre>
        )
        codeLines = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
        codeLines = []
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<br key={`br-${i}`} />)
      continue
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h4 key={`h4-${i}`} className="font-semibold mt-3 mb-1">{renderInline(line.slice(4))}</h4>)
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={`h3-${i}`} className="font-semibold mt-3 mb-1">{renderInline(line.slice(3))}</h3>)
      continue
    }
    if (line.startsWith('# ')) {
      elements.push(<h2 key={`h2-${i}`} className="font-semibold mt-3 mb-1">{renderInline(line.slice(2))}</h2>)
      continue
    }

    // Unordered list items
    if (line.match(/^[*\-] /)) {
      const content = line.replace(/^[*\-] /, '')
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
          <span>{renderInline(content)}</span>
        </div>
      )
      continue
    }

    // Ordered list items
    if (line.match(/^\d+\. /)) {
      const match = line.match(/^(\d+)\. (.*)$/)
      if (match) {
        elements.push(
          <div key={`oli-${i}`} className="flex items-start gap-2 ml-2 my-0.5">
            <span className="font-medium flex-shrink-0">{match[1]}.</span>
            <span>{renderInline(match[2])}</span>
          </div>
        )
        continue
      }
    }

    // Regular paragraph
    elements.push(<p key={`p-${i}`} className="my-1">{renderInline(line)}</p>)
  }

  return elements
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text** or __text__
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// ============================================================
// Typing Indicator
// ============================================================

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}

// ============================================================
// Quick Action Dialog
// ============================================================

interface QuickActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  fields: { name: string; label: string; placeholder: string; defaultValue?: string }[]
  onSubmit: (values: Record<string, string>) => void
  loading: boolean
}

function QuickActionDialog({ open, onOpenChange, title, description, fields, onSubmit, loading }: QuickActionDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    fields.forEach(f => {
      defaults[f.name] = f.defaultValue || ''
    })
    return defaults
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {fields.map(field => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.name === 'message' ? (
                <Textarea
                  id={field.name}
                  value={values[field.name] || ''}
                  onChange={e => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  id={field.name}
                  value={values[field.name] || ''}
                  onChange={e => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              onSubmit(values)
              onOpenChange(false)
            }}
            disabled={loading || Object.values(values).some(v => !v.trim())}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Main AI Assistant Component
// ============================================================

export function AIAssistantView() {
  const { currentUser, addToast, setLoading } = useAppStore()
  const [histories, setHistories] = useState<ChatHistory[]>([])
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Quick action dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogKey, setDialogKey] = useState(0)
  const [dialogConfig, setDialogConfig] = useState<{
    title: string
    description: string
    fields: { name: string; label: string; placeholder: string; defaultValue?: string }[]
    action: string
  } | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Parse user skills from profile
  const getUserSkills = useCallback((): string[] => {
    if (!currentUser?.skills) return []
    try {
      const parsed = JSON.parse(currentUser.skills)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return currentUser.skills.split(',').map(s => s.trim()).filter(Boolean)
    }
    return []
  }, [currentUser])

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Create initial chat if none
  useEffect(() => {
    if (histories.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Hello! I'm your AI Career Assistant. I can help you with:

- **Resume reviews** and improvement suggestions
- **Skill gap analysis** for your target roles
- **Career roadmaps** to plan your professional journey
- **Interview preparation** with practice questions
- **Company suggestions** based on your skills

Feel free to ask me anything about your career development!`,
        timestamp: new Date(),
      }
      const newHistory: ChatHistory = {
        id: crypto.randomUUID(),
        title: 'New Conversation',
        preview: 'Start chatting about your career...',
        messages: [welcomeMsg],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const timer = window.setTimeout(() => {
        setHistories([newHistory])
        setMessages([welcomeMsg])
        setActiveHistoryId(newHistory.id)
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [])

  // Update active history messages
  useEffect(() => {
    if (!activeHistoryId || messages.length === 0) return
    const timer = window.setTimeout(() => {
      setHistories(prev =>
        prev.map(h => {
          if (h.id !== activeHistoryId) return h
          const firstUserMsg = messages.find(m => m.role === 'user')
          return {
            ...h,
            messages,
            title: firstUserMsg ? firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '') : h.title,
            preview: messages[messages.length - 1]?.content.slice(0, 60) + (messages[messages.length - 1]?.content.length > 60 ? '...' : '') || '',
            updatedAt: new Date(),
          }
        })
      )
    }, 0)
    return () => window.clearTimeout(timer)
  }, [messages, activeHistoryId])

  const createNewChat = () => {
    const welcomeMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'How can I help you with your career today?',
      timestamp: new Date(),
    }
    const newHistory: ChatHistory = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      preview: 'Start chatting...',
      messages: [welcomeMsg],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setHistories(prev => [newHistory, ...prev])
    setMessages([welcomeMsg])
    setActiveHistoryId(newHistory.id)
    setError(null)
  }

  const switchToHistory = (historyId: string) => {
    const history = histories.find(h => h.id === historyId)
    if (history) {
      setMessages(history.messages)
      setActiveHistoryId(historyId)
      setError(null)
    }
  }

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, msg])
  }

  const sendMessage = async (message: string) => {
    if (!message.trim() || isTyping) return

    addMessage('user', message.trim())
    setInput('')
    setIsTyping(true)
    setError(null)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'career-chat', data: { message: message.trim() } }),
      })
      if (!res.ok) throw new Error('Failed to get response')
      const data = await res.json()
      const responseText = typeof data === 'string' ? data : data.response || data.message || JSON.stringify(data)
      addMessage('assistant', responseText)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsTyping(false)
    }
  }

  const sendQuickAction = async (action: string, data: Record<string, string>) => {
    setIsTyping(true)
    setError(null)

    // Add a user message showing what they asked
    const actionLabels: Record<string, string> = {
      'resume-review': 'Review my resume for the role of',
      'skill-gap': 'Analyze my skill gap for the role of',
      'career-roadmap': 'Create a career roadmap from',
      'interview-questions': 'Generate interview questions for',
      'company-suggestions': 'Suggest companies matching my skills',
    }

    const label = actionLabels[action] || 'Quick action'
    const summary = Object.values(data).filter(Boolean).join(', ')
    addMessage('user', `${label}${summary ? ': ' + summary : ''}`)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      })
      if (!res.ok) throw new Error('Failed to get response')
      const result = await res.json()
      const responseText = typeof result === 'string' ? result : result.response || result.message || JSON.stringify(result)
      addMessage('assistant', responseText)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize
    const target = e.target
    target.style.height = 'auto'
    target.style.height = Math.min(target.scrollHeight, 150) + 'px'
  }

  const openQuickAction = (action: string) => {
    const skills = getUserSkills()
    const skillsStr = skills.join(', ')

    switch (action) {
      case 'resume-review':
        setDialogConfig({
          title: 'Review Resume',
          description: 'Get AI-powered feedback on your resume for a specific role.',
          fields: [
            { name: 'targetRole', label: 'Target Role', placeholder: 'e.g. Frontend Developer' },
            { name: 'resumeContent', label: 'Resume Summary (optional)', placeholder: 'Paste key points from your resume...' },
          ],
          action: 'resume-review',
        })
        break
      case 'skill-gap':
        setDialogConfig({
          title: 'Skill Gap Analysis',
          description: 'Identify skills you need to develop for your target role.',
          fields: [
            { name: 'targetRole', label: 'Target Role', placeholder: 'e.g. Full Stack Developer' },
            { name: 'userSkills', label: 'Your Skills', placeholder: 'React, Python, SQL...', defaultValue: skillsStr },
          ],
          action: 'skill-gap',
        })
        break
      case 'career-roadmap':
        setDialogConfig({
          title: 'Career Roadmap',
          description: 'Get a personalized career roadmap to reach your goals.',
          fields: [
            { name: 'currentRole', label: 'Current Role / Status', placeholder: 'e.g. CS Student', defaultValue: currentUser?.role === 'STUDENT' ? 'Student' : currentUser?.designation || '' },
            { name: 'targetRole', label: 'Target Role', placeholder: 'e.g. Senior Software Engineer' },
          ],
          action: 'career-roadmap',
        })
        break
      case 'interview-questions':
        setDialogConfig({
          title: 'Interview Questions',
          description: 'Generate relevant interview questions for practice.',
          fields: [
            { name: 'role', label: 'Job Role', placeholder: 'e.g. Software Engineer' },
          ],
          action: 'interview-questions',
        })
        break
      case 'company-suggestions':
        setDialogConfig({
          title: 'Company Suggestions',
          description: 'Get company recommendations based on your skill set.',
          fields: [
            { name: 'userSkills', label: 'Your Skills', placeholder: 'React, TypeScript, Node.js...', defaultValue: skillsStr },
          ],
          action: 'company-suggestions',
        })
        break
    }
    setDialogOpen(true)
    setDialogKey(k => k + 1)
  }

  const handleDialogSubmit = (values: Record<string, string>) => {
    if (!dialogConfig) return
    sendQuickAction(dialogConfig.action, values)
  }

  const retryLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMsg) {
      setMessages(prev => prev.slice(0, -1))
      sendMessage(lastUserMsg.content)
    }
    setError(null)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const quickActions = [
    { label: 'Review Resume', icon: FileText, action: 'resume-review' },
    { label: 'Skill Gap', icon: BarChart3, action: 'skill-gap' },
    { label: 'Career Roadmap', icon: Map, action: 'career-roadmap' },
    { label: 'Interview Prep', icon: HelpCircle, action: 'interview-questions' },
    { label: 'Companies', icon: Building2, action: 'company-suggestions' },
  ]

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Panel - Chat History */}
      <aside
        className={`${sidebarOpen ? 'w-72' : 'w-0'} border-r bg-muted/30 flex-shrink-0 transition-all duration-200 overflow-hidden flex flex-col`}
      >
        <div className="p-3 border-b">
          <Button onClick={createNewChat} variant="outline" className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {histories.map(history => (
              <button
                key={history.id}
                onClick={() => switchToHistory(history.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-accent ${
                  activeHistoryId === history.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{history.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{history.preview}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {history.updatedAt.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shrink-0"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">AI Career Assistant</h1>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">GPT-Powered</Badge>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                  </div>
                  <p
                    className={`text-[10px] mt-1.5 ${
                      msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md">
                  <TypingIndicator />
                </div>
              </div>
            )}

            {/* Error with Retry */}
            {error && (
              <div className="flex justify-start">
                <div className="bg-destructive/10 border border-destructive/20 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={retryLastMessage}
                    className="mt-2 h-7 text-xs gap-1 text-destructive hover:text-destructive"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry
                  </Button>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Quick Actions & Input */}
        <div className="border-t bg-background">
          {/* Quick Actions */}
          <div className="max-w-3xl mx-auto px-4 py-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {quickActions.map(qa => (
                <Button
                  key={qa.action}
                  variant="outline"
                  size="sm"
                  onClick={() => openQuickAction(qa.action)}
                  disabled={isTyping}
                  className="flex-shrink-0 gap-1.5 h-8 text-xs"
                >
                  <qa.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{qa.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="max-w-3xl mx-auto px-4 pb-4">
            <div className="flex items-end gap-2 rounded-xl border bg-background p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about careers, skills, interviews..."
                className="min-h-[36px] max-h-[150px] resize-none border-0 bg-transparent focus-visible:ring-0 p-1 text-sm flex-1"
                rows={1}
                disabled={isTyping}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="h-8 w-8 rounded-lg shrink-0"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
              AI responses are generated suggestions. Verify information independently.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Dialog */}
      {dialogConfig && (
        <QuickActionDialog
          key={dialogKey}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={dialogConfig.title}
          description={dialogConfig.description}
          fields={dialogConfig.fields}
          onSubmit={handleDialogSubmit}
          loading={isTyping}
        />
      )}
    </div>
  )
}
