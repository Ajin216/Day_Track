import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import { validateEnv, getAllowedOrigins } from './config/env.js'
import authRoutes from './routes/authRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import goalRoutes from './routes/goalRoutes.js'
import { csrfProtection } from './middleware/csrfMiddleware.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'

// Load environment variables relative to this file
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })

// Validate required environment variables at startup (fail fast in production)
if (process.env.NODE_ENV !== 'test' || process.env.TEST_VALIDATE_ENV) {
  try {
    validateEnv()
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1)
    }
  }
}

const app = express()

// 1. Trust Proxy Configuration for Reverse Proxies (Render, Heroku, Nginx, AWS ALB, Cloudflare)
if (process.env.TRUST_PROXY) {
  const tp = process.env.TRUST_PROXY.toLowerCase().trim()
  if (tp === 'true') {
    app.set('trust proxy', true)
  } else if (!isNaN(Number(tp))) {
    app.set('trust proxy', Number(tp))
  } else {
    app.set('trust proxy', process.env.TRUST_PROXY.trim())
  }
}

// 2. Security Headers
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
)

// 3. Cross-Origin Resource Sharing (CORS) with Credentials Support
const allowedOrigins = getAllowedOrigins()

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, automated test suites)
      if (!origin) return callback(null, true)

      // Allow explicitly configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      // In non-production only, allow local developer origins
      if (
        process.env.NODE_ENV !== 'production' &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true)
      }

      // Reject unauthorized origins in production
      callback(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// 4. Body Parsers & Cookie Parser
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

// 5. Global API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
  },
})
app.use('/api', apiLimiter)

// 6. CSRF Protection for Cookie-Authenticated State-Changing Requests
app.use('/api', csrfProtection(allowedOrigins))

// 7. Production-Ready API Health & Status Endpoint
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1
  const statusCode = isDbConnected ? 200 : 503

  res.status(statusCode).json({
    success: isDbConnected,
    status: isDbConnected ? 'healthy' : 'unhealthy',
    message: isDbConnected
      ? 'DayTrack Backend API is healthy and operational.'
      : 'Database connection is not ready or disconnected.',
    database: isDbConnected ? 'connected' : 'disconnected',
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  })
})

// 8. Mount API Routes
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/goals', goalRoutes)

// 9. 404 Catch-All & Centralized Error Handler
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

// Graceful shutdown helper
const setupGracefulShutdown = (server) => {
  const shutdown = async (signal) => {
    console.log(`\n[DayTrack Server] Received ${signal}. Starting graceful shutdown...`)

    if (server) {
      server.close(async () => {
        console.log('[DayTrack Server] HTTP server closed.')
        try {
          await mongoose.connection.close(false)
          console.log('[DayTrack Server] MongoDB connection closed.')
          process.exit(0)
        } catch (err) {
          console.error('[DayTrack Server] Error closing MongoDB connection:', err.message)
          process.exit(1)
        }
      })

      // Force process exit if graceful shutdown exceeds 10s
      setTimeout(() => {
        console.error('[DayTrack Server] Forced shutdown after timeout.')
        process.exit(1)
      }, 10000).unref()
    } else {
      process.exit(0)
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

// Start Server only after MongoDB connection succeeds
const startServer = async () => {
  try {
    await connectDB()

    const server = app.listen(PORT, () => {
      console.log(
        `[DayTrack Server] Running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`
      )
    })

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `[DayTrack Server] Port ${PORT} is already in use. Another instance may already be running, or another process is using port ${PORT}.`
        )
      } else {
        console.error(`[DayTrack Server] Server error: ${error.message}`)
      }
      process.exit(1)
    })

    setupGracefulShutdown(server)

    return server
  } catch (error) {
    console.error(`[DayTrack Server] Failed to start server: ${error.message}`)
    process.exit(1)
  }
}

// Start server only when executed directly and not running under tests
if (process.env.NODE_ENV !== 'test' && !process.env.NODE_TEST_CONTEXT) {
  startServer()
}

export default app
export { startServer }
