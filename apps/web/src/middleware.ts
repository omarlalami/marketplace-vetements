// Middleware de protection des routes

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
/* //npm install jose
//import { jwtVerify } from 'jose'

// Fonction utilitaire pour vérifier le JWT
async function verifyJWT(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (err) {
    console.error("❌ JWT verification failed:", err)
    return null
  }
}
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log(`🔍 Middleware - Path: ${pathname}`)

  if (pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('auth-store')
    console.log(`🔍 Auth cookie present:`, !!authCookie)

    if (!authCookie) {
      console.log(`❌ No auth cookie, redirecting to /login`)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Vérification du JWT avec jose
    const decodedAuthData = await verifyJWT(authCookie.value)
    console.log("🔑 JWT payload:", decodedAuthData)

    if (!decodedAuthData) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Optionnel : Vérifier que le payload contient bien user + token
    if (!decodedAuthData.user || !decodedAuthData.token) {
      console.log(`❌ Invalid auth data, redirecting to /login`)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    console.log(`✅ Valid auth, access granted`)
  }

  return NextResponse.next()
} */



export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/dashboard")) {
    const authCookie = request.cookies.get('auth-store')

    if (!authCookie) {
      console.log("❌ No access token, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Le cookie contient directement le token JWT
    const token = authCookie.value;

    if (!token || token.trim() === '') {
      console.log("❌ Empty token, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    console.log('✅ Token present:', token.substring(0, 20) + '...');

  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}