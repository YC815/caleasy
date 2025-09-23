import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

const isClerkConfigured =
  !!process.env.CLERK_SECRET_KEY &&
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

let hasLoggedMissingClerkConfig = false

const fallbackMiddleware = (request: NextRequest) => {
  if (!hasLoggedMissingClerkConfig) {
    console.warn('[AUTH] Clerk 未完整設定，跳過全域權限保護。', {
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      path: request.nextUrl.pathname,
    })
    hasLoggedMissingClerkConfig = true
  }

  return NextResponse.next()
}

const enforcedMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

const middleware = isClerkConfigured ? enforcedMiddleware : fallbackMiddleware

export default middleware

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}