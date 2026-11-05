// In production, fallback to relative '/api' if VITE_API_URL is omitted (prevents hardcoded localhost in prod)
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')

/**
 * Custom API Error class with HTTP status code and response payload
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Builds a query string from a key-value params object
 */
function buildQueryString(params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value)
    }
  }
  const str = query.toString()
  return str ? `?${str}` : ''
}

/**
 * Centralized fetch wrapper with credentials: 'include' and consistent error handling
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Ensures HTTP-only authentication cookies are sent and received
  }

  let response
  try {
    response = await fetch(url, config)
  } catch (networkError) {
    throw new ApiError(
      'Unable to connect to DayTrack server. Please check your internet connection or backend status.',
      0,
      networkError
    )
  }

  let data = null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const errorMessage =
      data?.message || `Request failed with status ${response.status} (${response.statusText})`
    throw new ApiError(errorMessage, response.status, data)
  }

  return data
}

export const api = {
  get(endpoint, params = {}, options = {}) {
    const queryString = buildQueryString(params)
    return request(`${endpoint}${queryString}`, {
      method: 'GET',
      ...options,
    })
  },

  post(endpoint, body = {}, options = {}) {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    })
  },

  patch(endpoint, body = {}, options = {}) {
    return request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    })
  },

  delete(endpoint, options = {}) {
    return request(endpoint, {
      method: 'DELETE',
      ...options,
    })
  },
}

export default api

