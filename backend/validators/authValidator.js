const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateRegister = (body) => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, message: 'Request body is missing.' }
  }

  const { name, email, password } = body

  if (!name || typeof name !== 'string' || !name.trim()) {
    return { isValid: false, message: 'Name is required.' }
  }

  if (name.trim().length > 100) {
    return { isValid: false, message: 'Name cannot exceed 100 characters.' }
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    return { isValid: false, message: 'Email address is required.' }
  }

  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Please provide a valid email address.' }
  }

  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required.' }
  }

  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' }
  }

  return { isValid: true }
}

export const validateLogin = (body) => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, message: 'Request body is missing.' }
  }

  const { email, password } = body

  if (!email || typeof email !== 'string' || !email.trim()) {
    return { isValid: false, message: 'Email address is required.' }
  }

  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Please provide a valid email address.' }
  }

  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required.' }
  }

  return { isValid: true }
}

export const validateGoogleAuth = (body) => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, message: 'Request body is missing.' }
  }

  const token = body.idToken || body.credential

  if (!token || typeof token !== 'string' || !token.trim()) {
    return { isValid: false, message: 'Google ID token (credential) is required.' }
  }

  return { isValid: true }
}

