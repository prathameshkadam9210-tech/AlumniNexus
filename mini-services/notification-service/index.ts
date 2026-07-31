import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = 3003

// Track connected users
const connectedUsers = new Map<string, string>() // socketId -> userId

// Create HTTP server WITHOUT a request handler callback
const httpServer = createServer()

// Socket.io server
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  // Disable serving Socket.io client files to reduce request interception
  serveClient: false,
})

// Handle HTTP health endpoint via Socket.io's engine middleware
io.engine.on('initial_headers', (headers, req) => {
  // This runs before Socket.io processes the request
})

// Use the engine's handleRequest to intercept before Socket.io's transport layer
// We'll add a pre-request hook
const originalListeners = httpServer.listeners('request') as Array<(...args: unknown[]) => void>

// Remove all existing request listeners (including Socket.io's)
for (const listener of originalListeners) {
  httpServer.removeListener('request', listener)
}

// Add our custom request handler FIRST
httpServer.on('request', (req, res) => {
  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', port: PORT }))
    return
  }
  // Forward to Socket.io's request handler
  for (const listener of originalListeners) {
    listener(req, res)
  }
})

io.on('connection', (socket) => {
  console.log(`[NotificationService] Client connected: ${socket.id}`)

  // Join a room identified by userId
  socket.on('join-room', (data: { userId: string }) => {
    const { userId } = data
    socket.join(userId)
    connectedUsers.set(socket.id, userId)
    console.log(`[NotificationService] Socket ${socket.id} joined room: ${userId}`)
    console.log(`[NotificationService] Active connections: ${connectedUsers.size}`)
  })

  // Listen for send-notification event and broadcast to target user room
  socket.on('send-notification', (data: { userId: string; notification: Record<string, unknown> }) => {
    const { userId, notification } = data
    console.log(`[NotificationService] Forwarding notification to user: ${userId}`)
    io.to(userId).emit('new-notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    })
  })

  socket.on('disconnect', () => {
    const userId = connectedUsers.get(socket.id)
    connectedUsers.delete(socket.id)
    console.log(`[NotificationService] Client disconnected: ${socket.id}${userId ? ` (user: ${userId})` : ''}`)
    console.log(`[NotificationService] Active connections: ${connectedUsers.size}`)
  })

  socket.on('error', (error) => {
    console.error(`[NotificationService] Socket error (${socket.id}):`, error)
  })
})

// Helper: send notification to a specific user from server-side
function sendNotificationToUser(userId: string, notification: Record<string, unknown>) {
  io.to(userId).emit('new-notification', {
    ...notification,
    timestamp: new Date().toISOString(),
  })
  console.log(`[NotificationService] Server-sent notification to user: ${userId}`)
}

// Helper: simulate real-time job alerts
function simulateJobAlerts() {
  const sampleJobAlerts = [
    {
      title: 'New Job Posted',
      message: 'Senior Software Engineer at Google - Check it out!',
      type: 'JOB_ALERT',
      link: '/jobs',
    },
    {
      title: 'Deadline Approaching',
      message: 'Application for Data Analyst at Amazon closes tomorrow!',
      type: 'JOB_ALERT',
      link: '/jobs',
    },
    {
      title: 'Internship Opportunity',
      message: 'Microsoft is hiring summer interns - Apply now!',
      type: 'JOB_ALERT',
      link: '/jobs',
    },
  ]

  setInterval(() => {
    if (connectedUsers.size === 0) return

    const alert = sampleJobAlerts[Math.floor(Math.random() * sampleJobAlerts.length)]
    for (const userId of new Set(connectedUsers.values())) {
      sendNotificationToUser(userId, alert)
    }
    console.log(`[NotificationService] Broadcasted job alert to ${new Set(connectedUsers.values()).size} users`)
  }, 60000)
}

// Helper: simulate mentorship pings
function simulateMentorshipPings() {
  const sampleMentorshipPings = [
    {
      title: 'Mentorship Request',
      message: 'A student has requested a mentorship session with you.',
      type: 'MENTORSHIP',
      link: '/mentorship',
    },
    {
      title: 'Upcoming Session',
      message: 'Your mentorship session is scheduled for tomorrow at 3:00 PM.',
      type: 'MENTORSHIP',
      link: '/mentorship',
    },
    {
      title: 'Session Feedback',
      message: 'Please rate your recent mentorship session.',
      type: 'MENTORSHIP',
      link: '/mentorship',
    },
  ]

  setInterval(() => {
    if (connectedUsers.size === 0) return

    const ping = sampleMentorshipPings[Math.floor(Math.random() * sampleMentorshipPings.length)]
    for (const userId of new Set(connectedUsers.values())) {
      sendNotificationToUser(userId, ping)
    }
    console.log(`[NotificationService] Broadcasted mentorship ping to ${new Set(connectedUsers.values()).size} users`)
  }, 90000)
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`[NotificationService] WebSocket + HTTP server running on port ${PORT}`)
  console.log(`[NotificationService] Health endpoint: http://localhost:${PORT}/api/health`)
  simulateJobAlerts()
  simulateMentorshipPings()
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[NotificationService] Received SIGTERM, shutting down...')
  httpServer.close(() => {
    console.log('[NotificationService] Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[NotificationService] Received SIGINT, shutting down...')
  httpServer.close(() => {
    console.log('[NotificationService] Server closed')
    process.exit(0)
  })
})
