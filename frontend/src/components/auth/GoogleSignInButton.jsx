import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

/**
 * Standard Google 'G' multicolored logo SVG
 */
function GoogleLogoSvg() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

/**
 * Reusable Google Sign-In button component.
 * Integrates official Google Identity Services (GIS) with polished, modern DayTrack styling.
 */
export default function GoogleSignInButton({ mode = 'login', onSuccess, onError, disabled = false }) {
  const { loginWithGoogle } = useAuth()
  const gisContainerRef = useRef(null)
  const isInitializedRef = useRef(false)
  const [isLoading, setIsLoading] = useState(false)
  const [gisRendered, setGisRendered] = useState(false)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  // Keep latest callbacks in ref to avoid re-initializing GIS on re-renders
  const callbacksRef = useRef({ onSuccess, onError, loginWithGoogle, isLoading })
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, loginWithGoogle, isLoading }
  }, [onSuccess, onError, loginWithGoogle, isLoading])

  const handleCredentialResponse = useCallback(async (response) => {
    const { onSuccess: successCb, onError: errorCb, loginWithGoogle: loginFn, isLoading: loadingState } =
      callbacksRef.current
    if (loadingState) return

    if (!response?.credential) {
      errorCb?.('No credential received from Google.')
      return
    }

    setIsLoading(true)
    try {
      const res = await loginFn(response.credential)
      successCb?.(res?.user)
    } catch (err) {
      const msg = err.message || 'Google authentication failed. Please try again.'
      errorCb?.(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialize and render official Google Identity Services
  useEffect(() => {
    let isMounted = true

    const setupGis = () => {
      if (!window.google?.accounts?.id || !clientId || !gisContainerRef.current) {
        return
      }

      try {
        // Initialize only once per client ID
        if (!isInitializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              if (isMounted) {
                handleCredentialResponse(response)
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          })
          isInitializedRef.current = true
        }

        // Accurately measure parent container width to prevent mobile overflow
        const parentWidth =
          gisContainerRef.current.parentElement?.getBoundingClientRect().width ||
          gisContainerRef.current.parentElement?.offsetWidth ||
          gisContainerRef.current.offsetWidth ||
          320

        const buttonWidth = Math.min(Math.max(Math.floor(parentWidth), 200), 400)

        // Render official GIS button into container with clean white outline theme
        gisContainerRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(gisContainerRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: mode === 'register' ? 'signup_with' : 'continue_with',
          logo_alignment: 'left',
          width: buttonWidth,
        })

        // Check if GIS inserted iframe successfully
        setTimeout(() => {
          if (isMounted && gisContainerRef.current) {
            const hasChildren = gisContainerRef.current.children.length > 0
            setGisRendered(hasChildren)
          }
        }, 300)
      } catch (err) {
        console.warn('GIS button render error:', err)
        if (isMounted) {
          setGisRendered(false)
        }
      }
    }

    if (window.google?.accounts?.id) {
      setupGis()
    } else {
      const existingScript = document.getElementById('google-gsi-client')
      if (!existingScript) {
        const script = document.createElement('script')
        script.id = 'google-gsi-client'
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
          if (isMounted) setupGis()
        }
        script.onerror = () => {
          console.warn('Google Identity Services script failed to load (offline or blocked).')
        }
        document.body.appendChild(script)
      } else {
        existingScript.addEventListener('load', setupGis)
      }
    }

    // Re-render GIS button width on resize without state updates
    let resizeTimer
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (isMounted && window.google?.accounts?.id && isInitializedRef.current && gisContainerRef.current) {
          const parentWidth = gisContainerRef.current.parentElement?.offsetWidth
          if (parentWidth) {
            const newWidth = Math.min(Math.max(Math.floor(parentWidth), 200), 400)
            gisContainerRef.current.innerHTML = ''
            window.google.accounts.id.renderButton(gisContainerRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: mode === 'register' ? 'signup_with' : 'continue_with',
              logo_alignment: 'left',
              width: newWidth,
            })
          }
        }
      }, 250)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      isMounted = false
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
    }
  }, [clientId, mode, handleCredentialResponse])

  // Custom fallback click handler (invokes prompt if GIS is initialized, or warns user)
  const handleCustomButtonClick = () => {
    if (disabled || isLoading) return

    if (window.google?.accounts?.id && clientId) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason?.()
            console.warn('GIS prompt not displayed:', reason)
            onError?.(
              'Google Sign-In could not open. Please ensure http://localhost:5173 is added to "Authorized JavaScript origins" in Google Cloud Console.'
            )
          }
        })
      } catch (err) {
        onError?.(err.message || 'Failed to open Google Sign-In prompt.')
      }
    } else {
      onError?.(
        'Google Sign-In is initializing or client ID is not configured. Please check your setup.'
      )
    }
  }

  const buttonLabel = mode === 'register' ? 'Sign up with Google' : 'Continue with Google'

  return (
    <div className="w-full max-w-full">
      {/* Official GIS container: will host Google's rendered button when active */}
      <div
        ref={gisContainerRef}
        className={`w-full max-w-full flex justify-center items-center min-h-[44px] overflow-hidden ${
          gisRendered && !isLoading ? 'block' : 'hidden'
        }`}
        aria-hidden={!gisRendered || isLoading}
      />

      {/* Styled DayTrack button: shown while loading, or as clean white fallback */}
      {(!gisRendered || isLoading) && (
        <button
          type="button"
          disabled={disabled || isLoading}
          onClick={handleCustomButtonClick}
          className="w-full max-w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-slate-900 text-sm sm:text-base font-medium shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed select-none cursor-pointer"
          aria-label={buttonLabel}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2.5">
              <div className="w-4 h-4 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-slate-600 font-medium">Connecting to Google...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 w-full">
              <GoogleLogoSvg />
              <span className="truncate">{buttonLabel}</span>
            </div>
          )}
        </button>
      )}
    </div>
  )
}
