import { User } from '../models/User.js'
import { setTokenCookie, clearTokenCookie } from '../utils/generateToken.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { verifyGoogleIdToken } from '../services/googleAuthService.js'

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, timezone, preferences } = req.body

  const normalizedEmail = email.toLowerCase().trim()

  // Check if user with this email already exists
  const existingUser = await User.findOne({ email: normalizedEmail })
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email address already exists.',
    })
  }

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    timezone: timezone || 'Asia/Kolkata',
    preferences: preferences || { theme: 'light' },
  })

  // Set JWT authentication cookie
  setTokenCookie(res, user._id)

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
    },
  })
})

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const normalizedEmail = email.toLowerCase().trim()

  // Retrieve user with password hash explicitly selected
  const user = await User.findOne({ email: normalizedEmail }).select('+password')

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    })
  }

  // Set JWT authentication cookie
  setTokenCookie(res, user._id)

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
    },
  })
})

/**
 * @desc    Authenticate or register user via Google ID Token
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const token = req.body.idToken || req.body.credential

  // Verify token cryptographically and extract claims
  const { googleId, email, name, avatar } = await verifyGoogleIdToken(token)

  // 1. Check if user already exists with this googleId
  let user = await User.findOne({ googleId })

  if (user) {
    if (!user.avatar && avatar) {
      user.avatar = avatar
      await user.save()
    }

    setTokenCookie(res, user._id)

    return res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          authProvider: user.authProvider,
          timezone: user.timezone,
          preferences: user.preferences,
          createdAt: user.createdAt,
        },
      },
    })
  }

  // 2. Check if user exists with the verified Google email address
  const existingUserByEmail = await User.findOne({ email })

  if (existingUserByEmail) {
    // If the account is already associated with another googleId, reject conflict
    if (existingUserByEmail.googleId && existingUserByEmail.googleId !== googleId) {
      return res.status(409).json({
        success: false,
        message: 'This email is already associated with a different Google account.',
      })
    }

    // Link Google ID to existing account
    existingUserByEmail.googleId = googleId
    if (!existingUserByEmail.avatar && avatar) {
      existingUserByEmail.avatar = avatar
    }
    await existingUserByEmail.save()

    setTokenCookie(res, existingUserByEmail._id)

    return res.status(200).json({
      success: true,
      message: 'Account linked with Google successfully',
      data: {
        user: {
          id: existingUserByEmail._id.toString(),
          name: existingUserByEmail.name,
          email: existingUserByEmail.email,
          avatar: existingUserByEmail.avatar,
          authProvider: existingUserByEmail.authProvider,
          timezone: existingUserByEmail.timezone,
          preferences: existingUserByEmail.preferences,
          createdAt: existingUserByEmail.createdAt,
        },
      },
    })
  }

  // 3. User does not exist -> create new Google-authenticated user (no password required)
  user = await User.create({
    name: name || email.split('@')[0],
    email,
    googleId,
    authProvider: 'google',
    avatar,
    timezone: 'Asia/Kolkata',
    preferences: { theme: 'light' },
  })

  setTokenCookie(res, user._id)

  return res.status(201).json({
    success: true,
    message: 'Google account registered successfully',
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        authProvider: user.authProvider,
        timezone: user.timezone,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
    },
  })
})

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by authMiddleware)
 */
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authenticated user profile retrieved successfully',
    data: {
      user: req.user,
    },
  })
})

/**
 * @desc    Log out user and clear authentication cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res)

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
})

